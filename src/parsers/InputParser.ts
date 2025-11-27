import { DoDInput, ParsedInput, ValidationResult, JiraTicket, isDoDInput, isJiraTicket } from '../models/types';

export class InputParser {
  /**
   * Parses and validates the input, extracting ticket identifiers and handling precedence
   */
  parseInput(input: DoDInput): ParsedInput {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    // Handle precedence: ticket_url over ticket_json (Requirement 9.3)
    const ticketSource: 'url' | 'json' = input.ticket_url ? 'url' : 'json';
    
    let ticketIdentifier: string;
    let ticketData: JiraTicket | undefined;

    if (ticketSource === 'url') {
      // Extract ticket key from URL (Requirement 9.1)
      ticketIdentifier = this.extractJiraTicketKey(input.ticket_url!);
    } else {
      // Use provided JSON data (Requirement 9.2)
      ticketData = input.ticket_json!;
      ticketIdentifier = ticketData.key;
    }

    // Extract MR identifier if provided
    let mrUrl: string | undefined;
    if (input.mr_url) {
      // Validate GitLab MR URL format
      this.validateGitLabMRUrl(input.mr_url);
      mrUrl = input.mr_url;
    }

    return {
      ticketSource,
      ticketIdentifier,
      ticketData,
      ticketType: input.type,
      mrUrl,
      postComment: input.post_comment ?? false,
      credentials: {
        jiraToken: input.jira_token,
        gitlabToken: input.gitlab_token,
      },
    };
  }

  /**
   * Validates the input and returns descriptive error messages (Requirement 9.4)
   */
  validateInput(input: DoDInput): ValidationResult {
    const errors: string[] = [];

    // Basic type checking
    if (typeof input !== 'object' || input === null) {
      errors.push('Input must be a valid object');
      return { valid: false, errors };
    }

    // Must have either ticket_url or ticket_json
    if (!input.ticket_url && !input.ticket_json) {
      errors.push('Either ticket_url or ticket_json must be provided');
    }

    // Validate ticket_url format if provided
    if (input.ticket_url !== undefined) {
      if (typeof input.ticket_url !== 'string') {
        errors.push('ticket_url must be a string');
      } else {
        try {
          this.extractJiraTicketKey(input.ticket_url);
        } catch (error) {
          errors.push(`Invalid ticket_url format: ${(error as Error).message}`);
        }
      }
    }

    // Validate ticket_json if provided
    if (input.ticket_json !== undefined) {
      if (!isJiraTicket(input.ticket_json)) {
        errors.push('ticket_json must be a valid JiraTicket object with required fields (key, summary, description, labels, issueType, linkedIssues)');
      }
    }

    // Validate mr_url format if provided
    if (input.mr_url !== undefined) {
      if (typeof input.mr_url !== 'string') {
        errors.push('mr_url must be a string');
      } else {
        try {
          this.validateGitLabMRUrl(input.mr_url);
        } catch (error) {
          errors.push(`Invalid mr_url format: ${(error as Error).message}`);
        }
      }
    }

    // Validate type if provided
    if (input.type !== undefined) {
      if (!['backend', 'frontend', 'infrastructure'].includes(input.type)) {
        errors.push('type must be one of: backend, frontend, infrastructure');
      }
    }

    // Validate post_comment if provided
    if (input.post_comment !== undefined && typeof input.post_comment !== 'boolean') {
      errors.push('post_comment must be a boolean');
    }

    // Validate tokens if provided
    if (input.jira_token !== undefined && typeof input.jira_token !== 'string') {
      errors.push('jira_token must be a string');
    }

    if (input.gitlab_token !== undefined && typeof input.gitlab_token !== 'string') {
      errors.push('gitlab_token must be a string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extracts Jira ticket key from various URL formats
   * Supports formats like:
   * - https://jira.example.com/browse/ABC-123
   * - https://example.atlassian.net/browse/PROJ-456
   * - ABC-123 (direct key)
   */
  private extractJiraTicketKey(url: string): string {
    // Direct ticket key format (e.g., "ABC-123")
    const directKeyPattern = /^[A-Z][A-Z0-9]+-\d+$/;
    if (directKeyPattern.test(url)) {
      return url;
    }

    // URL format
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for /browse/TICKET-KEY pattern
      const browseIndex = pathParts.indexOf('browse');
      if (browseIndex !== -1 && browseIndex < pathParts.length - 1) {
        const ticketKey = pathParts[browseIndex + 1];
        if (directKeyPattern.test(ticketKey)) {
          return ticketKey;
        }
      }

      throw new Error('URL does not contain a valid Jira ticket key in /browse/ path');
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format. Expected format: https://jira.example.com/browse/TICKET-KEY or direct ticket key like ABC-123');
      }
      throw error;
    }
  }

  /**
   * Validates GitLab merge request URL format
   * Supports formats like:
   * - https://gitlab.example.com/project/subproject/-/merge_requests/123
   * - https://gitlab.com/group/project/-/merge_requests/456
   */
  private validateGitLabMRUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for /merge_requests/NUMBER pattern
      const mrIndex = pathParts.indexOf('merge_requests');
      if (mrIndex === -1 || mrIndex >= pathParts.length - 1) {
        throw new Error('URL does not contain /merge_requests/ path');
      }

      const mrNumber = pathParts[mrIndex + 1];
      if (!/^\d+$/.test(mrNumber)) {
        throw new Error('Merge request number must be numeric');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format. Expected format: https://gitlab.example.com/project/-/merge_requests/NUMBER');
      }
      throw error;
    }
  }
}
