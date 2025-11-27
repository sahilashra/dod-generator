# Documentation Index

This document provides an overview of all documentation and example files in the DoD Generator project.

## 📚 Main Documentation

### [README.md](README.md)
**The main entry point for the project.**

Contains:
- Project overview and features
- Installation instructions
- Quick start guide
- Usage examples
- Configuration overview
- API token setup
- Input/output formats
- Troubleshooting basics

**Start here if you're new to the project.**

---

## 📖 Detailed Documentation

### [docs/API.md](docs/API.md)
**Complete API reference for programmatic usage.**

Contains:
- Main function documentation
- Type definitions
- Class references (JiraFetcher, GitLabFetcher, DoDGenerator, etc.)
- Utility functions
- Type guards
- Error handling
- Programmatic examples

**Use this when integrating the library into your code.**

---

### [docs/CONFIGURATION.md](docs/CONFIGURATION.md)
**Comprehensive configuration guide.**

Contains:
- Configuration sources (file, env vars, CLI)
- Configuration precedence rules
- Configuration file format
- Environment variable setup
- CLI options reference
- Configuration examples for different scenarios
- Best practices
- Security recommendations

**Use this to set up your environment and configuration.**

---

### [docs/EXAMPLES.md](docs/EXAMPLES.md)
**Practical usage examples and recipes.**

Contains:
- Quick start examples
- CLI usage examples
- Programmatic usage examples
- Real-world scenarios (CI/CD, pre-commit hooks, Slack integration)
- Testing examples
- Tips and tricks

**Use this for copy-paste examples and inspiration.**

---

### [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
**Solutions to common problems.**

Contains:
- Authentication issues
- API connection issues
- Configuration issues
- Input validation issues
- Output issues
- Performance issues
- Common error messages and solutions
- Debug checklist

**Use this when something isn't working.**

---

## 🧪 Example Fixtures

### [fixtures/README.md](fixtures/README.md)
**Guide to example fixture files.**

Contains:
- Description of each fixture file
- Use cases for each fixture
- Usage examples
- Testing scenarios
- Fixture validation
- Creating custom fixtures

**Use this to understand and test with example data.**

---

### Jira Ticket Fixtures

Located in `fixtures/` directory:

- **jira-backend-ticket.json** - Backend API development ticket
  - 5 acceptance criteria
  - Labels: backend, api, security
  - Use case: Testing backend-specific DoD generation

- **jira-frontend-ticket.json** - Frontend UI development ticket
  - 5 acceptance criteria
  - Labels: frontend, ui, dashboard
  - Use case: Testing frontend-specific DoD generation

- **jira-infrastructure-ticket.json** - Infrastructure deployment ticket
  - 5 acceptance criteria
  - Labels: infrastructure, kubernetes, devops
  - Use case: Testing infrastructure-specific DoD generation

- **jira-bug-ticket.json** - Bug fix ticket
  - 3 acceptance criteria
  - Labels: backend, bug, performance
  - Use case: Testing DoD generation for bug fixes

---

### GitLab MR Fixtures

Located in `fixtures/` directory:

- **gitlab-mr-passed.json** - MR with passing CI
  - CI Status: passed ✓
  - 6 changed files
  - Use case: Testing successful CI status display

- **gitlab-mr-failed.json** - MR with failed CI
  - CI Status: failed ✗
  - 3 changed files
  - Use case: Testing failed CI status display

- **gitlab-mr-running.json** - MR with running CI
  - CI Status: running ⟳
  - 6 changed files
  - Use case: Testing in-progress CI status display

---

## 🔧 Configuration Files

### [.dodrc.json.example](.dodrc.json.example)
**Example configuration file.**

Contains:
- Sample Jira configuration
- Sample GitLab configuration
- Default settings

**Copy this to `.dodrc.json` and customize with your values.**

---

## 🚀 Quick Reference

### For First-Time Users

1. Read [README.md](README.md) - Overview and quick start
2. Follow [API Token Setup](README.md#api-token-setup) - Set up authentication
3. Try [Quick Start Examples](README.md#quick-start) - Generate your first DoD
4. Check [docs/EXAMPLES.md](docs/EXAMPLES.md) - More usage examples

### For Developers

1. Read [docs/API.md](docs/API.md) - API reference
2. Check [fixtures/README.md](fixtures/README.md) - Test data
3. Review [docs/EXAMPLES.md](docs/EXAMPLES.md) - Integration examples
4. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) - Configuration options

### For Troubleshooting

1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues
2. Review [README.md#troubleshooting](README.md#troubleshooting) - Quick fixes
3. Validate fixtures with `scripts/validate-fixtures.ts`
4. Test with example data from `fixtures/`

---

## 📁 Project Structure

```
dod-generator/
├── README.md                          # Main documentation
├── DOCUMENTATION_INDEX.md             # This file
├── .dodrc.json.example                # Example configuration
│
├── docs/                              # Detailed documentation
│   ├── API.md                         # API reference
│   ├── CONFIGURATION.md               # Configuration guide
│   ├── EXAMPLES.md                    # Usage examples
│   └── TROUBLESHOOTING.md             # Troubleshooting guide
│
├── fixtures/                          # Example data
│   ├── README.md                      # Fixtures guide
│   ├── jira-backend-ticket.json       # Backend ticket example
│   ├── jira-frontend-ticket.json      # Frontend ticket example
│   ├── jira-infrastructure-ticket.json # Infrastructure ticket example
│   ├── jira-bug-ticket.json           # Bug ticket example
│   ├── gitlab-mr-passed.json          # Passed CI example
│   ├── gitlab-mr-failed.json          # Failed CI example
│   └── gitlab-mr-running.json         # Running CI example
│
├── scripts/                           # Utility scripts
│   ├── validate-fixtures.ts           # Validate fixture files
│   └── test-fixture.ts                # Test with fixtures
│
└── src/                               # Source code
    ├── cli/                           # CLI interface
    ├── config/                        # Configuration loading
    ├── fetchers/                      # API fetchers
    ├── formatters/                    # Output formatters
    ├── generators/                    # DoD generation logic
    ├── models/                        # Type definitions
    ├── parsers/                       # Input parsing
    └── utils/                         # Utility functions
```

---

## 🎯 Common Tasks

### Generate DoD from Jira Ticket

```bash
dod-gen --ticket-url https://jira.example.com/browse/ABC-123
```

See: [README.md#quick-start](README.md#quick-start)

---

### Generate DoD with Merge Request

```bash
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --mr-url https://gitlab.com/project/repo/-/merge_requests/456
```

See: [docs/EXAMPLES.md#with-merge-request](docs/EXAMPLES.md#with-merge-request)

---

### Test with Example Data

```bash
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```

See: [fixtures/README.md](fixtures/README.md)

---

### Set Up Configuration

```bash
cp .dodrc.json.example .dodrc.json
# Edit .dodrc.json with your values
```

See: [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

---

### Programmatic Usage

```typescript
import { generateDoDFromInput } from 'dod-generator';

const result = await generateDoDFromInput({
  ticket_url: 'https://jira.example.com/browse/ABC-123',
  jira_token: process.env.JIRA_TOKEN
});

console.log(result.dod);
```

See: [docs/API.md](docs/API.md)

---

## 🔍 Finding Information

### By Topic

| Topic | Document |
|-------|----------|
| Getting Started | [README.md](README.md) |
| Installation | [README.md#installation](README.md#installation) |
| Configuration | [docs/CONFIGURATION.md](docs/CONFIGURATION.md) |
| API Reference | [docs/API.md](docs/API.md) |
| Usage Examples | [docs/EXAMPLES.md](docs/EXAMPLES.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Test Data | [fixtures/README.md](fixtures/README.md) |
| API Tokens | [README.md#api-token-setup](README.md#api-token-setup) |

### By Use Case

| Use Case | Document |
|----------|----------|
| CLI Usage | [README.md#usage](README.md#usage) |
| Programmatic Usage | [docs/API.md](docs/API.md) |
| CI/CD Integration | [docs/EXAMPLES.md#scenario-3-cicd-integration](docs/EXAMPLES.md#scenario-3-cicd-integration) |
| Testing | [fixtures/README.md](fixtures/README.md) |
| Configuration | [docs/CONFIGURATION.md](docs/CONFIGURATION.md) |
| Error Handling | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

---

## 📝 Contributing

When adding new documentation:

1. Update this index file
2. Follow existing documentation style
3. Include practical examples
4. Add cross-references to related docs
5. Update the project structure diagram if needed

---

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: https://github.com/yourusername/dod-generator/issues
- 📖 Wiki: https://github.com/yourusername/dod-generator/wiki

---

**Last Updated:** 2024-01-15

**Version:** 1.0.0
