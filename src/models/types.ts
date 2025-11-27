// Input types
export interface DoDInput {
  ticket_url?: string;
  ticket_json?: JiraTicket;
  type?: 'backend' | 'frontend' | 'infrastructure';
  mr_url?: string;
  post_comment?: boolean;
  jira_token?: string;
  gitlab_token?: string;
}

export interface ParsedInput {
  ticketSource: 'url' | 'json';
  ticketIdentifier: string;
  ticketData?: JiraTicket;
  ticketType?: string;
  mrUrl?: string;
  postComment: boolean;
  credentials: {
    jiraToken?: string;
    gitlabToken?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Jira ticket types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  labels: string[];
  issueType: string;
  linkedIssues: string[];
  acceptanceCriteria?: string[];
}

// GitLab merge request types
export interface MergeRequest {
  title: string;
  ciStatus: 'passed' | 'failed' | 'running' | 'pending' | 'canceled';
  changedFiles: string[];
  webUrl: string;
}

// DoD table types
export interface DoDRow {
  category: string;
  items: string[];
  checked: boolean;
}

export interface DoDSection {
  title: string;
  rows: DoDRow[];
}

export interface DoDTable {
  sections: DoDSection[];
  metadata: {
    ticketKey: string;
    ticketType: string;
    generatedAt: string;
  };
}

// Type guards
export function isDoDInput(value: unknown): value is DoDInput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const input = value as Record<string, unknown>;
  
  // Check optional string fields
  if (input.ticket_url !== undefined && typeof input.ticket_url !== 'string') {
    return false;
  }
  
  if (input.type !== undefined && 
      !['backend', 'frontend', 'infrastructure'].includes(input.type as string)) {
    return false;
  }
  
  if (input.mr_url !== undefined && typeof input.mr_url !== 'string') {
    return false;
  }
  
  if (input.post_comment !== undefined && typeof input.post_comment !== 'boolean') {
    return false;
  }
  
  if (input.jira_token !== undefined && typeof input.jira_token !== 'string') {
    return false;
  }
  
  if (input.gitlab_token !== undefined && typeof input.gitlab_token !== 'string') {
    return false;
  }
  
  // Check ticket_json if present
  if (input.ticket_json !== undefined && !isJiraTicket(input.ticket_json)) {
    return false;
  }
  
  return true;
}

export function isJiraTicket(value: unknown): value is JiraTicket {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const ticket = value as Record<string, unknown>;
  
  return (
    typeof ticket.key === 'string' &&
    typeof ticket.summary === 'string' &&
    typeof ticket.description === 'string' &&
    Array.isArray(ticket.labels) &&
    ticket.labels.every((label: unknown) => typeof label === 'string') &&
    typeof ticket.issueType === 'string' &&
    Array.isArray(ticket.linkedIssues) &&
    ticket.linkedIssues.every((issue: unknown) => typeof issue === 'string') &&
    (ticket.acceptanceCriteria === undefined ||
      (Array.isArray(ticket.acceptanceCriteria) &&
        ticket.acceptanceCriteria.every((ac: unknown) => typeof ac === 'string')))
  );
}

export function isMergeRequest(value: unknown): value is MergeRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const mr = value as Record<string, unknown>;
  
  return (
    typeof mr.title === 'string' &&
    ['passed', 'failed', 'running', 'pending', 'canceled'].includes(mr.ciStatus as string) &&
    Array.isArray(mr.changedFiles) &&
    mr.changedFiles.every((file: unknown) => typeof file === 'string') &&
    typeof mr.webUrl === 'string'
  );
}

export function isDoDTable(value: unknown): value is DoDTable {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const table = value as Record<string, unknown>;
  
  return (
    Array.isArray(table.sections) &&
    table.sections.every((section: unknown) => isDoDSection(section)) &&
    typeof table.metadata === 'object' &&
    table.metadata !== null &&
    typeof (table.metadata as Record<string, unknown>).ticketKey === 'string' &&
    typeof (table.metadata as Record<string, unknown>).ticketType === 'string' &&
    typeof (table.metadata as Record<string, unknown>).generatedAt === 'string'
  );
}

export function isDoDSection(value: unknown): value is DoDSection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const section = value as Record<string, unknown>;
  
  return (
    typeof section.title === 'string' &&
    Array.isArray(section.rows) &&
    section.rows.every((row: unknown) => isDoDRow(row))
  );
}

export function isDoDRow(value: unknown): value is DoDRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const row = value as Record<string, unknown>;
  
  return (
    typeof row.category === 'string' &&
    Array.isArray(row.items) &&
    row.items.every((item: unknown) => typeof item === 'string') &&
    typeof row.checked === 'boolean'
  );
}
