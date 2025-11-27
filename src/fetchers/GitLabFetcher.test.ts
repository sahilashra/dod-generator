import * as fc from 'fast-check';
import axios from 'axios';
import { GitLabFetcher } from './GitLabFetcher';
import { MergeRequest } from '../models/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GitLabFetcher', () => {
  const baseUrl = 'https://gitlab.example.com';
  const token = 'test-token';
  let fetcher: GitLabFetcher;

  beforeEach(() => {
    fetcher = new GitLabFetcher(baseUrl, token);
    jest.clearAllMocks();
  });

  describe('Property Tests', () => {
    /**
     * Feature: generate-dod, Property 1: Complete data extraction from API responses (GitLab portion)
     * Validates: Requirements 2.2
     */
    test('Property 1: Complete data extraction from API responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectPath: fc.constantFrom('group/project', 'org/repo', 'team/app'),
            mrIid: fc.integer({ min: 1, max: 9999 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constantFrom('success', 'failed', 'running', 'pending', 'canceled'),
            changes: fc.array(
              fc.record({
                new_path: fc.string({ minLength: 1, maxLength: 50 }),
                old_path: fc.string({ minLength: 1, maxLength: 50 })
              }),
              { minLength: 0, maxLength: 10 }
            ),
            created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString())
          }),
          async (mrData) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            // Construct MR URL
            const mrUrl = `${baseUrl}/${mrData.projectPath}/-/merge_requests/${mrData.mrIid}`;

            // Mock API responses
            const mockMrResponse = {
              data: {
                title: mrData.title,
                status: mrData.status,
                changes: mrData.changes
              }
            };

            const mockPipelinesResponse = {
              data: [
                {
                  status: mrData.status,
                  created_at: mrData.created_at,
                  updated_at: mrData.created_at
                }
              ]
            };

            mockedAxios.get
              .mockResolvedValueOnce(mockMrResponse)
              .mockResolvedValueOnce(mockPipelinesResponse);

            // Fetch the MR
            const result = await fetcher.fetchMergeRequest(mrUrl);

            // Verify all required fields are extracted
            expect(result).toBeDefined();
            expect(result.title).toBe(mrData.title);
            expect(result.ciStatus).toBeDefined();
            expect(['passed', 'failed', 'running', 'pending', 'canceled']).toContain(result.ciStatus);
            expect(Array.isArray(result.changedFiles)).toBe(true);
            expect(result.webUrl).toBe(mrUrl);

            // Verify changed files are extracted
            const expectedFiles = mrData.changes.map(c => c.new_path || c.old_path);
            expect(result.changedFiles).toEqual(expectedFiles);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: generate-dod, Property 4: Most recent pipeline selection
     * Validates: Requirements 2.3
     */
    test('Property 4: Most recent pipeline selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectPath: fc.constantFrom('group/project', 'org/team/repo'),
            mrIid: fc.integer({ min: 1, max: 999 }),
            pipelines: fc.array(
              fc.record({
                status: fc.constantFrom('success', 'failed', 'running', 'pending'),
                created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() })
              }),
              { minLength: 2, maxLength: 5 }
            )
          }),
          async (data) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            const mrUrl = `${baseUrl}/${data.projectPath}/-/merge_requests/${data.mrIid}`;

            // Sort pipelines to find the most recent one
            const sortedPipelines = [...data.pipelines].sort((a, b) => {
              const dateA = new Date(a.updated_at).getTime();
              const dateB = new Date(b.updated_at).getTime();
              return dateB - dateA;
            });

            const mostRecentPipeline = sortedPipelines[0];

            // Mock API responses
            const mockMrResponse = {
              data: {
                title: 'Test MR',
                changes: []
              }
            };

            const mockPipelinesResponse = {
              data: data.pipelines.map(p => ({
                status: p.status,
                created_at: p.created_at.toISOString(),
                updated_at: p.updated_at.toISOString()
              }))
            };

            mockedAxios.get
              .mockResolvedValueOnce(mockMrResponse)
              .mockResolvedValueOnce(mockPipelinesResponse);

            // Fetch the MR
            const result = await fetcher.fetchMergeRequest(mrUrl);

            // Map the expected status
            const expectedStatus = mostRecentPipeline.status === 'success' ? 'passed' : mostRecentPipeline.status;

            // Verify the most recent pipeline status is used
            expect(result.ciStatus).toBe(expectedStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: generate-dod, Property 21: Error propagation from API failures (GitLab portion)
     * Validates: Requirements 2.5
     */
    test('Property 21: Error propagation from API failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectPath: fc.constantFrom('group/project', 'org/repo'),
            mrIid: fc.integer({ min: 1, max: 999 }),
            errorType: fc.constantFrom(
              { code: 'ECONNREFUSED', status: null, message: 'Connection refused' },
              { code: 'ENOTFOUND', status: null, message: 'Not found' },
              { code: 'ECONNABORTED', status: null, message: 'timeout of 30000ms exceeded' },
              { code: null, status: 401, message: 'Unauthorized' },
              { code: null, status: 403, message: 'Forbidden' },
              { code: null, status: 404, message: 'Not Found' },
              { code: null, status: 429, message: 'Too Many Requests' },
              { code: null, status: 500, message: 'Internal Server Error' }
            )
          }),
          async (data) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            const mrUrl = `${baseUrl}/${data.projectPath}/-/merge_requests/${data.mrIid}`;

            // Mock API error
            const error: any = new Error(data.errorType.message);
            error.isAxiosError = true;
            error.code = data.errorType.code;
            
            if (data.errorType.status) {
              error.response = {
                status: data.errorType.status,
                data: {}
              };
            }

            mockedAxios.get.mockRejectedValue(error);

            // Attempt to fetch the MR and verify it throws
            await expect(fetcher.fetchMergeRequest(mrUrl)).rejects.toThrow();

            // Verify error message contains relevant information
            try {
              await fetcher.fetchMergeRequest(mrUrl);
              fail('Should have thrown an error');
            } catch (e) {
              const errorMessage = (e as Error).message;
              
              // Error message should mention GitLab
              expect(errorMessage).toMatch(/GitLab/i);
              
              // Error message should contain specific failure information
              if (data.errorType.code === 'ECONNREFUSED' || data.errorType.code === 'ENOTFOUND') {
                expect(errorMessage).toMatch(/unreachable|connect/i);
              } else if (data.errorType.code === 'ECONNABORTED' || data.errorType.message.includes('timeout')) {
                expect(errorMessage).toMatch(/timeout/i);
              } else if (data.errorType.status === 401) {
                expect(errorMessage).toMatch(/authentication/i);
              } else if (data.errorType.status === 403) {
                expect(errorMessage).toMatch(/authorization|permission/i);
              } else if (data.errorType.status === 404) {
                expect(errorMessage).toMatch(/not found/i);
              } else if (data.errorType.status === 429) {
                expect(errorMessage).toMatch(/rate limit/i);
              } else if (data.errorType.status && data.errorType.status >= 500) {
                expect(errorMessage).toMatch(/server error/i);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    test('fetchMergeRequest with successful response', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/123';
      
      const mockMrResponse = {
        data: {
          title: 'Add new feature',
          changes: [
            { new_path: 'src/feature.ts', old_path: 'src/feature.ts' },
            { new_path: 'tests/feature.test.ts', old_path: null }
          ]
        }
      };

      const mockPipelinesResponse = {
        data: [
          {
            status: 'success',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:30:00Z'
          }
        ]
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockMrResponse)
        .mockResolvedValueOnce(mockPipelinesResponse);

      const result = await fetcher.fetchMergeRequest(mrUrl);

      expect(result.title).toBe('Add new feature');
      expect(result.ciStatus).toBe('passed');
      expect(result.changedFiles).toEqual(['src/feature.ts', 'tests/feature.test.ts']);
      expect(result.webUrl).toBe(mrUrl);
    });

    test('pipeline selection with multiple pipelines', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/456';
      
      const mockMrResponse = {
        data: {
          title: 'Fix bug',
          changes: []
        }
      };

      const mockPipelinesResponse = {
        data: [
          {
            status: 'failed',
            created_at: '2024-01-01T09:00:00Z',
            updated_at: '2024-01-01T09:15:00Z'
          },
          {
            status: 'success',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:30:00Z'
          },
          {
            status: 'running',
            created_at: '2024-01-01T11:00:00Z',
            updated_at: '2024-01-01T11:05:00Z'
          }
        ]
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockMrResponse)
        .mockResolvedValueOnce(mockPipelinesResponse);

      const result = await fetcher.fetchMergeRequest(mrUrl);

      // Should select the most recent pipeline (11:05:00)
      expect(result.ciStatus).toBe('running');
    });

    test('error handling with 404 response', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/999';
      
      const error: any = new Error('Not Found');
      error.isAxiosError = true;
      error.response = {
        status: 404,
        data: {}
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(fetcher.fetchMergeRequest(mrUrl)).rejects.toThrow(/not found/i);
    });

    test('error handling with network error', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/123';
      
      const error: any = new Error('Connection refused');
      error.isAxiosError = true;
      error.code = 'ECONNREFUSED';

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(fetcher.fetchMergeRequest(mrUrl)).rejects.toThrow(/unreachable/i);
    });

    test('error handling with authentication failure', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/123';
      
      const error: any = new Error('Unauthorized');
      error.isAxiosError = true;
      error.response = {
        status: 401,
        data: {}
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(fetcher.fetchMergeRequest(mrUrl)).rejects.toThrow(/authentication/i);
    });

    test('handles MR with no pipelines', async () => {
      const mrUrl = 'https://gitlab.example.com/group/project/-/merge_requests/789';
      
      const mockMrResponse = {
        data: {
          title: 'New MR',
          changes: []
        }
      };

      const mockPipelinesResponse = {
        data: []
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockMrResponse)
        .mockResolvedValueOnce(mockPipelinesResponse);

      const result = await fetcher.fetchMergeRequest(mrUrl);

      expect(result.ciStatus).toBe('pending');
    });

    test('handles invalid MR URL format', async () => {
      const invalidUrl = 'https://gitlab.example.com/invalid-url';

      await expect(fetcher.fetchMergeRequest(invalidUrl)).rejects.toThrow(/Invalid GitLab MR URL format/i);
    });
  });
});
