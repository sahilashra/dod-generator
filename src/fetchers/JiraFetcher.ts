import axios, { AxiosError } from 'axios';
import { JiraTicket } from '../models/types';

/**
 * JiraFetcher handles fetching ticket data from Jira REST API v3
 */
export class JiraFetcher {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  /**
   * Fetches a Jira ticket by its key
   * @param ticketKey - The Jira ticket key (e.g., "ABC-123")
   * @returns Promise resolving to JiraTicket
   * @throws Error with descriptive message on failure
   */
  async fetchTicket(ticketKey: string): Promise<JiraTicket> {
    try {
      const url = `${this.baseUrl}/rest/api/3/issue/${ticketKey}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return this.parseJiraResponse(response.data);
    } catch (error) {
      throw this.handleError(error, ticketKey);
    }
  }

  /**
   * Posts a comment to a Jira ticket
   * @param ticketKey - The Jira ticket key
   * @param comment - The comment text to post
   * @throws Error with descriptive message on failure
   */
  async postComment(ticketKey: string, comment: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/rest/api/3/issue/${ticketKey}/comment`;
      
      await axios.post(
        url,
        {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
    } catch (error) {
      throw this.handleError(error, ticketKey, 'posting comment');
    }
  }

  /**
   * Parses Jira API v3 response into JiraTicket model
   */
  private parseJiraResponse(data: any): JiraTicket {
    const fields = data.fields || {};
    
    return {
      key: data.key || '',
      summary: fields.summary || '',
      description: fields.description ? this.extractTextFromADF(fields.description) : '',
      labels: fields.labels || [],
      issueType: fields.issuetype?.name || '',
      linkedIssues: this.extractLinkedIssues(fields.issuelinks || []),
      acceptanceCriteria: this.extractAcceptanceCriteria(
        fields.description ? this.extractTextFromADF(fields.description) : ''
      )
    };
  }

  /**
   * Extracts plain text from Jira's Atlassian Document Format (ADF)
   */
  private extractTextFromADF(adf: any): string {
    if (typeof adf === 'string') {
      return adf;
    }

    if (!adf || !adf.content) {
      return '';
    }

    let text = '';
    
    const processNode = (node: any): void => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.type === 'hardBreak') {
        text += '\n';
      } else if (node.content) {
        node.content.forEach(processNode);
        // Add newline after paragraphs, headings, list items
        if (['paragraph', 'heading', 'listItem'].includes(node.type)) {
          text += '\n';
        }
      }
    };

    adf.content.forEach(processNode);
    
    return text.trim();
  }

  /**
   * Extracts linked issue keys from Jira issue links
   */
  private extractLinkedIssues(issuelinks: any[]): string[] {
    const linkedIssues: string[] = [];
    
    for (const link of issuelinks) {
      if (link.outwardIssue?.key) {
        linkedIssues.push(link.outwardIssue.key);
      }
      if (link.inwardIssue?.key) {
        linkedIssues.push(link.inwardIssue.key);
      }
    }
    
    return linkedIssues;
  }

  /**
   * Extracts acceptance criteria from ticket description using common patterns
   */
  private extractAcceptanceCriteria(description: string): string[] {
    if (!description) {
      return [];
    }

    const criteria: string[] = [];
    const lines = description.split('\n');
    
    let inAcceptanceCriteriaSection = false;
    let currentCriterion = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Check if we're entering an acceptance criteria section
      if (
        lowerLine.includes('acceptance criteria') ||
        lowerLine.includes('acceptance criterion') ||
        lowerLine === 'ac:' ||
        lowerLine === 'acs:'
      ) {
        inAcceptanceCriteriaSection = true;
        continue;
      }

      // Check if we're leaving the section (new heading or empty line after criteria)
      if (inAcceptanceCriteriaSection && line === '' && currentCriterion === '') {
        continue;
      }

      if (inAcceptanceCriteriaSection) {
        // Pattern 1: Numbered list (1., 2., 3. or 1), 2), 3))
        const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
        if (numberedMatch) {
          if (currentCriterion) {
            criteria.push(currentCriterion.trim());
          }
          currentCriterion = numberedMatch[1];
          continue;
        }

        // Pattern 2: Bullet points (-, *, •)
        const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
          if (currentCriterion) {
            criteria.push(currentCriterion.trim());
          }
          currentCriterion = bulletMatch[1];
          continue;
        }

        // Pattern 3: Given/When/Then format
        if (
          line.startsWith('Given ') ||
          line.startsWith('When ') ||
          line.startsWith('Then ')
        ) {
          // Start of a new Given/When/Then criterion
          if (currentCriterion) {
            criteria.push(currentCriterion.trim());
          }
          currentCriterion = line;
          continue;
        }
        
        // "And" continues the current criterion
        if (line.startsWith('And ')) {
          currentCriterion += (currentCriterion ? ' ' : '') + line;
          continue;
        }

        // Pattern 4: Checkbox format ([ ] or [x])
        const checkboxMatch = line.match(/^\[[ x]\]\s+(.+)$/i);
        if (checkboxMatch) {
          if (currentCriterion) {
            criteria.push(currentCriterion.trim());
          }
          currentCriterion = checkboxMatch[1];
          continue;
        }

        // If we hit a new section header, stop
        if (line.endsWith(':') && line.length < 50 && !line.includes(' ')) {
          break;
        }

        // Continuation of current criterion
        if (line && currentCriterion) {
          currentCriterion += ' ' + line;
        }
      }
    }

    // Add the last criterion if exists
    if (currentCriterion) {
      criteria.push(currentCriterion.trim());
    }

    return criteria;
  }

  /**
   * Handles errors from API calls and converts them to descriptive error messages
   */
  private handleError(error: unknown, ticketKey: string, operation: string = 'fetching ticket'): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        return new Error(`Jira API unreachable while ${operation}: Unable to connect to ${this.baseUrl}`);
      }

      // Timeout errors
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        return new Error(`Jira API timeout: Request timed out while ${operation} for ${ticketKey}`);
      }

      // HTTP errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            return new Error(`Jira authentication failed while ${operation}: Invalid or missing API token`);
          case 403:
            return new Error(`Jira authorization failed while ${operation}: Token does not have permission to access ${ticketKey}`);
          case 404:
            return new Error(`Jira resource not found while ${operation}: ${ticketKey} does not exist`);
          case 429:
            return new Error(`Jira rate limit exceeded while ${operation}: Too many requests, please try again later`);
          case 500:
          case 502:
          case 503:
          case 504:
            return new Error(`Jira server error while ${operation}: The Jira API returned status ${status}`);
          default:
            return new Error(`Jira API error: ${operation} failed for ${ticketKey} with status ${status}`);
        }
      }
    }

    // Generic error
    return new Error(`Unexpected error while ${operation} for ${ticketKey}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
