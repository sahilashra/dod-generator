# 🚀 Quick Start Guide

Get up and running with DoD Generator in 5 minutes!

## Prerequisites

- Node.js v14 or higher
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build the Project

```bash
npm run build
```

## Step 3: Configure Your Credentials

### Option A: Using .env file (Recommended)

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```bash
# Jira Configuration
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_TOKEN=your-jira-api-token

# GitLab Configuration
GITLAB_BASE_URL=https://gitlab.com
GITLAB_TOKEN=your-gitlab-personal-access-token
```

### Option B: Using environment variables

```bash
export JIRA_BASE_URL="https://your-company.atlassian.net"
export JIRA_TOKEN="your-jira-api-token"
export GITLAB_BASE_URL="https://gitlab.com"
export GITLAB_TOKEN="your-gitlab-token"
```

## Step 4: Test with Fixtures (No API tokens needed!)

Try the tool with the provided example tickets:

```bash
# Backend ticket
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Frontend ticket
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-frontend-ticket.json)"

# Infrastructure ticket
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"
```

On Windows (PowerShell):
```powershell
# Backend ticket
Get-Content fixtures/jira-backend-ticket.json | node dist/cli/index.js --ticket-json "@-"
```

## Step 5: Generate DoD from Real Jira Ticket

Once you have your credentials set up:

```bash
# Basic usage
node dist/cli/index.js --ticket-url https://your-jira.atlassian.net/browse/TICKET-123

# With merge request
node dist/cli/index.js \
  --ticket-url https://your-jira.atlassian.net/browse/TICKET-123 \
  --mr-url https://gitlab.com/your-project/merge_requests/456

# Save to file
node dist/cli/index.js --ticket-url https://your-jira.atlassian.net/browse/TICKET-123 > dod.md

# Post as Jira comment
node dist/cli/index.js --ticket-url https://your-jira.atlassian.net/browse/TICKET-123 --post-comment
```

## 🔑 Getting API Tokens

### Jira API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "DoD Generator")
4. Copy the token and add it to your `.env` file

### GitLab Personal Access Token

1. Go to: GitLab Settings > Access Tokens
2. Create a new token with `read_api` scope
3. Copy the token and add it to your `.env` file

## ✅ Verify Everything Works

Run the test suite:

```bash
npm test
```

All 284 tests should pass! ✨

## 📖 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the [fixtures/](fixtures/) directory for example data
- Explore the [docs/](docs/) directory for API documentation

## 🆘 Troubleshooting

**Issue: "Cannot find module 'dotenv'"**
```bash
npm install
npm run build
```

**Issue: "Invalid Jira token"**
- Verify your token in `.env` is correct
- Check that `JIRA_BASE_URL` matches your Jira instance

**Issue: "GitLab API error"**
- Verify your GitLab token has `read_api` scope
- Check that the merge request URL is correct

## 💡 Pro Tips

1. **Use fixtures for testing** - No need for API tokens!
2. **Save DoD to file** - Use `> dod.md` to save output
3. **Create aliases** - Add to your `.bashrc` or `.zshrc`:
   ```bash
   alias dod='node /path/to/dod-generator/dist/cli/index.js'
   ```
4. **Use .dodrc.json** - Store default settings in a config file

## 🎯 Common Commands

```bash
# Test with fixture
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Generate from Jira
node dist/cli/index.js --ticket-url https://jira.example.com/browse/ABC-123

# With MR and save to file
node dist/cli/index.js \
  --ticket-url https://jira.example.com/browse/ABC-123 \
  --mr-url https://gitlab.com/project/merge_requests/456 \
  > dod.md

# Post to Jira
node dist/cli/index.js \
  --ticket-url https://jira.example.com/browse/ABC-123 \
  --post-comment

# Override ticket type
node dist/cli/index.js \
  --ticket-url https://jira.example.com/browse/ABC-123 \
  --type frontend
```

Happy DoD generating! 🎉
