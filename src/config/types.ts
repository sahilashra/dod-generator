/**
 * Configuration file structure for .dodrc.json
 */
export interface DoDConfig {
  jira?: {
    baseUrl?: string;
    token?: string;
  };
  gitlab?: {
    baseUrl?: string;
    token?: string;
  };
  defaults?: {
    ticketType?: 'backend' | 'frontend' | 'infrastructure';
    postComment?: boolean;
  };
}

/**
 * Resolved configuration after merging all sources
 */
export interface ResolvedConfig {
  jiraBaseUrl: string;
  jiraToken?: string;
  gitlabBaseUrl: string;
  gitlabToken?: string;
  defaultTicketType?: 'backend' | 'frontend' | 'infrastructure';
  defaultPostComment: boolean;
}
