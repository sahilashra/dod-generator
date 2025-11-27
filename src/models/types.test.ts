import * as fc from 'fast-check';
import {
  DoDInput,
  JiraTicket,
  isDoDInput,
  isJiraTicket,
  isMergeRequest,
  isDoDTable,
  MergeRequest,
  DoDTable,
} from './types';

// Generators for property-based testing
const jiraTicketArbitrary: fc.Arbitrary<JiraTicket> = fc.record({
  key: fc.string({ minLength: 1 }),
  summary: fc.string(),
  description: fc.string(),
  labels: fc.array(fc.string()),
  issueType: fc.string({ minLength: 1 }),
  linkedIssues: fc.array(fc.string()),
  acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined }),
});

const ticketTypeArbitrary = fc.constantFrom('backend' as const, 'frontend' as const, 'infrastructure' as const);

const dodInputWithUrlArbitrary = fc.record({
  ticket_url: fc.string({ minLength: 1 }),
  ticket_json: fc.option(jiraTicketArbitrary, { nil: undefined }),
  type: fc.option(ticketTypeArbitrary, { nil: undefined }),
  mr_url: fc.option(fc.string(), { nil: undefined }),
  post_comment: fc.option(fc.boolean(), { nil: undefined }),
  jira_token: fc.option(fc.string(), { nil: undefined }),
  gitlab_token: fc.option(fc.string(), { nil: undefined }),
}) as fc.Arbitrary<DoDInput>;

const dodInputWithJsonArbitrary = fc.record({
  ticket_json: jiraTicketArbitrary,
  type: fc.option(ticketTypeArbitrary, { nil: undefined }),
  mr_url: fc.option(fc.string(), { nil: undefined }),
  post_comment: fc.option(fc.boolean(), { nil: undefined }),
  jira_token: fc.option(fc.string(), { nil: undefined }),
  gitlab_token: fc.option(fc.string(), { nil: undefined }),
}) as fc.Arbitrary<DoDInput>;

describe('Property-Based Tests for Core Data Models', () => {
  describe('Property 19: Input format handling precedence', () => {
    // Feature: generate-dod, Property 19: Input format handling precedence
    // Validates: Requirements 9.1, 9.2, 9.3
    
    it('should handle inputs with ticket_url', () => {
      fc.assert(
        fc.property(dodInputWithUrlArbitrary, (input) => {
          // When input contains ticket_url, it should be valid
          const isValid = isDoDInput(input);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle inputs with only ticket_json', () => {
      fc.assert(
        fc.property(dodInputWithJsonArbitrary, (input) => {
          // When input contains only ticket_json, it should be valid
          const isValid = isDoDInput(input);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle inputs with both ticket_url and ticket_json', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          jiraTicketArbitrary,
          (url, json) => {
            const input: DoDInput = {
              ticket_url: url,
              ticket_json: json,
            };
            // Both URL and JSON should be valid together
            const isValid = isDoDInput(input);
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 20: Input validation error messages', () => {
    // Feature: generate-dod, Property 20: Input validation error messages
    // Validates: Requirements 9.4

    it('should reject inputs with invalid type field', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['backend', 'frontend', 'infrastructure'].includes(s)),
          (invalidType) => {
            const input = {
              ticket_url: 'https://jira.example.com/browse/ABC-123',
              type: invalidType,
            };
            // Invalid type should fail validation
            const isValid = isDoDInput(input);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject inputs with invalid post_comment field', () => {
      fc.assert(
        fc.property(
          fc.anything().filter(v => typeof v !== 'boolean' && v !== undefined),
          (invalidBoolean) => {
            const input = {
              ticket_url: 'https://jira.example.com/browse/ABC-123',
              post_comment: invalidBoolean,
            };
            // Invalid boolean should fail validation
            const isValid = isDoDInput(input);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject inputs with invalid ticket_json structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.option(fc.string()),
            summary: fc.option(fc.string()),
            // Missing required fields or wrong types
          }),
          (invalidTicket) => {
            const input = {
              ticket_json: invalidTicket,
            };
            // Invalid ticket structure should fail validation
            const isValid = isDoDInput(input);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid inputs with all optional fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          ticketTypeArbitrary,
          fc.string(),
          fc.boolean(),
          fc.string(),
          fc.string(),
          (ticketUrl, type: 'backend' | 'frontend' | 'infrastructure', mrUrl, postComment, jiraToken, gitlabToken) => {
            const input: DoDInput = {
              ticket_url: ticketUrl,
              type,
              mr_url: mrUrl,
              post_comment: postComment,
              jira_token: jiraToken,
              gitlab_token: gitlabToken,
            };
            // Valid input with all fields should pass validation
            const isValid = isDoDInput(input);
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Type Guards', () => {
    it('should validate JiraTicket structure', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const isValid = isJiraTicket(ticket);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid JiraTicket with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.option(fc.string()),
            summary: fc.option(fc.string()),
          }),
          (invalidTicket) => {
            const isValid = isJiraTicket(invalidTicket);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate MergeRequest structure', () => {
      const mrArbitrary = fc.record({
        title: fc.string(),
        ciStatus: fc.constantFrom('passed', 'failed', 'running', 'pending', 'canceled'),
        changedFiles: fc.array(fc.string()),
        webUrl: fc.string(),
      });

      fc.assert(
        fc.property(mrArbitrary, (mr) => {
          const isValid = isMergeRequest(mr);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject MergeRequest with invalid ciStatus', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['passed', 'failed', 'running', 'pending', 'canceled'].includes(s)),
          (invalidStatus) => {
            const mr = {
              title: 'Test MR',
              ciStatus: invalidStatus,
              changedFiles: [],
              webUrl: 'https://gitlab.example.com/mr/1',
            };
            const isValid = isMergeRequest(mr);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate DoDTable structure', () => {
      const dodTableArbitrary = fc.record({
        sections: fc.array(
          fc.record({
            title: fc.string(),
            rows: fc.array(
              fc.record({
                category: fc.string(),
                items: fc.array(fc.string()),
                checked: fc.boolean(),
              })
            ),
          })
        ),
        metadata: fc.record({
          ticketKey: fc.string(),
          ticketType: fc.string(),
          generatedAt: fc.string(),
        }),
      });

      fc.assert(
        fc.property(dodTableArbitrary, (table) => {
          const isValid = isDoDTable(table);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
