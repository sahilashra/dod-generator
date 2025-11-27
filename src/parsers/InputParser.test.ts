import { InputParser } from './InputParser';
import { DoDInput, JiraTicket } from '../models/types';

describe('InputParser', () => {
  let parser: InputParser;

  beforeEach(() => {
    parser = new InputParser();
  });

  describe('URL parsing', () => {
    it('should extract ticket key from standard Jira URL', () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/ABC-123',
      };

      const result = parser.parseInput(input);

      expect(result.ticketIdentifier).toBe('ABC-123');
      expect(result.ticketSource).toBe('url');
    });

    it('should extract ticket key from Atlassian cloud URL', () => {
      const input: DoDInput = {
        ticket_url: 'https://example.atlassian.net/browse/PROJ-456',
      };

      const result = parser.parseInput(input);

      expect(result.ticketIdentifier).toBe('PROJ-456');
      expect(result.ticketSource).toBe('url');
    });

    it('should accept direct ticket key format', () => {
      const input: DoDInput = {
        ticket_url: 'XYZ-789',
      };

      const result = parser.parseInput(input);

      expect(result.ticketIdentifier).toBe('XYZ-789');
      expect(result.ticketSource).toBe('url');
    });

    it('should handle ticket keys with multiple digits in prefix', () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/ABC123-999',
      };

      const result = parser.parseInput(input);

      expect(result.ticketIdentifier).toBe('ABC123-999');
    });

    it('should validate GitLab MR URL format', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        mr_url: 'https://gitlab.example.com/project/subproject/-/merge_requests/123',
      };

      const result = parser.parseInput(input);

      expect(result.mrUrl).toBe('https://gitlab.example.com/project/subproject/-/merge_requests/123');
    });

    it('should validate GitLab.com MR URL', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        mr_url: 'https://gitlab.com/group/project/-/merge_requests/456',
      };

      const result = parser.parseInput(input);

      expect(result.mrUrl).toBe('https://gitlab.com/group/project/-/merge_requests/456');
    });
  });

  describe('validation with missing fields', () => {
    it('should fail when neither ticket_url nor ticket_json is provided', () => {
      const input: DoDInput = {};

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Either ticket_url or ticket_json must be provided');
    });

    it('should fail with malformed Jira URL', () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/invalid/path',
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid ticket_url format'))).toBe(true);
    });

    it('should fail with invalid ticket key format', () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/invalid-key',
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid ticket_url format'))).toBe(true);
    });

    it('should fail with malformed GitLab MR URL', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        mr_url: 'https://gitlab.com/project/invalid/path',
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid mr_url format'))).toBe(true);
    });

    it('should fail with non-numeric MR number', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        mr_url: 'https://gitlab.com/project/-/merge_requests/abc',
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid mr_url format'))).toBe(true);
    });

    it('should fail with invalid ticket type', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        type: 'invalid' as any,
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('type must be one of: backend, frontend, infrastructure');
    });

    it('should fail with invalid ticket_json structure', () => {
      const input: DoDInput = {
        ticket_json: {
          key: 'ABC-123',
          // Missing required fields
        } as any,
      };

      const validation = parser.validateInput(input);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('valid JiraTicket object'))).toBe(true);
    });
  });

  describe('precedence logic', () => {
    const validTicketJson: JiraTicket = {
      key: 'JSON-999',
      summary: 'Test ticket from JSON',
      description: 'Description',
      labels: ['backend'],
      issueType: 'Story',
      linkedIssues: [],
    };

    it('should prioritize ticket_url over ticket_json when both provided', () => {
      const input: DoDInput = {
        ticket_url: 'https://jira.example.com/browse/URL-123',
        ticket_json: validTicketJson,
      };

      const result = parser.parseInput(input);

      expect(result.ticketSource).toBe('url');
      expect(result.ticketIdentifier).toBe('URL-123');
      expect(result.ticketData).toBeUndefined();
    });

    it('should use ticket_json when only JSON is provided', () => {
      const input: DoDInput = {
        ticket_json: validTicketJson,
      };

      const result = parser.parseInput(input);

      expect(result.ticketSource).toBe('json');
      expect(result.ticketIdentifier).toBe('JSON-999');
      expect(result.ticketData).toEqual(validTicketJson);
    });

    it('should use ticket_url when only URL is provided', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
      };

      const result = parser.parseInput(input);

      expect(result.ticketSource).toBe('url');
      expect(result.ticketIdentifier).toBe('ABC-123');
      expect(result.ticketData).toBeUndefined();
    });
  });

  describe('parseInput with valid inputs', () => {
    it('should parse all fields correctly', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
        type: 'backend',
        mr_url: 'https://gitlab.com/project/-/merge_requests/456',
        post_comment: true,
        jira_token: 'jira-token-123',
        gitlab_token: 'gitlab-token-456',
      };

      const result = parser.parseInput(input);

      expect(result.ticketSource).toBe('url');
      expect(result.ticketIdentifier).toBe('ABC-123');
      expect(result.ticketType).toBe('backend');
      expect(result.mrUrl).toBe('https://gitlab.com/project/-/merge_requests/456');
      expect(result.postComment).toBe(true);
      expect(result.credentials.jiraToken).toBe('jira-token-123');
      expect(result.credentials.gitlabToken).toBe('gitlab-token-456');
    });

    it('should default post_comment to false when not provided', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
      };

      const result = parser.parseInput(input);

      expect(result.postComment).toBe(false);
    });

    it('should handle optional fields being undefined', () => {
      const input: DoDInput = {
        ticket_url: 'ABC-123',
      };

      const result = parser.parseInput(input);

      expect(result.ticketType).toBeUndefined();
      expect(result.mrUrl).toBeUndefined();
      expect(result.credentials.jiraToken).toBeUndefined();
      expect(result.credentials.gitlabToken).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when parsing invalid input', () => {
      const input: DoDInput = {};

      expect(() => parser.parseInput(input)).toThrow('Invalid input');
    });

    it('should include all validation errors in thrown error message', () => {
      const input: DoDInput = {
        ticket_url: 'invalid-url',
        type: 'invalid' as any,
      };

      expect(() => parser.parseInput(input)).toThrow();
    });
  });
});
