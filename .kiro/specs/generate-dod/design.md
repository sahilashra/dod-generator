# Design Document

## Overview

The Definition-of-Done (DoD) Generator is a command-line tool and library that automates the creation of comprehensive DoD checklists from Jira tickets and GitLab merge requests. The system fetches data from external APIs, parses relevant information, and generates structured Markdown tables tailored to the type of work being performed (backend, frontend, or infrastructure).

The tool will be implemented in TypeScript/Node.js to provide both a CLI interface and a programmatic API. It will use the Jira REST API v3 and GitLab REST API v4 for data retrieval.

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   CLI/API   │
│   Entry     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Input Parser   │
│  & Validator    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Data Fetchers  │─────▶│  Jira API    │
│                 │      └──────────────┘
│                 │      ┌──────────────┐
│                 │─────▶│  GitLab API  │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐
│  DoD Generator  │
│  (Template      │
│   Engine)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Output         │
│  Formatter      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Optional       │
│  Comment        │
│  Poster         │
└─────────────────┘
```

### Component Responsibilities

1. **Input Parser & Validator**: Validates input format, extracts URLs or JSON data
2. **Data Fetchers**: Handles API calls to Jira and GitLab with authentication
3. **DoD Generator**: Core logic for generating DoD tables based on ticket type
4. **Output Formatter**: Formats the DoD table as Markdown
5. **Comment Poster**: Posts the generated DoD back to Jira as a comment

## Components and Interfaces

### Input Parser

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

interface ParsedInput {
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

function parseInput(input: DoDInput): ParsedInput;
function validateInput(input: DoDInput): ValidationResult;
```

### Data Fetchers

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

interface MergeRequest {
  title: string;
  ciStatus: 'passed' | 'failed' | 'running' | 'pending' | 'canceled';
  changedFiles: string[];
  webUrl: string;
}

class JiraFetcher {
  constructor(baseUrl: string, token: string);
  async fetchTicket(ticketKey: string): Promise<JiraTicket>;
  async postComment(ticketKey: string, comment: string): Promise<void>;
}

class GitLabFetcher {
  constructor(baseUrl: string, token: string);
  async fetchMergeRequest(mrUrl: string): Promise<MergeRequest>;
}
```

### DoD Generator

```typescript
interface DoDSection {
  title: string;
  rows: DoDRow[];
}

interface DoDRow {
  category: string;
  items: string[];
  checked: boolean;
}

interface DoDTable {
  sections: DoDSection[];
  metadata: {
    ticketKey: string;
    ticketType: string;
    generatedAt: string;
  };
}

class DoDGenerator {
  generateDoD(
    ticket: JiraTicket,
    mr?: MergeRequest,
    ticketType?: string
  ): DoDTable;
  
  private inferTicketType(ticket: JiraTicket): string;
  private generateAcceptanceCriteriaSection(ticket: JiraTicket): DoDSection;
  private generateTestingSection(ticketType: string): DoDSection;
  private generateManualTestSection(ticketType: string): DoDSection;
  private generateDocumentationSection(ticketType: string): DoDSection;
  private generateBackendSpecificSections(): DoDSection[];
  private generateFrontendSpecificSections(): DoDSection[];
  private generateInfraSpecificSections(): DoDSection[];
  private generateCISection(mr?: MergeRequest): DoDSection;
  private generateReviewerChecklist(): DoDSection;
}
```

### Output Formatter

```typescript
class MarkdownFormatter {
  formatDoDTable(dod: DoDTable): string;
  formatForJira(markdown: string): string;
  private formatSection(section: DoDSection): string;
  private formatRow(row: DoDRow): string;
}
```

## Data Models

### Jira Ticket Model

The Jira ticket data structure will be normalized from the Jira API v3 response:

```typescript
interface JiraTicket {
  key: string;                    // e.g., "ABC-123"
  summary: string;                // Ticket title
  description: string;            // Full description (may contain acceptance criteria)
  labels: string[];               // Tags like "backend", "frontend"
  issueType: string;              // "Story", "Bug", "Task", etc.
  linkedIssues: string[];         // Related ticket keys
  acceptanceCriteria?: string[];  // Parsed from description or custom field
}
```

### Merge Request Model

```typescript
interface MergeRequest {
  title: string;
  ciStatus: 'passed' | 'failed' | 'running' | 'pending' | 'canceled';
  changedFiles: string[];
  webUrl: string;
}
```

### DoD Table Model

```typescript
interface DoDTable {
  sections: DoDSection[];
  metadata: {
    ticketKey: string;
    ticketType: string;
    generatedAt: string;
  };
}

interface DoDSection {
  title: string;
  rows: DoDRow[];
}

interface DoDRow {
  category: string;
  items: string[];
  checked: boolean;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete data extraction from API responses
*For any* valid Jira ticket response or GitLab MR response, the system should extract all required fields (summary, description, labels, acceptance criteria for Jira; title, CI status, changed files for GitLab) without data loss.
**Validates: Requirements 1.2, 2.2**

### Property 2: Acceptance criteria parsing preserves content
*For any* ticket description containing acceptance criteria, parsing should extract each criterion as a separate item while preserving the original text and formatting.
**Validates: Requirements 1.3, 4.4**

### Property 3: Ticket type classification from labels
*For any* set of ticket labels, the system should correctly identify the ticket type (backend, frontend, infrastructure) based on the presence of type-indicating labels.
**Validates: Requirements 1.4**

### Property 4: Most recent pipeline selection
*For any* merge request with multiple pipelines, the system should select the pipeline with the most recent timestamp as the current CI status.
**Validates: Requirements 2.3**

### Property 5: Conditional MR section inclusion
*For any* DoD generation request, MR-specific sections should appear in the output if and only if an MR URL was provided and successfully fetched.
**Validates: Requirements 2.4, 6.1, 6.4**

### Property 6: Valid Markdown output structure
*For any* generated DoD table, the output should be valid Markdown with properly formatted tables, headers, and checkbox syntax.
**Validates: Requirements 3.1, 4.2**

### Property 7: Mandatory sections always present
*For any* generated DoD table, it must include sections for acceptance criteria, automated tests (unit/integration/e2e), manual test steps, documentation updates, and reviewer checklist.
**Validates: Requirements 3.2, 5.1, 7.1, 10.1**

### Property 8: Type-specific sections for backend tickets
*For any* ticket classified as backend type, the DoD table should include sections for API contract changes, monitoring and logging changes, rollback and migration notes, and API endpoint testing prompts.
**Validates: Requirements 3.3, 5.2, 7.3, 10.2**

### Property 9: Type-specific sections for frontend tickets
*For any* ticket classified as frontend type, the DoD table should include sections for UI/UX validation, accessibility compliance, component testing emphasis, and UI interaction testing prompts.
**Validates: Requirements 3.4, 5.3, 7.2**

### Property 10: Type-specific sections for infrastructure tickets
*For any* ticket classified as infrastructure type, the DoD table should include sections for deployment procedures, infrastructure validation, and runbook update prompts.
**Validates: Requirements 3.5, 10.4**

### Property 11: Acceptance criteria row mapping
*For any* ticket with N acceptance criteria, the generated DoD table should contain exactly N rows in the acceptance criteria section, each corresponding to one criterion.
**Validates: Requirements 4.1**

### Property 12: API-related conditional content
*For any* ticket whose description or summary mentions API endpoints, REST, GraphQL, or similar API-related terms, the DoD table should include API contract testing requirements.
**Validates: Requirements 5.4**

### Property 13: Feature-related conditional content
*For any* ticket whose type is "Story" or whose description mentions new features, the DoD table should include prompts for user-facing documentation.
**Validates: Requirements 10.3**

### Property 14: Data change conditional content
*For any* ticket whose description mentions database, schema, migration, or data-related terms, the DoD table should include prompts for data validation testing.
**Validates: Requirements 7.4**

### Property 15: CI status representation
*For any* merge request with a CI status, the DoD table should display the status with appropriate indicators (✓ for passed, ✗ for failed, ⟳ for running, etc.).
**Validates: Requirements 6.2, 6.3**

### Property 16: Comment posting conditional behavior
*For any* DoD generation request, a Jira API call to post a comment should occur if and only if the post_comment option is enabled.
**Validates: Requirements 8.1, 8.4**

### Property 17: Jira format transformation
*For any* DoD table being posted to Jira, the Markdown should be transformed to Jira's wiki markup format (e.g., checkboxes as [], tables as ||).
**Validates: Requirements 8.2**

### Property 18: Graceful error handling with partial success
*For any* operation where comment posting fails but DoD generation succeeds, the system should return both an error message about the posting failure and the successfully generated DoD table.
**Validates: Requirements 8.3**

### Property 19: Input format handling precedence
*For any* input containing both ticket_url and ticket_json, the system should fetch data from the URL and ignore the JSON; for inputs with only ticket_json, it should parse the JSON directly without API calls.
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 20: Input validation error messages
*For any* invalid input (missing required fields, malformed URLs, invalid JSON), the system should return a descriptive error message indicating what was wrong and what format is expected.
**Validates: Requirements 9.4**

### Property 21: Error propagation from API failures
*For any* Jira or GitLab API call that fails (network error, authentication failure, 404, etc.), the system should return an error message that includes the failure reason and the affected operation.
**Validates: Requirements 1.5, 2.5**

## Error Handling

### API Error Handling

1. **Network Errors**: Wrap all API calls in try-catch blocks. On network failures, return descriptive errors indicating which service (Jira/GitLab) was unreachable.

2. **Authentication Errors**: Detect 401/403 responses and provide clear messages about invalid or missing API tokens.

3. **Not Found Errors**: Handle 404 responses by indicating the specific resource (ticket/MR) was not found.

4. **Rate Limiting**: Detect 429 responses and inform the user about rate limits.

5. **Timeout Handling**: Implement reasonable timeouts (e.g., 30 seconds) for API calls and handle timeout errors gracefully.

### Input Validation Errors

1. **Missing Required Fields**: Validate that either ticket_url or ticket_json is provided.

2. **Malformed URLs**: Validate URL format before making API calls.

3. **Invalid JSON**: Catch JSON parsing errors and provide helpful messages.

4. **Type Validation**: Ensure ticket_type, if provided, is one of the valid values.

### Partial Failure Handling

1. **MR Fetch Failure**: If MR fetching fails but ticket fetching succeeds, generate DoD without MR sections and log a warning.

2. **Comment Posting Failure**: If DoD generation succeeds but comment posting fails, return the DoD table with an error message about the posting failure.

3. **Acceptance Criteria Parsing Failure**: If parsing acceptance criteria fails, include a placeholder section indicating manual review is needed.

## Testing Strategy

### Unit Testing

The system will use **Jest** as the testing framework for unit tests. Unit tests will cover:

1. **Input Parsing**: Test validation logic with various valid and invalid inputs
2. **URL Extraction**: Test parsing of Jira ticket keys and GitLab MR identifiers from URLs
3. **Acceptance Criteria Parsing**: Test extraction of acceptance criteria from various description formats
4. **Ticket Type Inference**: Test classification logic with different label combinations
5. **Markdown Formatting**: Test that individual sections format correctly
6. **Jira Format Conversion**: Test Markdown to Jira wiki markup transformation
7. **Error Message Generation**: Test that appropriate error messages are created for different failure scenarios

### Property-Based Testing

The system will use **fast-check** as the property-based testing library. Each property-based test will run a minimum of 100 iterations.

Property-based tests will be implemented for each correctness property defined above. Each test will be tagged with a comment in this format:

```typescript
// Feature: generate-dod, Property 1: Complete data extraction from API responses
```

Key property-based tests include:

1. **Data Extraction Properties**: Generate random API responses and verify all fields are extracted
2. **Parsing Properties**: Generate random ticket descriptions with acceptance criteria and verify correct parsing
3. **Classification Properties**: Generate random label sets and verify correct type identification
4. **Output Structure Properties**: Generate random inputs and verify output is always valid Markdown with required sections
5. **Conditional Logic Properties**: Generate inputs with various combinations of optional fields and verify correct conditional behavior
6. **Error Handling Properties**: Generate invalid inputs and API error scenarios, verify appropriate error messages

### Integration Testing

Integration tests will verify end-to-end flows:

1. **Full Flow with Mocked APIs**: Test complete DoD generation with mocked Jira and GitLab responses
2. **Error Recovery Flows**: Test partial failure scenarios (e.g., MR fetch fails but ticket succeeds)
3. **Comment Posting Flow**: Test the full flow including posting back to Jira

### Test Data Strategy

1. **Fixtures**: Create realistic sample Jira tickets and GitLab MRs for unit tests
2. **Generators**: Implement fast-check generators for:
   - Valid Jira ticket structures
   - Valid GitLab MR structures
   - Various label combinations
   - Different ticket types and descriptions
   - Valid and invalid input formats
3. **Edge Cases**: Explicitly test empty descriptions, missing fields, special characters, very long content

## Implementation Notes

### API Authentication

- Jira: Use Bearer token authentication with the Jira REST API v3
- GitLab: Use Private-Token header authentication with GitLab API v4
- Tokens should be provided via environment variables or input parameters

### Acceptance Criteria Parsing Heuristics

Common patterns to detect in ticket descriptions:
- Numbered lists (1., 2., 3.)
- Bullet points with "AC:" or "Acceptance Criteria:" headers
- "Given/When/Then" BDD format
- Checkbox lists in Jira format

### Ticket Type Inference

Priority order for type detection:
1. Explicit `type` parameter in input
2. Labels containing "backend", "frontend", "infrastructure"
3. Issue type and description analysis (e.g., "API" suggests backend)
4. Default to "backend" if unable to determine

### Markdown to Jira Conversion

Key transformations:
- `[ ]` → `[ ]` (Jira checkboxes)
- `| Header |` → `|| Header ||` (Jira table headers)
- `| Cell |` → `| Cell |` (Jira table cells)
- Preserve code blocks and formatting

### CLI Interface

```bash
# Basic usage with ticket URL
dod-gen --ticket-url https://jira.example.com/browse/ABC-123

# With MR and comment posting
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --mr-url https://gitlab.example.com/project/merge_requests/456 \
        --post-comment

# With JSON input
dod-gen --ticket-json '{"key":"ABC-123","summary":"...",...}'

# With explicit type
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type frontend
```

### Configuration

Support configuration via:
1. Command-line arguments
2. Environment variables (JIRA_TOKEN, GITLAB_TOKEN, JIRA_BASE_URL, GITLAB_BASE_URL)
3. Configuration file (.dodrc.json)
