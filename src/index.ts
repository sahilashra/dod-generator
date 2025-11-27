// Main library entry point
export * from './models';
export * from './fetchers';
export * from './generators';
export * from './formatters';
export * from './parsers';
export * from './config';

import { DoDInput, JiraTicket, MergeRequest, DoDTable } from './models/types';
import { InputParser } from './parsers/InputParser';
import { JiraFetcher } from './fetchers/JiraFetcher';
import { GitLabFetcher } from './fetchers/GitLabFetcher';
import { DoDGenerator } from './generators/DoDGenerator';
import { MarkdownFormatter } from './formatters/MarkdownFormatter';

/**
 * Result of DoD generation including the formatted output and any errors
 */
export interface DoDGenerationResult {
  dod: string;
  errors: string[];
  success: boolean;
}

/**
 * Main orchestration function that generates a DoD from input
 * Handles the complete flow: parse input, fetch data, generate DoD, format, and optionally post comment
 * 
 * @param input - The DoD input containing ticket and optional MR information
 * @param jiraBaseUrl - Base URL for Jira API (e.g., "https://jira.example.com")
 * @param gitlabBaseUrl - Base URL for GitLab API (e.g., "https://gitlab.example.com")
 * @returns Promise resolving to DoDGenerationResult with formatted DoD and any errors
 */
export async function generateDoDFromInput(
  input: DoDInput,
  jiraBaseUrl?: string,
  gitlabBaseUrl?: string
): Promise<DoDGenerationResult> {
  const errors: string[] = [];
  let ticket: JiraTicket | undefined;
  let mr: MergeRequest | undefined;
  let dodTable: DoDTable | undefined;
  let formattedDoD = '';

  try {
    // Step 1: Parse and validate input
    const parser = new InputParser();
    const parsedInput = parser.parseInput(input);

    // Step 2: Fetch Jira ticket (from URL or use provided JSON)
    if (parsedInput.ticketSource === 'url') {
      // Fetch from Jira API
      if (!parsedInput.credentials.jiraToken) {
        throw new Error('Jira token is required when fetching ticket from URL');
      }
      if (!jiraBaseUrl) {
        throw new Error('Jira base URL is required when fetching ticket from URL');
      }

      const jiraFetcher = new JiraFetcher(jiraBaseUrl, parsedInput.credentials.jiraToken);
      
      try {
        ticket = await jiraFetcher.fetchTicket(parsedInput.ticketIdentifier);
      } catch (error) {
        // Propagate Jira fetch errors
        throw error;
      }
    } else {
      // Use provided JSON data
      ticket = parsedInput.ticketData!;
    }

    // Step 3: Optionally fetch GitLab MR
    if (parsedInput.mrUrl) {
      if (!parsedInput.credentials.gitlabToken) {
        errors.push('GitLab token is required when fetching merge request, skipping MR data');
      } else if (!gitlabBaseUrl) {
        errors.push('GitLab base URL is required when fetching merge request, skipping MR data');
      } else {
        const gitlabFetcher = new GitLabFetcher(gitlabBaseUrl, parsedInput.credentials.gitlabToken);
        
        try {
          mr = await gitlabFetcher.fetchMergeRequest(parsedInput.mrUrl);
        } catch (error) {
          // Partial failure: Log error but continue without MR data
          errors.push(`Failed to fetch merge request: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Step 4: Generate DoD table
    const generator = new DoDGenerator();
    dodTable = generator.generateDoD(ticket, mr, parsedInput.ticketType);

    // Step 5: Format as Markdown
    const formatter = new MarkdownFormatter();
    formattedDoD = formatter.formatDoDTable(dodTable);

    // Step 6: Optionally post comment to Jira
    if (parsedInput.postComment) {
      if (!parsedInput.credentials.jiraToken) {
        errors.push('Jira token is required for posting comment, skipping comment posting');
      } else if (!jiraBaseUrl) {
        errors.push('Jira base URL is required for posting comment, skipping comment posting');
      } else {
        const jiraFetcher = new JiraFetcher(jiraBaseUrl, parsedInput.credentials.jiraToken);
        
        try {
          // Convert to Jira format before posting
          const jiraFormattedDoD = formatter.formatForJira(formattedDoD);
          await jiraFetcher.postComment(ticket.key, jiraFormattedDoD);
        } catch (error) {
          // Partial failure: Log error but still return the DoD
          errors.push(`Failed to post comment to Jira: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Return formatted DoD and any errors
    return {
      dod: formattedDoD,
      errors,
      success: errors.length === 0,
    };

  } catch (error) {
    // Critical error: Return error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      dod: formattedDoD || '',
      errors: [...errors, errorMessage],
      success: false,
    };
  }
}
