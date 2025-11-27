# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize TypeScript Node.js project with package.json
  - Install dependencies: axios (API calls), commander (CLI), fast-check (property testing), jest (unit testing)
  - Configure TypeScript with strict mode and appropriate target
  - Set up Jest configuration for TypeScript
  - Create directory structure: src/{models,fetchers,generators,formatters,cli}
  - _Requirements: All_

- [x] 2. Implement core data models and types





  - Define TypeScript interfaces for DoDInput, JiraTicket, MergeRequest, DoDTable, DoDSection, DoDRow
  - Define ParsedInput and ValidationResult types
  - Create type guards for input validation
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2.1 Write property test for input format handling


  - **Property 19: Input format handling precedence**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 2.2 Write property test for input validation

  - **Property 20: Input validation error messages**
  - **Validates: Requirements 9.4**

- [x] 3. Implement input parser and validator





  - Create InputParser class with parseInput() and validateInput() methods
  - Implement URL extraction logic for Jira ticket keys and GitLab MR identifiers
  - Implement input validation with descriptive error messages
  - Handle precedence: ticket_url over ticket_json
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 3.1 Write unit tests for input parser


  - Test URL parsing with various Jira and GitLab URL formats
  - Test validation with missing fields, malformed URLs, invalid JSON
  - Test precedence logic when both URL and JSON provided

- [x] 4. Implement Jira API fetcher





  - Create JiraFetcher class with constructor accepting baseUrl and token
  - Implement fetchTicket() method using axios with Bearer token authentication
  - Parse Jira API v3 response into JiraTicket model
  - Extract acceptance criteria from description using common patterns
  - Implement error handling for network errors, auth failures, 404s, rate limiting
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 4.1 Write property test for data extraction


  - **Property 1: Complete data extraction from API responses**
  - **Validates: Requirements 1.2**

- [x] 4.2 Write property test for acceptance criteria parsing


  - **Property 2: Acceptance criteria parsing preserves content**
  - **Validates: Requirements 1.3, 4.4**

- [x] 4.3 Write property test for error handling


  - **Property 21: Error propagation from API failures**
  - **Validates: Requirements 1.5**

- [x] 4.4 Write unit tests for Jira fetcher


  - Test fetchTicket with mocked successful responses
  - Test acceptance criteria extraction with various description formats
  - Test error handling with mocked API failures

- [x] 5. Implement GitLab API fetcher





  - Create GitLabFetcher class with constructor accepting baseUrl and token
  - Implement fetchMergeRequest() method using axios with Private-Token authentication
  - Parse GitLab API v4 response into MergeRequest model
  - Implement logic to select most recent pipeline when multiple exist
  - Implement error handling for API failures
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 5.1 Write property test for MR data extraction


  - **Property 1: Complete data extraction from API responses** (GitLab portion)
  - **Validates: Requirements 2.2**

- [x] 5.2 Write property test for pipeline selection

  - **Property 4: Most recent pipeline selection**
  - **Validates: Requirements 2.3**

- [x] 5.3 Write property test for GitLab error handling

  - **Property 21: Error propagation from API failures** (GitLab portion)
  - **Validates: Requirements 2.5**

- [x] 5.4 Write unit tests for GitLab fetcher

  - Test fetchMergeRequest with mocked successful responses
  - Test pipeline selection with multiple pipelines
  - Test error handling with mocked API failures

- [x] 6. Implement ticket type inference logic





  - Create utility function inferTicketType() that analyzes labels, issue type, and description
  - Implement priority order: explicit type parameter > labels > description analysis > default
  - Handle backend/frontend/infrastructure classification
  - _Requirements: 1.4_

- [x] 6.1 Write property test for ticket type classification


  - **Property 3: Ticket type classification from labels**
  - **Validates: Requirements 1.4**

- [x] 6.2 Write unit tests for type inference


  - Test with various label combinations
  - Test with different issue types and descriptions
  - Test default behavior when type cannot be determined

- [x] 7. Implement DoD Generator core logic





  - Create DoDGenerator class with generateDoD() method
  - Implement generateAcceptanceCriteriaSection() to map ticket acceptance criteria to DoD rows
  - Implement generateTestingSection() with unit/integration/e2e categories
  - Implement generateManualTestSection() with type-specific prompts
  - Implement generateDocumentationSection()
  - Implement generateReviewerChecklist()
  - Wire up all sections into complete DoDTable
  - _Requirements: 3.1, 3.2, 4.1, 5.1, 7.1, 10.1_

- [x] 7.1 Write property test for mandatory sections


  - **Property 7: Mandatory sections always present**
  - **Validates: Requirements 3.2, 5.1, 7.1, 10.1**


- [x] 7.2 Write property test for acceptance criteria mapping

  - **Property 11: Acceptance criteria row mapping**
  - **Validates: Requirements 4.1**


- [x] 7.3 Write unit tests for DoD generator core

  - Test section generation with various ticket inputs
  - Test acceptance criteria mapping with different numbers of criteria
  - Test that all mandatory sections are present

- [x] 8. Implement backend-specific DoD sections





  - Implement generateBackendSpecificSections() method
  - Add sections for API contract changes, monitoring and logging, rollback and migration notes
  - Add API endpoint testing prompts to manual test section
  - Add unit/integration test emphasis to testing section
  - _Requirements: 3.3, 5.2, 7.3, 10.2_

- [x] 8.1 Write property test for backend-specific sections


  - **Property 8: Type-specific sections for backend tickets**
  - **Validates: Requirements 3.3, 5.2, 7.3, 10.2**

- [x] 9. Implement frontend-specific DoD sections





  - Implement generateFrontendSpecificSections() method
  - Add sections for UI/UX validation and accessibility compliance
  - Add UI interaction testing prompts to manual test section
  - Add component/e2e test emphasis to testing section
  - _Requirements: 3.4, 5.3, 7.2_

- [x] 9.1 Write property test for frontend-specific sections


  - **Property 9: Type-specific sections for frontend tickets**
  - **Validates: Requirements 3.4, 5.3, 7.2**

- [x] 10. Implement infrastructure-specific DoD sections





  - Implement generateInfraSpecificSections() method
  - Add sections for deployment procedures and infrastructure validation
  - Add runbook update prompts to documentation section
  - _Requirements: 3.5, 10.4_

- [x] 10.1 Write property test for infrastructure-specific sections


  - **Property 10: Type-specific sections for infrastructure tickets**
  - **Validates: Requirements 3.5, 10.4**

- [-] 11. Implement conditional content logic



  - Implement logic to detect API-related terms in ticket and add API contract testing
  - Implement logic to detect feature stories and add user-facing documentation prompts
  - Implement logic to detect data changes and add data validation prompts
  - Implement generateCISection() that includes CI status when MR is provided, placeholder otherwise
  - _Requirements: 2.4, 5.4, 6.1, 6.4, 7.4, 10.3_

- [x] 11.1 Write property test for conditional MR sections



  - **Property 5: Conditional MR section inclusion**
  - **Validates: Requirements 2.4, 6.1, 6.4**

- [x] 11.2 Write property test for API-related content





  - **Property 12: API-related conditional content**
  - **Validates: Requirements 5.4**

- [x] 11.3 Write property test for feature-related content




  - **Property 13: Feature-related conditional content**
  - **Validates: Requirements 10.3**

- [x] 11.4 Write property test for data change content




  - **Property 14: Data change conditional content**
  - **Validates: Requirements 7.4**
-

- [x] 11.5 Write unit tests for conditional logic




  - Test API term detection with various ticket descriptions
  - Test feature detection with different issue types
  - Test data change detection with various keywords

- [x] 12. Implement Markdown formatter




  - Create MarkdownFormatter class with formatDoDTable() method
  - Implement formatSection() to create Markdown table rows
  - Implement formatRow() to format individual DoD items with checkbox syntax
  - Implement CI status formatting with appropriate indicators (✓, ✗, ⟳)
  - Ensure output is valid Markdown
  - _Requirements: 3.1, 4.2, 6.2, 6.3_

- [x] 12.1 Write property test for Markdown validity


  - **Property 6: Valid Markdown output structure**
  - **Validates: Requirements 3.1, 4.2**

- [x] 12.2 Write property test for CI status representation


  - **Property 15: CI status representation**
  - **Validates: Requirements 6.2, 6.3**

- [x] 12.3 Write unit tests for Markdown formatter


  - Test table formatting with various DoD structures
  - Test checkbox formatting
  - Test CI status indicators for different statuses

- [x] 13. Implement Jira format converter





  - Implement formatForJira() method in MarkdownFormatter
  - Convert Markdown checkboxes to Jira format
  - Convert Markdown tables to Jira wiki markup (|| for headers, | for cells)
  - Preserve code blocks and other formatting
  - _Requirements: 8.2_

- [ ] 13.1 Write property test for Jira format transformation



  - **Property 17: Jira format transformation**
  - **Validates: Requirements 8.2**

- [x] 13.2 Write unit tests for Jira converter

  - Test checkbox conversion
  - Test table conversion
  - Test preservation of code blocks and formatting
-

- [x] 14. Implement comment posting functionality




  - Implement postComment() method in JiraFetcher
  - Use Jira REST API to add comment to ticket
  - Handle post_comment flag to conditionally post
  - Implement error handling that returns DoD even if posting fails
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 14.1 Write property test for comment posting behavior


  - **Property 16: Comment posting conditional behavior**
  - **Validates: Requirements 8.1, 8.4**

- [x] 14.2 Write property test for partial failure handling

  - **Property 18: Graceful error handling with partial success**
  - **Validates: Requirements 8.3**

- [x] 14.3 Write unit tests for comment posting

  - Test posting with mocked successful API call
  - Test that posting only occurs when flag is enabled
  - Test error handling when posting fails

- [x] 15. Implement main orchestration logic





  - Create main generateDoDFromInput() function that orchestrates all components
  - Parse and validate input
  - Fetch Jira ticket (from URL or use provided JSON)
  - Optionally fetch GitLab MR
  - Infer ticket type
  - Generate DoD table
  - Format as Markdown
  - Optionally post comment to Jira
  - Return formatted DoD and any errors
  - _Requirements: All_

- [x] 15.1 Write integration tests for full flow


  - Test complete flow with mocked APIs
  - Test flow with only ticket (no MR)
  - Test flow with ticket and MR
  - Test flow with comment posting
  - Test error recovery scenarios

- [x] 16. Implement CLI interface





  - Create CLI entry point using commander
  - Define command-line options: --ticket-url, --ticket-json, --mr-url, --type, --post-comment
  - Read API tokens from environment variables (JIRA_TOKEN, GITLAB_TOKEN)
  - Read base URLs from environment variables with defaults
  - Call main orchestration function with parsed arguments
  - Display formatted DoD to stdout
  - Display errors to stderr with appropriate exit codes
  - _Requirements: All_

- [x] 16.1 Write CLI integration tests


  - Test CLI with various argument combinations
  - Test environment variable reading
  - Test output formatting
  - Test error handling and exit codes

- [x] 17. Add configuration file support





  - Implement .dodrc.json configuration file loading
  - Support configuration for base URLs, default ticket type, etc.
  - Merge configuration: CLI args > env vars > config file > defaults
  - _Requirements: All_

- [x] 18. Create example fixtures and documentation




  - Create example Jira ticket JSON fixtures
  - Create example GitLab MR JSON fixtures
  - Create README with usage examples
  - Document API token setup
  - Document configuration options
  - _Requirements: All_



- [x] 19. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
