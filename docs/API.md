# API Documentation

This document describes the programmatic API for the DoD Generator library.

## Table of Contents

- [Installation](#installation)
- [Main Function](#main-function)
- [Type Definitions](#type-definitions)
- [Classes](#classes)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```bash
npm install dod-generator
```

## Main Function

### generateDoDFromInput

The primary entry point for generating DoD tables.

```typescript
function generateDoDFromInput(input: DoDInput): Promise<{
  dod: string;
  errors: string[];
}>
```

**Parameters:**

- `input` (DoDInput): Configuration object for DoD generation

**Returns:**

Promise resolving to an object containing:
- `dod` (string): Generated DoD table in Markdown format
- `errors` (string[]): Array of error messages (empty if successful)

**Example:**

```typescript
import { generateDoDFromInput } from 'dod-generator';

const result = await generateDoDFromInput({
  ticket_url: 'https://jira.example.com/browse/BACKEND-123',
  mr_url: 'https://gitlab.com/project/merge_requests/456',
  type: 'backend',
  post_comment: false,
  jira_token: process.env.JIRA_TOKEN,
  gitlab_token: process.env.GITLAB_TOKEN
});

console.log(result.dod);
```

## Type Definitions

### DoDInput

Input configuration for DoD generation.

```typescript
interface DoDInput {
  ticket_url?: string;
  ticket_json?: JiraTicket;
  type?: 'backend' | 'frontend' | 'infrastructure';
  mr_url?: string;
  post_comment?: boolean;
  jira_token?: string;
  gitlab_token?: string;
}
```

**Fields:**

- `ticket_url` (optional): Jira ticket URL to fetch
- `ticket_json` (optional): Pre-fetched Jira ticket data
- `type` (optional): Explicit ticket type (overrides automatic detection)
- `mr_url` (optional): GitLab merge request URL
- `post_comment` (optional): Whether to post DoD as Jira comment (default: false)
- `jira_token` (optional): Jira API authentication token
- `gitlab_token` (optional): GitLab personal access token

**Notes:**

- Either `ticket_url` or `ticket_json` must be provided
- If both are provided, `ticket_url` takes precedence
- Tokens can also be provided via environment variables or config file

---

### JiraTicket

Represents a Jira ticket with all relevant metadata.

```typescript
interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  labels: string[];
  issueType: string;
  linkedIssues: string[];
  acceptanceCriteria?: string[];
}
```

**Fields:**

- `key` (required): Ticket identifier (e.g., "BACKEND-123")
- `summary` (required): Ticket title
- `description` (required): Full ticket description
- `labels` (required): Array of labels (used for type detection)
- `issueType` (required): Jira issue type (e.g., "Story", "Bug", "Task")
- `linkedIssues` (required): Array of linked ticket keys
- `acceptanceCriteria` (optional): Parsed acceptance criteria

---

### MergeRequest

Represents a GitLab merge request.

```typescript
interface MergeRequest {
  title: string;
  ciStatus: 'passed' | 'failed' | 'running' | 'pending' | 'canceled';
  changedFiles: string[];
  webUrl: string;
}
```

**Fields:**

- `title` (required): MR title
- `ciStatus` (required): Current CI pipeline status
- `changedFiles` (required): Array of file paths changed in the MR
- `webUrl` (required): GitLab web URL for the MR

---

### DoDTable

Represents the generated DoD table structure.

```typescript
interface DoDTable {
  sections: DoDSection[];
  metadata: {
    ticketKey: string;
    ticketType: string;
    generatedAt: string;
  };
}
```

**Fields:**

- `sections` (required): Array of DoD sections
- `metadata` (required): Metadata about the generated DoD
  - `ticketKey`: Jira ticket key
  - `ticketType`: Detected or specified ticket type
  - `generatedAt`: ISO timestamp of generation

---

### DoDSection

Represents a section within the DoD table.

```typescript
interface DoDSection {
  title: string;
  rows: DoDRow[];
}
```

**Fields:**

- `title` (required): Section heading
- `rows` (required): Array of rows in the section

---

### DoDRow

Represents a row within a DoD section.

```typescript
interface DoDRow {
  category: string;
  items: string[];
  checked: boolean;
}
```

**Fields:**

- `category` (required): Row category/label
- `items` (required): Array of checklist items
- `checked` (required): Whether items are pre-checked (usually false)

---

## Classes

### JiraFetcher

Handles Jira API interactions.

```typescript
class JiraFetcher {
  constructor(baseUrl: string, token: string);
  
  async fetchTicket(ticketKey: string): Promise<JiraTicket>;
  async postComment(ticketKey: string, comment: string): Promise<void>;
}
```

**Constructor Parameters:**

- `baseUrl`: Jira instance URL (e.g., "https://company.atlassian.net")
- `token`: Jira API token for authentication

**Methods:**

#### fetchTicket

Fetches a Jira ticket by key.

```typescript
async fetchTicket(ticketKey: string): Promise<JiraTicket>
```

**Parameters:**
- `ticketKey`: Jira ticket key (e.g., "BACKEND-123")

**Returns:** Promise resolving to JiraTicket object

**Throws:** Error if API call fails or ticket not found

**Example:**

```typescript
const fetcher = new JiraFetcher(
  'https://company.atlassian.net',
  process.env.JIRA_TOKEN
);

const ticket = await fetcher.fetchTicket('BACKEND-123');
console.log(ticket.summary);
```

#### postComment

Posts a comment to a Jira ticket.

```typescript
async postComment(ticketKey: string, comment: string): Promise<void>
```

**Parameters:**
- `ticketKey`: Jira ticket key
- `comment`: Comment text (Jira wiki markup format)

**Returns:** Promise resolving when comment is posted

**Throws:** Error if API call fails

---

### GitLabFetcher

Handles GitLab API interactions.

```typescript
class GitLabFetcher {
  constructor(baseUrl: string, token: string);
  
  async fetchMergeRequest(mrUrl: string): Promise<MergeRequest>;
}
```

**Constructor Parameters:**

- `baseUrl`: GitLab instance URL (e.g., "https://gitlab.com")
- `token`: GitLab personal access token

**Methods:**

#### fetchMergeRequest

Fetches a GitLab merge request by URL.

```typescript
async fetchMergeRequest(mrUrl: string): Promise<MergeRequest>
```

**Parameters:**
- `mrUrl`: Full GitLab MR URL

**Returns:** Promise resolving to MergeRequest object

**Throws:** Error if API call fails or MR not found

**Example:**

```typescript
const fetcher = new GitLabFetcher(
  'https://gitlab.com',
  process.env.GITLAB_TOKEN
);

const mr = await fetcher.fetchMergeRequest(
  'https://gitlab.com/project/repo/-/merge_requests/123'
);
console.log(mr.ciStatus);
```

---

### DoDGenerator

Core DoD generation logic.

```typescript
class DoDGenerator {
  generateDoD(
    ticket: JiraTicket,
    mr?: MergeRequest,
    ticketType?: string
  ): DoDTable;
}
```

**Methods:**

#### generateDoD

Generates a DoD table from ticket and optional MR data.

```typescript
generateDoD(
  ticket: JiraTicket,
  mr?: MergeRequest,
  ticketType?: string
): DoDTable
```

**Parameters:**
- `ticket`: Jira ticket data
- `mr` (optional): GitLab merge request data
- `ticketType` (optional): Explicit ticket type (overrides detection)

**Returns:** DoDTable object

**Example:**

```typescript
const generator = new DoDGenerator();

const dod = generator.generateDoD(
  ticket,
  mr,
  'backend'
);

console.log(dod.sections.length);
```

---

### MarkdownFormatter

Formats DoD tables as Markdown.

```typescript
class MarkdownFormatter {
  formatDoDTable(dod: DoDTable): string;
  formatForJira(markdown: string): string;
}
```

**Methods:**

#### formatDoDTable

Formats a DoD table as Markdown.

```typescript
formatDoDTable(dod: DoDTable): string
```

**Parameters:**
- `dod`: DoD table to format

**Returns:** Markdown-formatted string

**Example:**

```typescript
const formatter = new MarkdownFormatter();
const markdown = formatter.formatDoDTable(dod);
console.log(markdown);
```

#### formatForJira

Converts Markdown to Jira wiki markup.

```typescript
formatForJira(markdown: string): string
```

**Parameters:**
- `markdown`: Markdown-formatted DoD

**Returns:** Jira wiki markup string

**Example:**

```typescript
const formatter = new MarkdownFormatter();
const jiraFormat = formatter.formatForJira(markdown);
// Post to Jira
```

---

### InputParser

Parses and validates input.

```typescript
class InputParser {
  parseInput(input: DoDInput): ParsedInput;
  validateInput(input: DoDInput): ValidationResult;
}
```

**Methods:**

#### parseInput

Parses input into normalized format.

```typescript
parseInput(input: DoDInput): ParsedInput
```

**Parameters:**
- `input`: Raw input configuration

**Returns:** ParsedInput object

**Throws:** Error if input is invalid

#### validateInput

Validates input without throwing.

```typescript
validateInput(input: DoDInput): ValidationResult
```

**Parameters:**
- `input`: Input to validate

**Returns:** ValidationResult object with `valid` boolean and `errors` array

---

### ConfigLoader

Loads configuration from multiple sources.

```typescript
class ConfigLoader {
  loadConfig(configPath?: string): Config;
}
```

**Methods:**

#### loadConfig

Loads configuration with precedence: CLI > env > file > defaults.

```typescript
loadConfig(configPath?: string): Config
```

**Parameters:**
- `configPath` (optional): Custom config directory path

**Returns:** Merged configuration object

---

## Utility Functions

### inferTicketType

Infers ticket type from labels and metadata.

```typescript
function inferTicketType(ticket: JiraTicket): string
```

**Parameters:**
- `ticket`: Jira ticket to analyze

**Returns:** Inferred type ('backend', 'frontend', or 'infrastructure')

**Example:**

```typescript
import { inferTicketType } from 'dod-generator/utils';

const type = inferTicketType(ticket);
console.log(type); // 'backend'
```

---

### Type Guards

Type guard functions for runtime type checking.

```typescript
function isDoDInput(value: unknown): value is DoDInput;
function isJiraTicket(value: unknown): value is JiraTicket;
function isMergeRequest(value: unknown): value is MergeRequest;
function isDoDTable(value: unknown): value is DoDTable;
```

**Example:**

```typescript
import { isJiraTicket } from 'dod-generator/models';

const data = JSON.parse(jsonString);
if (isJiraTicket(data)) {
  // TypeScript knows data is JiraTicket
  console.log(data.key);
}
```

---

## Error Handling

All async functions may throw errors. Wrap calls in try-catch blocks:

```typescript
try {
  const result = await generateDoDFromInput(input);
  console.log(result.dod);
  
  if (result.errors.length > 0) {
    console.warn('Warnings:', result.errors);
  }
} catch (error) {
  console.error('Failed to generate DoD:', error.message);
}
```

### Common Error Types

- **ValidationError**: Invalid input format
- **AuthenticationError**: Invalid or missing API tokens
- **NotFoundError**: Ticket or MR not found
- **NetworkError**: API request failed
- **RateLimitError**: API rate limit exceeded

---

## Examples

### Example 1: Basic Usage

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateDoD() {
  const result = await generateDoDFromInput({
    ticket_url: 'https://jira.example.com/browse/BACKEND-123',
    jira_token: process.env.JIRA_TOKEN
  });
  
  console.log(result.dod);
}
```

### Example 2: With Merge Request

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateDoDWithMR() {
  const result = await generateDoDFromInput({
    ticket_url: 'https://jira.example.com/browse/BACKEND-123',
    mr_url: 'https://gitlab.com/project/repo/-/merge_requests/456',
    jira_token: process.env.JIRA_TOKEN,
    gitlab_token: process.env.GITLAB_TOKEN
  });
  
  console.log(result.dod);
}
```

### Example 3: Using Ticket JSON

```typescript
import { generateDoDFromInput } from 'dod-generator';
import * as fs from 'fs';

async function generateFromJSON() {
  const ticketData = JSON.parse(
    fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
  );
  
  const result = await generateDoDFromInput({
    ticket_json: ticketData,
    type: 'backend'
  });
  
  console.log(result.dod);
}
```

### Example 4: Post to Jira

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateAndPost() {
  const result = await generateDoDFromInput({
    ticket_url: 'https://jira.example.com/browse/BACKEND-123',
    post_comment: true,
    jira_token: process.env.JIRA_TOKEN
  });
  
  if (result.errors.length > 0) {
    console.warn('Posted with warnings:', result.errors);
  } else {
    console.log('Successfully posted to Jira');
  }
}
```

### Example 5: Using Individual Classes

```typescript
import { 
  JiraFetcher, 
  GitLabFetcher, 
  DoDGenerator, 
  MarkdownFormatter 
} from 'dod-generator';

async function customGeneration() {
  // Fetch data
  const jiraFetcher = new JiraFetcher(
    'https://company.atlassian.net',
    process.env.JIRA_TOKEN
  );
  const ticket = await jiraFetcher.fetchTicket('BACKEND-123');
  
  const gitlabFetcher = new GitLabFetcher(
    'https://gitlab.com',
    process.env.GITLAB_TOKEN
  );
  const mr = await gitlabFetcher.fetchMergeRequest(
    'https://gitlab.com/project/repo/-/merge_requests/456'
  );
  
  // Generate DoD
  const generator = new DoDGenerator();
  const dod = generator.generateDoD(ticket, mr, 'backend');
  
  // Format output
  const formatter = new MarkdownFormatter();
  const markdown = formatter.formatDoDTable(dod);
  
  console.log(markdown);
  
  // Optionally post to Jira
  const jiraFormat = formatter.formatForJira(markdown);
  await jiraFetcher.postComment(ticket.key, jiraFormat);
}
```

### Example 6: Error Handling

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateWithErrorHandling() {
  try {
    const result = await generateDoDFromInput({
      ticket_url: 'https://jira.example.com/browse/BACKEND-123',
      mr_url: 'https://gitlab.com/project/repo/-/merge_requests/456',
      jira_token: process.env.JIRA_TOKEN,
      gitlab_token: process.env.GITLAB_TOKEN
    });
    
    // Check for partial failures
    if (result.errors.length > 0) {
      console.warn('Generated with warnings:');
      result.errors.forEach(err => console.warn(`  - ${err}`));
    }
    
    // Output DoD even if there were warnings
    console.log(result.dod);
    
  } catch (error) {
    if (error.message.includes('401')) {
      console.error('Authentication failed. Check your API tokens.');
    } else if (error.message.includes('404')) {
      console.error('Ticket or MR not found.');
    } else if (error.message.includes('rate limit')) {
      console.error('API rate limit exceeded. Try again later.');
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}
```

### Example 7: Batch Processing

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function batchGenerate(ticketKeys: string[]) {
  const results = await Promise.allSettled(
    ticketKeys.map(key =>
      generateDoDFromInput({
        ticket_url: `https://jira.example.com/browse/${key}`,
        jira_token: process.env.JIRA_TOKEN
      })
    )
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`\n=== ${ticketKeys[index]} ===`);
      console.log(result.value.dod);
    } else {
      console.error(`Failed to generate DoD for ${ticketKeys[index]}:`, result.reason);
    }
  });
}

batchGenerate(['BACKEND-123', 'FRONTEND-456', 'INFRA-789']);
```

---

## TypeScript Support

The library is written in TypeScript and includes full type definitions. Import types as needed:

```typescript
import type { 
  DoDInput, 
  JiraTicket, 
  MergeRequest, 
  DoDTable 
} from 'dod-generator';
```

---

## Configuration Precedence

When using the library programmatically, configuration is merged in this order:

1. **Function parameters** (highest priority)
2. **Environment variables**
3. **Configuration file** (.dodrc.json)
4. **Default values** (lowest priority)

Example:

```typescript
// Token from parameter takes precedence over env var
const result = await generateDoDFromInput({
  ticket_url: 'https://jira.example.com/browse/BACKEND-123',
  jira_token: 'explicit-token', // Overrides JIRA_TOKEN env var
});
```
