# DoD Generator

A command-line tool that automatically generates comprehensive Definition-of-Done (DoD) checklists from Jira tickets and GitLab merge requests. The tool creates structured, type-specific DoD tables that ensure development work meets quality standards before being marked complete.

## Features

- 🎯 **Automatic DoD Generation**: Creates comprehensive checklists from Jira tickets
- 🔄 **GitLab Integration**: Includes CI status and code change information from merge requests
- 🎨 **Type-Specific Templates**: Tailored DoD sections for backend, frontend, and infrastructure work
- 📝 **Acceptance Criteria Mapping**: Automatically extracts and maps acceptance criteria to DoD items
- 💬 **Jira Comment Posting**: Optionally post generated DoD back to Jira as a comment
- ⚙️ **Flexible Configuration**: Support for CLI args, environment variables, and config files
- 📊 **CI Status Tracking**: Visual indicators for pipeline status (✓ passed, ✗ failed, ⟳ running)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [API Token Setup](#api-token-setup)
- [Input Formats](#input-formats)
- [Output Format](#output-format)
- [Example Fixtures](#example-fixtures)
- [Development](#development)

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/dod-generator.git
cd dod-generator

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage (optional)
npm link
```

### From npm (when published)

```bash
npm install -g dod-generator
```

## Quick Start

1. **Set up your API tokens** (see [API Token Setup](#api-token-setup))

```bash
export JIRA_TOKEN="your-jira-api-token"
export GITLAB_TOKEN="your-gitlab-personal-access-token"
```

2. **Generate a DoD from a Jira ticket**

```bash
dod-gen --ticket-url https://jira.example.com/browse/BACKEND-123
```

3. **Include merge request information**

```bash
dod-gen --ticket-url https://jira.example.com/browse/BACKEND-123 \
        --mr-url https://gitlab.com/project/merge_requests/456
```

## Usage Examples

### Basic Usage

```bash
# Generate DoD from a Jira ticket URL
dod-gen --ticket-url https://jira.example.com/browse/ABC-123

# Generate DoD from ticket JSON (useful for testing or offline use)
dod-gen --ticket-json '{"key":"ABC-123","summary":"Implement feature",...}'

# Use a fixture file for testing
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```

### With Merge Request

```bash
# Include GitLab merge request information
dod-gen --ticket-url https://jira.example.com/browse/BACKEND-123 \
        --mr-url https://gitlab.com/example/project/-/merge_requests/456
```

### Specify Ticket Type

```bash
# Explicitly set the ticket type (overrides automatic detection)
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type frontend

# Available types: backend, frontend, infrastructure
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type infrastructure
```

### Post to Jira

```bash
# Generate DoD and post it as a comment to the Jira ticket
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --post-comment

# Combine with merge request
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --mr-url https://gitlab.com/project/merge_requests/456 \
        --post-comment
```

### Using Configuration File

```bash
# Use default config file (.dodrc.json in current or parent directory)
dod-gen --ticket-url https://jira.example.com/browse/ABC-123

# Specify custom config directory
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --config /path/to/config
```

### Programmatic Usage

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
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

## Configuration

The DoD Generator supports configuration from multiple sources with the following precedence:

**CLI arguments > Environment variables > Configuration file > Defaults**

### Configuration File

Create a `.dodrc.json` file in your project directory or any parent directory:

```json
{
  "jira": {
    "baseUrl": "https://your-jira-instance.atlassian.net",
    "token": "your-jira-api-token"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.com",
    "token": "your-gitlab-personal-access-token"
  },
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

**Configuration Options:**

- `jira.baseUrl` - Your Jira instance URL (e.g., `https://company.atlassian.net`)
- `jira.token` - Jira API token for authentication
- `gitlab.baseUrl` - GitLab instance URL (default: `https://gitlab.com`)
- `gitlab.token` - GitLab personal access token
- `defaults.ticketType` - Default ticket type when not specified (`backend`, `frontend`, or `infrastructure`)
- `defaults.postComment` - Whether to post DoD as Jira comment by default (`true` or `false`)

You can also specify a custom config directory:

```bash
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --config /path/to/config
```

### Environment Variables

You can set environment variables directly or use a `.env` file (recommended).

**Option A: Using .env file (Recommended)**

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
```

`.env` file contents:
```bash
# Jira configuration
JIRA_BASE_URL=https://your-jira-instance.atlassian.net
JIRA_TOKEN=your-jira-api-token

# GitLab configuration
GITLAB_BASE_URL=https://gitlab.com
GITLAB_TOKEN=your-gitlab-personal-access-token
```

**Option B: Export environment variables**

```bash
# Jira configuration
export JIRA_BASE_URL="https://your-jira-instance.atlassian.net"
export JIRA_TOKEN="your-jira-api-token"

# GitLab configuration
export GITLAB_BASE_URL="https://gitlab.com"
export GITLAB_TOKEN="your-gitlab-personal-access-token"
```

**Note:** The `.env` file is automatically loaded when you run the CLI. Make sure `.env` is in your `.gitignore` to avoid committing secrets!

### CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--ticket-url <url>` | Jira ticket URL | `--ticket-url https://jira.example.com/browse/ABC-123` |
| `--ticket-json <json>` | Jira ticket data as JSON string | `--ticket-json '{"key":"ABC-123",...}'` |
| `--mr-url <url>` | GitLab merge request URL | `--mr-url https://gitlab.com/project/merge_requests/456` |
| `--type <type>` | Ticket type (backend/frontend/infrastructure) | `--type frontend` |
| `--post-comment` | Post the generated DoD as a comment to Jira | `--post-comment` |
| `--config <path>` | Path to configuration file directory | `--config /path/to/config` |

## API Token Setup

For security, it's recommended to store API tokens in environment variables or a configuration file rather than passing them via CLI arguments.

### Jira API Token

1. **Navigate to Atlassian Account Settings**
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens

2. **Create an API Token**
   - Click "Create API token"
   - Give it a descriptive label (e.g., "DoD Generator")
   - Copy the generated token immediately (you won't be able to see it again)

3. **Configure the Token**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export JIRA_TOKEN="your-jira-api-token"
   ```
   
   **Option B: Configuration File**
   ```json
   {
     "jira": {
       "baseUrl": "https://your-company.atlassian.net",
       "token": "your-jira-api-token"
     }
   }
   ```

4. **Set Your Jira Base URL**
   ```bash
   export JIRA_BASE_URL="https://your-company.atlassian.net"
   ```

### GitLab Personal Access Token

1. **Navigate to GitLab Access Tokens**
   - Go to GitLab Settings > Access Tokens
   - Or visit: https://gitlab.com/-/profile/personal_access_tokens

2. **Create a Personal Access Token**
   - Give it a descriptive name (e.g., "DoD Generator")
   - Set an expiration date (optional but recommended)
   - Select the `read_api` scope (required for reading MR data)
   - Click "Create personal access token"
   - Copy the generated token immediately

3. **Configure the Token**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export GITLAB_TOKEN="your-gitlab-personal-access-token"
   ```
   
   **Option B: Configuration File**
   ```json
   {
     "gitlab": {
       "baseUrl": "https://gitlab.com",
       "token": "your-gitlab-personal-access-token"
     }
   }
   ```

4. **Set Your GitLab Base URL** (if using self-hosted GitLab)
   ```bash
   export GITLAB_BASE_URL="https://gitlab.your-company.com"
   ```

### Security Best Practices

- ✅ **DO** store tokens in environment variables or secure configuration files
- ✅ **DO** add `.dodrc.json` to your `.gitignore` if it contains tokens
- ✅ **DO** use token expiration dates and rotate tokens regularly
- ✅ **DO** limit token scopes to only what's needed (`read_api` for GitLab)
- ❌ **DON'T** commit tokens to version control
- ❌ **DON'T** share tokens in chat or email
- ❌ **DON'T** pass tokens as CLI arguments in shared scripts

## Input Formats

### Ticket URL Format

The tool accepts Jira ticket URLs in the following format:

```
https://your-jira-instance.atlassian.net/browse/TICKET-KEY
```

Examples:
- `https://company.atlassian.net/browse/BACKEND-123`
- `https://jira.example.com/browse/FRONTEND-456`
- `https://mycompany.atlassian.net/browse/INFRA-789`

### Ticket JSON Format

You can also provide ticket data directly as JSON (useful for testing or offline use):

```json
{
  "key": "BACKEND-123",
  "summary": "Implement user authentication API endpoint",
  "description": "Create a new REST API endpoint...",
  "labels": ["backend", "api", "security"],
  "issueType": "Story",
  "linkedIssues": ["BACKEND-100"],
  "acceptanceCriteria": [
    "The endpoint should accept username and password",
    "The endpoint should return a JWT token"
  ]
}
```

**Required Fields:**
- `key` - Ticket identifier (e.g., "BACKEND-123")
- `summary` - Ticket title
- `description` - Full ticket description
- `labels` - Array of labels (used for type detection)
- `issueType` - Jira issue type (e.g., "Story", "Bug", "Task")
- `linkedIssues` - Array of linked ticket keys

**Optional Fields:**
- `acceptanceCriteria` - Array of acceptance criteria (if not in description)

### Merge Request URL Format

GitLab merge request URLs should be in the format:

```
https://gitlab.com/namespace/project/-/merge_requests/NUMBER
```

Examples:
- `https://gitlab.com/mycompany/backend/-/merge_requests/123`
- `https://gitlab.example.com/team/frontend/-/merge_requests/456`

### Input Precedence

When both `ticket_url` and `ticket_json` are provided:
- The tool will **fetch fresh data from the URL** (ticket_url takes precedence)
- The `ticket_json` will be ignored
- This ensures you always get the latest ticket data

## Output Format

The tool generates a Markdown-formatted DoD table with the following structure:

### Standard Sections (All Ticket Types)

1. **Acceptance Criteria** - Mapped from ticket acceptance criteria
2. **Automated Tests** - Unit, integration, and E2E test requirements
3. **Manual Test Steps** - Template for manual testing scenarios
4. **Documentation Updates** - Prompts for documentation changes
5. **Reviewer Checklist** - Code review verification items

### Type-Specific Sections

**Backend Tickets:**
- API Contract Changes
- Monitoring and Logging Changes
- Rollback and Migration Notes

**Frontend Tickets:**
- UI/UX Validation
- Accessibility Compliance

**Infrastructure Tickets:**
- Deployment Procedures
- Infrastructure Validation

### Conditional Sections

- **CI Status** - Included when merge request URL is provided
- **API Contract Testing** - Included when ticket mentions API-related terms
- **User-Facing Documentation** - Included for feature stories
- **Data Validation** - Included when ticket mentions data changes

### Example Output

```markdown
# Definition of Done: BACKEND-123

**Ticket:** Implement user authentication API endpoint
**Type:** backend
**Generated:** 2024-01-15T10:30:00Z

## Acceptance Criteria
- [ ] The endpoint should accept username and password via POST request
- [ ] The endpoint should validate credentials against the user database
- [ ] The endpoint should return a JWT token on successful authentication

## CI Status
✓ Pipeline passed

## Automated Tests
- [ ] Unit tests for authentication logic
- [ ] Integration tests for API endpoint
- [ ] API contract tests

## API Contract Changes
- [ ] API documentation updated
- [ ] Breaking changes documented
- [ ] Backward compatibility verified

...
```

## Example Fixtures

The `fixtures/` directory contains example Jira tickets and GitLab merge requests for testing and reference:

### Jira Ticket Fixtures

- **`jira-backend-ticket.json`** - Backend API development ticket
  - Demonstrates: API endpoint implementation, authentication, security
  - Labels: backend, api, security
  - Acceptance criteria: 5 items

- **`jira-frontend-ticket.json`** - Frontend UI development ticket
  - Demonstrates: Responsive design, data visualization, accessibility
  - Labels: frontend, ui, dashboard
  - Acceptance criteria: 5 items

- **`jira-infrastructure-ticket.json`** - Infrastructure deployment ticket
  - Demonstrates: Kubernetes setup, monitoring, auto-scaling
  - Labels: infrastructure, kubernetes, devops
  - Acceptance criteria: 5 items

- **`jira-bug-ticket.json`** - Bug fix ticket
  - Demonstrates: Performance issue, memory leak
  - Labels: backend, bug, performance
  - Acceptance criteria: 3 items

### GitLab MR Fixtures

- **`gitlab-mr-passed.json`** - Merge request with passing CI
  - CI Status: passed ✓
  - Changed files: 6 files (implementation, tests, docs)

- **`gitlab-mr-failed.json`** - Merge request with failed CI
  - CI Status: failed ✗
  - Changed files: 3 files

- **`gitlab-mr-running.json`** - Merge request with running CI
  - CI Status: running ⟳
  - Changed files: 6 files

### Using Fixtures

```bash
# Generate DoD from a fixture file
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Combine ticket and MR fixtures
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)" \
        --mr-url https://gitlab.com/example/project/-/merge_requests/123

# Test different ticket types
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)"
dod-gen --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
dod-generator/
├── src/
│   ├── cli/              # CLI interface
│   ├── config/           # Configuration loading
│   ├── fetchers/         # API fetchers (Jira, GitLab)
│   ├── formatters/       # Output formatters (Markdown, Jira)
│   ├── generators/       # DoD generation logic
│   ├── models/           # Type definitions
│   ├── parsers/          # Input parsing and validation
│   └── utils/            # Utility functions
├── fixtures/             # Example data for testing
├── dist/                 # Compiled output
└── tests/                # Test files
```

### Running Tests

The project uses Jest for unit testing and fast-check for property-based testing:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/generators/DoDGenerator.test.ts

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

**Issue: "Invalid Jira token" or 401 error**
- Verify your Jira API token is correct
- Ensure you're using the correct Jira base URL
- Check that the token hasn't expired

**Issue: "GitLab API error" or 404**
- Verify the merge request URL is correct
- Ensure your GitLab token has `read_api` scope
- Check that you have access to the repository

**Issue: "No acceptance criteria found"**
- The tool will generate a placeholder section
- Manually add acceptance criteria to the ticket description
- Use the format: "Acceptance Criteria:" followed by numbered or bulleted list

**Issue: "Cannot determine ticket type"**
- Add labels to your Jira ticket (backend, frontend, infrastructure)
- Use the `--type` CLI option to specify explicitly
- Set a default type in `.dodrc.json`

### Debug Mode

For detailed logging, set the `DEBUG` environment variable:

```bash
DEBUG=dod-gen:* dod-gen --ticket-url https://jira.example.com/browse/ABC-123
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@example.com
- 🐛 Issues: https://github.com/yourusername/dod-generator/issues
- 📖 Documentation: https://github.com/yourusername/dod-generator/wiki
