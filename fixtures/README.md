# Example Fixtures

This directory contains example Jira tickets and GitLab merge requests for testing and demonstration purposes.

## Jira Ticket Fixtures

### jira-backend-ticket.json

**Ticket:** BACKEND-123 - Implement user authentication API endpoint

**Description:** A backend development ticket for implementing a REST API endpoint with JWT authentication.

**Key Features:**
- Labels: `backend`, `api`, `security`
- Issue Type: Story
- 5 acceptance criteria covering authentication flow
- Linked issues: BACKEND-100, BACKEND-105

**Use Case:** Testing backend-specific DoD generation including API contract changes, monitoring, and rollback sections.

**Example Usage:**
```bash
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```

---

### jira-frontend-ticket.json

**Ticket:** FRONTEND-456 - Create responsive dashboard layout with data visualization

**Description:** A frontend development ticket for building a responsive dashboard with charts and metrics.

**Key Features:**
- Labels: `frontend`, `ui`, `dashboard`
- Issue Type: Story
- 5 acceptance criteria covering responsiveness, accessibility, and data visualization
- Linked issues: FRONTEND-400

**Use Case:** Testing frontend-specific DoD generation including UI/UX validation and accessibility compliance sections.

**Example Usage:**
```bash
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)"
```

---

### jira-infrastructure-ticket.json

**Ticket:** INFRA-789 - Set up Kubernetes cluster for production deployment

**Description:** An infrastructure ticket for deploying a production-ready Kubernetes cluster.

**Key Features:**
- Labels: `infrastructure`, `kubernetes`, `devops`
- Issue Type: Task
- 5 acceptance criteria covering cluster setup, monitoring, and auto-scaling
- Linked issues: INFRA-700, INFRA-750

**Use Case:** Testing infrastructure-specific DoD generation including deployment procedures and runbook sections.

**Example Usage:**
```bash
dod-gen --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"
```

---

### jira-bug-ticket.json

**Ticket:** BUG-321 - Fix memory leak in data processing pipeline

**Description:** A bug fix ticket for resolving memory leaks in a data processing system.

**Key Features:**
- Labels: `backend`, `bug`, `performance`
- Issue Type: Bug
- 3 acceptance criteria focused on memory stability
- Linked issues: BACKEND-200

**Use Case:** Testing DoD generation for bug fixes and performance issues.

**Example Usage:**
```bash
dod-gen --ticket-json "$(cat fixtures/jira-bug-ticket.json)"
```

---

## GitLab Merge Request Fixtures

### gitlab-mr-passed.json

**MR:** feat: implement user authentication endpoint

**Description:** A merge request with passing CI pipeline.

**Key Features:**
- CI Status: `passed` ✓
- 6 changed files including implementation, tests, and documentation
- Web URL: https://gitlab.com/example/project/-/merge_requests/123

**Use Case:** Testing DoD generation with successful CI status indicator.

**Example Usage:**
```bash
# Combine with a Jira ticket
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/123
```

---

### gitlab-mr-failed.json

**MR:** fix: resolve memory leak in data processing

**Description:** A merge request with failed CI pipeline.

**Key Features:**
- CI Status: `failed` ✗
- 3 changed files focused on bug fix
- Web URL: https://gitlab.com/example/project/-/merge_requests/456

**Use Case:** Testing DoD generation with failed CI status indicator.

**Example Usage:**
```bash
# Combine with a bug ticket
dod-gen --ticket-json "$(cat fixtures/jira-bug-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/456
```

---

### gitlab-mr-running.json

**MR:** feat: add responsive dashboard with charts

**Description:** A merge request with running CI pipeline.

**Key Features:**
- CI Status: `running` ⟳
- 6 changed files including components, tests, and styles
- Web URL: https://gitlab.com/example/project/-/merge_requests/789

**Use Case:** Testing DoD generation with in-progress CI status indicator.

**Example Usage:**
```bash
# Combine with a frontend ticket
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/789
```

---

## Testing Scenarios

### Scenario 1: Backend Development with Passing CI

```bash
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/123
```

**Expected Output:**
- Backend-specific sections (API contract, monitoring, rollback)
- CI status showing passed ✓
- 5 acceptance criteria items
- API-related conditional content

---

### Scenario 2: Frontend Development with Running CI

```bash
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/789
```

**Expected Output:**
- Frontend-specific sections (UI/UX validation, accessibility)
- CI status showing running ⟳
- 5 acceptance criteria items
- Emphasis on component and E2E tests

---

### Scenario 3: Infrastructure Task without MR

```bash
dod-gen --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"
```

**Expected Output:**
- Infrastructure-specific sections (deployment, validation, runbook)
- No CI status section (MR not provided)
- 5 acceptance criteria items
- Placeholder for manual CI verification

---

### Scenario 4: Bug Fix with Failed CI

```bash
dod-gen --ticket-json "$(cat fixtures/jira-bug-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/456
```

**Expected Output:**
- Backend sections (bug has backend label)
- CI status showing failed ✗
- 3 acceptance criteria items
- Performance and data validation prompts

---

### Scenario 5: Explicit Type Override

```bash
# Override automatic type detection
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)" \
        --type frontend
```

**Expected Output:**
- Frontend-specific sections (despite backend labels)
- Demonstrates explicit type parameter precedence

---

## Fixture Validation

All fixtures are validated against the type definitions in `src/models/types.ts`:

- **JiraTicket**: Must have key, summary, description, labels, issueType, linkedIssues
- **MergeRequest**: Must have title, ciStatus, changedFiles, webUrl

You can validate fixtures programmatically:

```typescript
import { isJiraTicket, isMergeRequest } from '../src/models/types';
import * as fs from 'fs';

const ticket = JSON.parse(fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8'));
console.log('Valid ticket:', isJiraTicket(ticket)); // Should be true

const mr = JSON.parse(fs.readFileSync('fixtures/gitlab-mr-passed.json', 'utf-8'));
console.log('Valid MR:', isMergeRequest(mr)); // Should be true
```

---

## Creating Custom Fixtures

To create your own fixtures for testing:

1. **Copy an existing fixture** as a template
2. **Modify the fields** to match your test scenario
3. **Validate the structure** using type guards
4. **Test the fixture** with the CLI tool

### Jira Ticket Template

```json
{
  "key": "PROJECT-###",
  "summary": "Your ticket summary",
  "description": "Detailed description\n\nAcceptance Criteria:\n1. First criterion\n2. Second criterion",
  "labels": ["backend|frontend|infrastructure", "other-labels"],
  "issueType": "Story|Bug|Task",
  "linkedIssues": ["PROJECT-###"],
  "acceptanceCriteria": [
    "First criterion",
    "Second criterion"
  ]
}
```

### GitLab MR Template

```json
{
  "title": "feat|fix|chore: your MR title",
  "ciStatus": "passed|failed|running|pending|canceled",
  "changedFiles": [
    "path/to/file1.ts",
    "path/to/file2.ts"
  ],
  "webUrl": "https://gitlab.com/namespace/project/-/merge_requests/###"
}
```

---

## Notes

- All fixtures use realistic but fictional data
- Ticket keys follow standard Jira naming conventions (PROJECT-NUMBER)
- GitLab URLs use example.com domain for demonstration
- Acceptance criteria are extracted from descriptions and also provided as arrays
- Labels are used for automatic ticket type detection
