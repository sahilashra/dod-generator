import { generateDoDFromInput, DoDGenerationResult } from './index';
import { DoDInput, JiraTicket, MergeRequest } from './models/types';
import { JiraFetcher } from './fetchers/JiraFetcher';
import { GitLabFetcher } from './fetchers/GitLabFetcher';

// Mock the fetchers
jest.mock('./fetchers/JiraFetcher');
jest.mock('./fetchers/GitLabFetcher');

describe('generateDoDFromInput - Integration Tests', () => {
  const mockJiraBaseUrl = 'https://jira.example.com';
  const mockGitlabBaseUrl = 'https://gitlab.example.com';
  const mockJiraToken = 'mock-jira-token';
  const mockGitlabToken = 'mock-gitlab-token';

  const mockTicket: JiraTicket = {
    key: 'TEST-123',
    summary: 'Test ticket',
    description: 'Test description with acceptance criteria:\n1. First criterion\n2. Second criterion',
    labels: ['backend'],
    issueType: 'Story',
    linkedIssues: [],
    acceptanceCriteria: ['First criterion', 'Second criterion'],
  };

  const mockMR: MergeRequest = {
    title: 'Test MR',
    ciStatus: 'passed',
    changedFiles: ['src/test.ts'],
    webUrl: 'https://gitlab.example.com/project/-/merge_requests/1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete flow with mocked APIs', () => {
    it('should generate DoD with ticket from URL and MR', async () => {
      // Mock JiraFetcher
      const mockFetchTicket = jest.fn().mockResolvedValue(mockTicket);
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        fetchTicket: mockFetchTicket,
      }));

      // Mock GitLabFetcher
      const mockFetchMR = jest.fn().mockResolvedValue(mockMR);
      (GitLabFetcher as jest.Mock).mockImplementation(() => ({
        fetchMergeRequest: mockFetchMR,
      }));

      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/TEST-123',
        mr_url: 'https://gitlab.example.com/project/-/merge_requests/1',
        jira_token: mockJiraToken,
        gitlab_token: mockGitlabToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl, mockGitlabBaseUrl);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(result.dod).toContain('First criterion');
      expect(result.dod).toContain('Second criterion');
      expect(result.dod).toContain('CI Status');
      expect(result.dod).toContain('passed');
      expect(mockFetchTicket).toHaveBeenCalledWith('TEST-123');
      expect(mockFetchMR).toHaveBeenCalledWith(input.mr_url);
    });
  });

  describe('Flow with only ticket (no MR)', () => {
    it('should generate DoD with only ticket data', async () => {
      const input: DoDInput = {
        ticket_json: mockTicket,
      };

      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(result.dod).toContain('First criterion');
      expect(result.dod).toContain('Second criterion');
      // Should have placeholder for CI verification
      expect(result.dod).toContain('Verify CI pipeline passes before merging');
    });

    it('should fetch ticket from URL without MR', async () => {
      const mockFetchTicket = jest.fn().mockResolvedValue(mockTicket);
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        fetchTicket: mockFetchTicket,
      }));

      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/TEST-123',
        jira_token: mockJiraToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(mockFetchTicket).toHaveBeenCalledWith('TEST-123');
    });
  });

  describe('Flow with ticket and MR', () => {
    it('should include MR-specific sections when MR is provided', async () => {
      const input: DoDInput = {
        ticket_json: mockTicket,
        mr_url: 'https://gitlab.example.com/project/-/merge_requests/1',
        gitlab_token: mockGitlabToken,
      };

      const mockFetchMR = jest.fn().mockResolvedValue(mockMR);
      (GitLabFetcher as jest.Mock).mockImplementation(() => ({
        fetchMergeRequest: mockFetchMR,
      }));

      const result = await generateDoDFromInput(input, undefined, mockGitlabBaseUrl);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dod).toContain('CI Status');
      expect(result.dod).toContain('✓');
      expect(result.dod).toContain('passed');
      expect(mockFetchMR).toHaveBeenCalled();
    });
  });

  describe('Flow with comment posting', () => {
    it('should post comment to Jira when post_comment is enabled', async () => {
      const mockPostComment = jest.fn().mockResolvedValue(undefined);
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        postComment: mockPostComment,
      }));

      const input: DoDInput = {
        ticket_json: mockTicket,
        post_comment: true,
        jira_token: mockJiraToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockPostComment).toHaveBeenCalledWith('TEST-123', expect.any(String));
    });

    it('should not post comment when post_comment is false', async () => {
      const mockPostComment = jest.fn();
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        postComment: mockPostComment,
      }));

      const input: DoDInput = {
        ticket_json: mockTicket,
        post_comment: false,
        jira_token: mockJiraToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      expect(result.success).toBe(true);
      expect(mockPostComment).not.toHaveBeenCalled();
    });

    it('should handle comment posting failure gracefully', async () => {
      const mockPostComment = jest.fn().mockRejectedValue(new Error('Failed to post comment'));
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        postComment: mockPostComment,
      }));

      const input: DoDInput = {
        ticket_json: mockTicket,
        post_comment: true,
        jira_token: mockJiraToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      // Should still return DoD even if posting fails
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to post comment to Jira');
      expect(result.success).toBe(false);
    });
  });

  describe('Error recovery scenarios', () => {
    it('should handle invalid input gracefully', async () => {
      const input = {} as DoDInput;

      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid input');
    });

    it('should handle Jira fetch failure', async () => {
      const mockFetchTicket = jest.fn().mockRejectedValue(new Error('Jira API error'));
      (JiraFetcher as jest.Mock).mockImplementation(() => ({
        fetchTicket: mockFetchTicket,
      }));

      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/TEST-123',
        jira_token: mockJiraToken,
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Jira API error');
    });

    it('should continue without MR when GitLab fetch fails', async () => {
      const mockFetchMR = jest.fn().mockRejectedValue(new Error('GitLab API error'));
      (GitLabFetcher as jest.Mock).mockImplementation(() => ({
        fetchMergeRequest: mockFetchMR,
      }));

      const input: DoDInput = {
        ticket_json: mockTicket,
        mr_url: 'https://gitlab.example.com/project/-/merge_requests/1',
        gitlab_token: mockGitlabToken,
      };

      const result = await generateDoDFromInput(input, undefined, mockGitlabBaseUrl);

      // Should still generate DoD without MR data
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to fetch merge request');
      // Should have placeholder instead of actual CI status
      expect(result.dod).toContain('Verify CI pipeline passes before merging');
    });

    it('should handle missing Jira token when fetching from URL', async () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/TEST-123',
        // No jira_token provided
      };

      const result = await generateDoDFromInput(input, mockJiraBaseUrl);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Jira token is required');
    });

    it('should handle missing GitLab token when fetching MR', async () => {
      const input: DoDInput = {
        ticket_json: mockTicket,
        mr_url: 'https://gitlab.example.com/project/-/merge_requests/1',
        // No gitlab_token provided
      };

      const result = await generateDoDFromInput(input, undefined, mockGitlabBaseUrl);

      // Should still generate DoD without MR data
      expect(result.dod).toContain('Definition of Done: TEST-123');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('GitLab token is required');
    });

    it('should handle missing base URLs', async () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/TEST-123',
        jira_token: mockJiraToken,
      };

      // No base URL provided
      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Jira base URL is required');
    });
  });

  describe('Type-specific DoD generation', () => {
    it('should generate backend-specific sections', async () => {
      const backendTicket: JiraTicket = {
        ...mockTicket,
        labels: ['backend'],
      };

      const input: DoDInput = {
        ticket_json: backendTicket,
      };

      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(true);
      expect(result.dod).toContain('API Contract Changes');
      expect(result.dod).toContain('Monitoring and Logging');
      expect(result.dod).toContain('Rollback and Migration Notes');
    });

    it('should generate frontend-specific sections', async () => {
      const frontendTicket: JiraTicket = {
        ...mockTicket,
        labels: ['frontend'],
      };

      const input: DoDInput = {
        ticket_json: frontendTicket,
        type: 'frontend',
      };

      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(true);
      expect(result.dod).toContain('UI/UX Validation');
      expect(result.dod).toContain('Accessibility Compliance');
    });

    it('should generate infrastructure-specific sections', async () => {
      const infraTicket: JiraTicket = {
        ...mockTicket,
        labels: ['infrastructure'],
      };

      const input: DoDInput = {
        ticket_json: infraTicket,
        type: 'infrastructure',
      };

      const result = await generateDoDFromInput(input);

      expect(result.success).toBe(true);
      expect(result.dod).toContain('Deployment Procedures');
      expect(result.dod).toContain('Infrastructure Validation');
    });
  });
});
