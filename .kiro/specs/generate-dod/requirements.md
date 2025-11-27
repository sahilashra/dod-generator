# Requirements Document

## Introduction

The Definition-of-Done (DoD) Generator is a system that automatically produces structured, comprehensive DoD tables from Jira tickets and optional merge request information. The system parses ticket metadata, acceptance criteria, and MR details to generate tailored checklists that ensure development work meets quality standards before being marked complete.

## Glossary

- **DoD Generator**: The system that produces Definition-of-Done tables
- **Jira Ticket**: A work item in Jira containing summary, description, acceptance criteria, labels, and linked issues
- **MR (Merge Request)**: A GitLab merge request containing code changes, CI status, and metadata
- **DoD Table**: A structured Markdown table containing acceptance criteria, testing requirements, and completion checklists
- **Ticket Type**: Classification of work (backend, frontend, infrastructure)
- **CI Status**: Continuous Integration pipeline execution status
- **API Contract**: The interface specification for backend services

## Requirements

### Requirement 1

**User Story:** As a developer, I want to parse Jira ticket information, so that I can extract relevant details for the DoD table.

#### Acceptance Criteria

1. WHEN the DoD Generator receives a Jira ticket URL, THE DoD Generator SHALL fetch the ticket data via Jira REST API
2. WHEN ticket data is retrieved, THE DoD Generator SHALL extract the ticket summary, description, acceptance criteria, labels, and linked issues
3. WHEN the ticket contains acceptance criteria in the description, THE DoD Generator SHALL parse and structure them as individual items
4. WHEN the ticket has labels, THE DoD Generator SHALL identify the ticket type (backend, frontend, infrastructure) from the labels
5. IF the Jira API call fails, THEN THE DoD Generator SHALL return an error message indicating the failure reason

### Requirement 2

**User Story:** As a developer, I want to parse merge request information, so that I can include CI status and code change details in the DoD.

#### Acceptance Criteria

1. WHERE a merge request URL is provided, THE DoD Generator SHALL fetch MR data via GitLab REST API
2. WHEN MR data is retrieved, THE DoD Generator SHALL extract the MR title, CI pipeline status, and list of changed files
3. WHEN the MR has multiple pipelines, THE DoD Generator SHALL use the most recent pipeline status
4. WHERE no MR URL is provided, THE DoD Generator SHALL generate the DoD table without MR-specific sections
5. IF the GitLab API call fails, THEN THE DoD Generator SHALL return an error message indicating the failure reason

### Requirement 3

**User Story:** As a developer, I want to generate a structured DoD table, so that I have a clear checklist of completion criteria.

#### Acceptance Criteria

1. WHEN generating a DoD table, THE DoD Generator SHALL produce a Markdown-formatted table with clearly defined sections
2. WHEN the DoD table is generated, THE DoD Generator SHALL include sections for acceptance criteria, automated tests, manual test steps, documentation updates, and reviewer checklist
3. WHEN the ticket type is backend, THE DoD Generator SHALL include sections for API contract changes, monitoring and logging changes, and rollback and migration notes
4. WHEN the ticket type is frontend, THE DoD Generator SHALL include sections for UI/UX validation and accessibility compliance
5. WHEN the ticket type is infrastructure, THE DoD Generator SHALL include sections for deployment procedures and infrastructure validation

### Requirement 4

**User Story:** As a developer, I want acceptance criteria from the Jira ticket to be included in the DoD table, so that I can verify all requirements are met.

#### Acceptance Criteria

1. WHEN the Jira ticket contains acceptance criteria, THE DoD Generator SHALL list each criterion as a separate row in the acceptance criteria section
2. WHEN acceptance criteria are listed, THE DoD Generator SHALL format them as checkable items
3. WHEN the ticket has no explicit acceptance criteria, THE DoD Generator SHALL include a placeholder indicating manual review is needed
4. WHEN acceptance criteria contain technical specifications, THE DoD Generator SHALL preserve the original formatting and details

### Requirement 5

**User Story:** As a developer, I want automated test requirements to be specified in the DoD, so that I know what testing coverage is expected.

#### Acceptance Criteria

1. WHEN generating the automated tests section, THE DoD Generator SHALL include categories for unit tests, integration tests, and end-to-end tests
2. WHEN the ticket type is backend, THE DoD Generator SHALL emphasize unit and integration test requirements
3. WHEN the ticket type is frontend, THE DoD Generator SHALL emphasize component and end-to-end test requirements
4. WHEN the ticket involves API changes, THE DoD Generator SHALL include API contract testing requirements

### Requirement 6

**User Story:** As a developer, I want CI status to be included in the DoD table, so that I can verify pipeline health.

#### Acceptance Criteria

1. WHERE an MR URL is provided, THE DoD Generator SHALL include the current CI pipeline status in the DoD table
2. WHEN the CI status is "passed", THE DoD Generator SHALL indicate successful pipeline execution
3. WHEN the CI status is "failed" or "running", THE DoD Generator SHALL indicate the current state
4. WHERE no MR is provided, THE DoD Generator SHALL include a placeholder for manual CI verification

### Requirement 7

**User Story:** As a developer, I want the DoD table to include manual test steps, so that I can perform necessary manual validation.

#### Acceptance Criteria

1. WHEN generating the manual test steps section, THE DoD Generator SHALL provide a template for describing test scenarios
2. WHEN the ticket type is frontend, THE DoD Generator SHALL include prompts for UI interaction testing
3. WHEN the ticket type is backend, THE DoD Generator SHALL include prompts for API endpoint testing
4. WHEN the ticket involves data changes, THE DoD Generator SHALL include prompts for data validation

### Requirement 8

**User Story:** As a developer, I want to optionally post the generated DoD as a Jira comment, so that the team can see the checklist directly in the ticket.

#### Acceptance Criteria

1. WHERE the post_comment option is enabled, THE DoD Generator SHALL call the Jira REST API to add the DoD table as a comment
2. WHEN posting a comment, THE DoD Generator SHALL format the Markdown appropriately for Jira's rendering
3. IF the comment posting fails, THEN THE DoD Generator SHALL return an error message but still provide the generated DoD table
4. WHERE the post_comment option is disabled, THE DoD Generator SHALL only return the DoD table without posting

### Requirement 9

**User Story:** As a developer, I want the DoD Generator to handle different input formats, so that I can provide either URLs or JSON data.

#### Acceptance Criteria

1. WHEN the input contains a ticket_url field, THE DoD Generator SHALL fetch ticket data from the Jira API
2. WHEN the input contains ticket data as JSON, THE DoD Generator SHALL parse the provided JSON directly
3. WHEN both URL and JSON are provided, THE DoD Generator SHALL prioritize the URL and fetch fresh data
4. IF the input format is invalid, THEN THE DoD Generator SHALL return an error message describing the expected format

### Requirement 10

**User Story:** As a developer, I want the DoD table to include documentation and monitoring sections, so that I remember to update supporting materials.

#### Acceptance Criteria

1. WHEN generating the DoD table, THE DoD Generator SHALL include a section for documentation updates
2. WHEN the ticket type is backend, THE DoD Generator SHALL include a section for monitoring and logging changes
3. WHEN the ticket involves new features, THE DoD Generator SHALL prompt for user-facing documentation
4. WHEN the ticket involves infrastructure changes, THE DoD Generator SHALL prompt for runbook updates
