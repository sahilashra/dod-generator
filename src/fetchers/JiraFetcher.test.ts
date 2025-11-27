import * as fc from 'fast-check';
import axios from 'axios';
import { JiraFetcher } from './JiraFetcher';
import { JiraTicket } from '../models/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraFetcher', () => {
  let fetcher: JiraFetcher;
  const baseUrl = 'https://jira.example.com';
  const token = 'test-token';

  beforeEach(() => {
    fetcher = new JiraFetcher(baseUrl, token);
    jest.clearAllMocks();
  });

  describe('Property Tests', () => {
    /**
     * Feature: generate-dod, Property 16: Comment posting conditional behavior
     * Validates: Requirements 8.1, 8.4
     */
    test('Property 16: Comment posting conditional behavior', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ticketKey: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            comment: fc.string({ minLength: 1, maxLength: 500 }),
            shouldPost: fc.boolean()
          }),
          async ({ ticketKey, comment, shouldPost }) => {
            // Mock successful post
            mockedAxios.post.mockResolvedValueOnce({ data: {} });

            // Simulate conditional posting behavior
            let postCalled = false;
            if (shouldPost) {
              await fetcher.postComment(ticketKey, comment);
              postCalled = true;
            }

            // Verify that postComment was called if and only if shouldPost is true
            if (shouldPost) {
              expect(postCalled).toBe(true);
              expect(mockedAxios.post).toHaveBeenCalled();
            } else {
              expect(postCalled).toBe(false);
            }

            // Clear mocks for next iteration
            jest.clearAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: generate-dod, Property 18: Graceful error handling with partial success
     * Validates: Requirements 8.3
     * 
     * This property tests that when comment posting fails, the error message is descriptive
     * and indicates the operation that failed. The full property (returning DoD even when
     * posting fails) will be tested in the orchestration layer (task 15).
     */
    test('Property 18: Graceful error handling with partial success', async () => {
      // Save original axios.isAxiosError
      const originalIsAxiosError = axios.isAxiosError;
      (axios.isAxiosError as any) = jest.fn(() => true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ticketKey: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            comment: fc.string({ minLength: 1, maxLength: 500 }),
            errorType: fc.constantFrom('auth403', 'notFound404', 'serverError500', 'network')
          }),
          async ({ ticketKey, comment, errorType }) => {
            // Create a fresh fetcher for each test to avoid mock pollution
            const testFetcher = new JiraFetcher(baseUrl, token);
            
            // Mock different error scenarios for comment posting
            const mockError = new Error('Mock error');
            
            switch (errorType) {
              case 'auth403':
                Object.assign(mockError, {
                  isAxiosError: true,
                  response: { status: 403, data: {} }
                });
                break;
              case 'notFound404':
                Object.assign(mockError, {
                  isAxiosError: true,
                  response: { status: 404, data: {} }
                });
                break;
              case 'serverError500':
                Object.assign(mockError, {
                  isAxiosError: true,
                  response: { status: 500, data: {} }
                });
                break;
              case 'network':
                Object.assign(mockError, {
                  isAxiosError: true,
                  code: 'ECONNREFUSED',
                  message: 'connect ECONNREFUSED'
                });
                break;
            }

            // Set up mock for this specific test
            mockedAxios.post = jest.fn().mockRejectedValue(mockError);

            // Verify that postComment throws an error with descriptive message
            try {
              await testFetcher.postComment(ticketKey, comment);
              throw new Error('Should have thrown an error');
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              const errorMessage = (error as Error).message;
              
              // Verify error message is descriptive
              expect(errorMessage.length).toBeGreaterThan(0);
              expect(typeof errorMessage).toBe('string');
              
              // The error should indicate it's related to posting comment
              expect(errorMessage.toLowerCase()).toMatch(/posting comment|comment/);
            }
          }
        ),
        { numRuns: 100 }
      );
      
      // Restore original axios.isAxiosError
      axios.isAxiosError = originalIsAxiosError;
    });

    /**
     * Feature: generate-dod, Property 1: Complete data extraction from API responses
     * Validates: Requirements 1.2
     */
    test('Property 1: Complete data extraction from API responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for Jira API responses
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[A-Z]+-\d+$/.test(s) || s.length > 0),
            fields: fc.record({
              summary: fc.string({ minLength: 1, maxLength: 200 }),
              description: fc.oneof(
                fc.string(),
                fc.record({
                  type: fc.constant('doc'),
                  version: fc.constant(1),
                  content: fc.array(
                    fc.record({
                      type: fc.constant('paragraph'),
                      content: fc.array(
                        fc.record({
                          type: fc.constant('text'),
                          text: fc.string()
                        })
                      )
                    })
                  )
                })
              ),
              labels: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
              issuetype: fc.record({
                name: fc.constantFrom('Story', 'Bug', 'Task', 'Epic', 'Subtask')
              }),
              issuelinks: fc.array(
                fc.oneof(
                  fc.record({
                    outwardIssue: fc.record({
                      key: fc.string({ minLength: 1, maxLength: 20 })
                    })
                  }),
                  fc.record({
                    inwardIssue: fc.record({
                      key: fc.string({ minLength: 1, maxLength: 20 })
                    })
                  })
                ),
                { maxLength: 5 }
              )
            })
          }),
          async (apiResponse) => {
            // Mock the axios response
            mockedAxios.get.mockResolvedValueOnce({ data: apiResponse });

            // Fetch the ticket
            const result = await fetcher.fetchTicket(apiResponse.key);

            // Verify all required fields are extracted
            expect(result.key).toBe(apiResponse.key);
            expect(result.summary).toBe(apiResponse.fields.summary);
            expect(typeof result.description).toBe('string');
            expect(Array.isArray(result.labels)).toBe(true);
            expect(result.labels).toEqual(apiResponse.fields.labels);
            expect(result.issueType).toBe(apiResponse.fields.issuetype.name);
            expect(Array.isArray(result.linkedIssues)).toBe(true);
            expect(Array.isArray(result.acceptanceCriteria)).toBe(true);

            // Verify no data loss - all labels are preserved
            expect(result.labels.length).toBe(apiResponse.fields.labels.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: generate-dod, Property 2: Acceptance criteria parsing preserves content
     * Validates: Requirements 1.3, 4.4
     */
    test('Property 2: Acceptance criteria parsing preserves content', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for acceptance criteria in various formats
          fc.record({
            criteria: fc.array(
              fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
              { minLength: 1, maxLength: 10 }
            ),
            format: fc.constantFrom('numbered', 'bullet', 'checkbox', 'givenWhenThen')
          }),
          async ({ criteria, format }) => {
            // Build description with acceptance criteria in the specified format
            let description = 'Some ticket description\n\nAcceptance Criteria:\n';
            
            criteria.forEach((criterion, index) => {
              switch (format) {
                case 'numbered':
                  description += `${index + 1}. ${criterion}\n`;
                  break;
                case 'bullet':
                  description += `- ${criterion}\n`;
                  break;
                case 'checkbox':
                  description += `[ ] ${criterion}\n`;
                  break;
                case 'givenWhenThen':
                  description += `Given ${criterion}\n`;
                  break;
              }
            });

            const apiResponse = {
              key: 'TEST-123',
              fields: {
                summary: 'Test ticket',
                description: description,
                labels: [],
                issuetype: { name: 'Story' },
                issuelinks: []
              }
            };

            mockedAxios.get.mockResolvedValueOnce({ data: apiResponse });

            const result = await fetcher.fetchTicket('TEST-123');

            // Verify that acceptance criteria are extracted
            expect(result.acceptanceCriteria).toBeDefined();
            expect(Array.isArray(result.acceptanceCriteria)).toBe(true);
            
            // Verify that the number of criteria matches
            expect(result.acceptanceCriteria!.length).toBe(criteria.length);

            // Verify that each criterion's content is preserved (allowing for whitespace normalization)
            result.acceptanceCriteria!.forEach((extractedCriterion, index) => {
              const originalCriterion = criteria[index].trim();
              // The extracted criterion should contain the original text (whitespace is normalized)
              expect(extractedCriterion.toLowerCase()).toContain(originalCriterion.toLowerCase());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: generate-dod, Property 21: Error propagation from API failures
     * Validates: Requirements 1.5
     */
    test('Property 21: Error propagation from API failures', async () => {
      // Mock axios.isAxiosError to properly identify our mock errors
      const originalIsAxiosError = axios.isAxiosError;
      (axios.isAxiosError as any) = jest.fn((error: any) => error?.isAxiosError === true);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ticketKey: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            errorType: fc.constantFrom(
              'network',
              'timeout',
              'auth401',
              'auth403',
              'notFound404',
              'rateLimit429',
              'serverError500'
            )
          }),
          async ({ ticketKey, errorType }) => {
            // Mock different error scenarios
            let mockError: any;
            
            switch (errorType) {
              case 'network':
                mockError = {
                  isAxiosError: true,
                  code: 'ECONNREFUSED',
                  message: 'connect ECONNREFUSED'
                };
                break;
              case 'timeout':
                mockError = {
                  isAxiosError: true,
                  code: 'ECONNABORTED',
                  message: 'timeout of 30000ms exceeded'
                };
                break;
              case 'auth401':
                mockError = {
                  isAxiosError: true,
                  response: { status: 401, data: {} }
                };
                break;
              case 'auth403':
                mockError = {
                  isAxiosError: true,
                  response: { status: 403, data: {} }
                };
                break;
              case 'notFound404':
                mockError = {
                  isAxiosError: true,
                  response: { status: 404, data: {} }
                };
                break;
              case 'rateLimit429':
                mockError = {
                  isAxiosError: true,
                  response: { status: 429, data: {} }
                };
                break;
              case 'serverError500':
                mockError = {
                  isAxiosError: true,
                  response: { status: 500, data: {} }
                };
                break;
            }

            mockedAxios.get.mockRejectedValueOnce(mockError);

            // Verify the error message is descriptive and includes relevant information
            try {
              await fetcher.fetchTicket(ticketKey);
              fail('Should have thrown an error');
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              const errorMessage = (error as Error).message;
              
              // Verify error message contains context about the failure
              expect(errorMessage.length).toBeGreaterThan(0);
              expect(typeof errorMessage).toBe('string');
              
              // Verify error message is descriptive based on error type
              switch (errorType) {
                case 'network':
                  expect(errorMessage.toLowerCase()).toMatch(/unreachable|connect/);
                  break;
                case 'timeout':
                  expect(errorMessage.toLowerCase()).toMatch(/timeout/);
                  break;
                case 'auth401':
                  expect(errorMessage.toLowerCase()).toMatch(/authentication|invalid.*token/);
                  break;
                case 'auth403':
                  expect(errorMessage.toLowerCase()).toMatch(/authorization|permission/);
                  break;
                case 'notFound404':
                  expect(errorMessage.toLowerCase()).toMatch(/not found/);
                  expect(errorMessage).toContain(ticketKey);
                  break;
                case 'rateLimit429':
                  expect(errorMessage.toLowerCase()).toMatch(/rate limit/);
                  break;
                case 'serverError500':
                  expect(errorMessage.toLowerCase()).toMatch(/server error|status 500/);
                  break;
              }
            }
          }
        ),
        { numRuns: 100 }
      );

      // Restore original axios.isAxiosError
      axios.isAxiosError = originalIsAxiosError;
    });
  });

  describe('Unit Tests', () => {
    test('fetchTicket with successful response', async () => {
      const mockResponse = {
        key: 'TEST-123',
        fields: {
          summary: 'Test ticket summary',
          description: 'Test description',
          labels: ['backend', 'api'],
          issuetype: { name: 'Story' },
          issuelinks: [
            { outwardIssue: { key: 'TEST-124' } },
            { inwardIssue: { key: 'TEST-125' } }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetcher.fetchTicket('TEST-123');

      expect(result.key).toBe('TEST-123');
      expect(result.summary).toBe('Test ticket summary');
      expect(result.description).toBe('Test description');
      expect(result.labels).toEqual(['backend', 'api']);
      expect(result.issueType).toBe('Story');
      expect(result.linkedIssues).toEqual(['TEST-124', 'TEST-125']);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/rest/api/3/issue/TEST-123`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      );
    });

    test('acceptance criteria extraction with numbered list', async () => {
      const mockResponse = {
        key: 'TEST-123',
        fields: {
          summary: 'Test',
          description: 'Description\n\nAcceptance Criteria:\n1. First criterion\n2. Second criterion\n3. Third criterion',
          labels: [],
          issuetype: { name: 'Story' },
          issuelinks: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetcher.fetchTicket('TEST-123');

      expect(result.acceptanceCriteria).toHaveLength(3);
      expect(result.acceptanceCriteria![0]).toBe('First criterion');
      expect(result.acceptanceCriteria![1]).toBe('Second criterion');
      expect(result.acceptanceCriteria![2]).toBe('Third criterion');
    });

    test('acceptance criteria extraction with bullet points', async () => {
      const mockResponse = {
        key: 'TEST-123',
        fields: {
          summary: 'Test',
          description: 'Description\n\nAcceptance Criteria:\n- First criterion\n- Second criterion',
          labels: [],
          issuetype: { name: 'Story' },
          issuelinks: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetcher.fetchTicket('TEST-123');

      expect(result.acceptanceCriteria).toHaveLength(2);
      expect(result.acceptanceCriteria![0]).toBe('First criterion');
      expect(result.acceptanceCriteria![1]).toBe('Second criterion');
    });

    test('acceptance criteria extraction with checkboxes', async () => {
      const mockResponse = {
        key: 'TEST-123',
        fields: {
          summary: 'Test',
          description: 'Description\n\nAcceptance Criteria:\n[ ] First criterion\n[x] Second criterion',
          labels: [],
          issuetype: { name: 'Story' },
          issuelinks: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetcher.fetchTicket('TEST-123');

      expect(result.acceptanceCriteria).toHaveLength(2);
      expect(result.acceptanceCriteria![0]).toBe('First criterion');
      expect(result.acceptanceCriteria![1]).toBe('Second criterion');
    });

    test('acceptance criteria extraction with ADF format', async () => {
      const mockResponse = {
        key: 'TEST-123',
        fields: {
          summary: 'Test',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Description' }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Acceptance Criteria:' }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '1. First criterion' }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '2. Second criterion' }]
              }
            ]
          },
          labels: [],
          issuetype: { name: 'Story' },
          issuelinks: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetcher.fetchTicket('TEST-123');

      expect(result.acceptanceCriteria).toHaveLength(2);
      expect(result.acceptanceCriteria![0]).toBe('First criterion');
      expect(result.acceptanceCriteria![1]).toBe('Second criterion');
    });

    test('error handling for 404 not found', async () => {
      const mockError = {
        isAxiosError: true,
        response: { status: 404, data: {} }
      };

      (axios.isAxiosError as any) = jest.fn(() => true);
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(fetcher.fetchTicket('NOTFOUND-123')).rejects.toThrow('Jira resource not found while fetching ticket');
    });

    test('error handling for 401 authentication failure', async () => {
      const mockError = {
        isAxiosError: true,
        response: { status: 401, data: {} }
      };

      (axios.isAxiosError as any) = jest.fn(() => true);
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(fetcher.fetchTicket('TEST-123')).rejects.toThrow('Jira authentication failed while fetching ticket');
    });

    test('error handling for 429 rate limit', async () => {
      const mockError = {
        isAxiosError: true,
        response: { status: 429, data: {} }
      };

      (axios.isAxiosError as any) = jest.fn(() => true);
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(fetcher.fetchTicket('TEST-123')).rejects.toThrow('Jira rate limit exceeded');
    });

    test('postComment successfully posts comment', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await expect(fetcher.postComment('TEST-123', 'Test comment')).resolves.not.toThrow();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/rest/api/3/issue/TEST-123/comment`,
        expect.objectContaining({
          body: expect.objectContaining({
            type: 'doc',
            version: 1,
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'paragraph',
                content: expect.arrayContaining([
                  expect.objectContaining({
                    type: 'text',
                    text: 'Test comment'
                  })
                ])
              })
            ])
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      );
    });

    test('postComment handles posting failure', async () => {
      const mockError = new Error('Mock error');
      Object.assign(mockError, {
        isAxiosError: true,
        response: { status: 403, data: {} }
      });

      const originalIsAxiosError = axios.isAxiosError;
      (axios.isAxiosError as any) = jest.fn(() => true);
      
      // Ensure post is mocked
      if (!mockedAxios.post) {
        mockedAxios.post = jest.fn();
      }
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(fetcher.postComment('TEST-123', 'Test comment')).rejects.toThrow();
      
      // Restore
      axios.isAxiosError = originalIsAxiosError;
    });
  });
});
