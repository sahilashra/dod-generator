# Configuration Guide

This guide covers all configuration options for the DoD Generator.

## Table of Contents

- [Configuration Sources](#configuration-sources)
- [Configuration Precedence](#configuration-precedence)
- [Configuration File](#configuration-file)
- [Environment Variables](#environment-variables)
- [CLI Options](#cli-options)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Configuration Sources

The DoD Generator supports three configuration sources:

1. **Configuration File** (`.dodrc.json`)
2. **Environment Variables**
3. **CLI Arguments**

## Configuration Precedence

Configuration is merged with the following precedence (highest to lowest):

```
CLI Arguments > Environment Variables > Configuration File > Defaults
```

This means:
- CLI arguments override everything
- Environment variables override config file and defaults
- Config file overrides defaults
- Defaults are used when nothing else is specified

### Example

```json
// .dodrc.json
{
  "jira": {
    "baseUrl": "https://company.atlassian.net"
  },
  "defaults": {
    "ticketType": "backend"
  }
}
```

```bash
# Environment variable overrides config file
export JIRA_BASE_URL="https://other-company.atlassian.net"

# CLI argument overrides both
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type frontend
# Result: Uses other-company.atlassian.net (env) and frontend (CLI)
```

## Configuration File

### Location

The tool searches for `.dodrc.json` in the following locations (in order):

1. Current working directory
2. Parent directories (up to root)
3. User home directory (`~/.dodrc.json`)

You can also specify a custom location:

```bash
dod-gen --config /path/to/config/directory
```

### Format

The configuration file must be valid JSON:

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

### Configuration Options

#### jira

Jira-specific configuration.

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `baseUrl` | string | Jira instance URL | `"https://company.atlassian.net"` |
| `token` | string | Jira API token | `"your-api-token"` |

#### gitlab

GitLab-specific configuration.

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `baseUrl` | string | GitLab instance URL | `"https://gitlab.com"` |
| `token` | string | GitLab personal access token | `"your-pat-token"` |

#### defaults

Default values for optional parameters.

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `ticketType` | string | Default ticket type | `"backend"`, `"frontend"`, or `"infrastructure"` |
| `postComment` | boolean | Whether to post to Jira by default | `true` or `false` |

### Example Configuration Files

#### Minimal Configuration

```json
{
  "jira": {
    "baseUrl": "https://company.atlassian.net"
  }
}
```

#### Full Configuration

```json
{
  "jira": {
    "baseUrl": "https://company.atlassian.net",
    "token": "jira-api-token-here"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.company.com",
    "token": "gitlab-pat-token-here"
  },
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

#### Team Configuration (No Tokens)

For shared team configurations, omit tokens and use environment variables instead:

```json
{
  "jira": {
    "baseUrl": "https://company.atlassian.net"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.company.com"
  },
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

Then each developer sets their own tokens:

```bash
export JIRA_TOKEN="personal-jira-token"
export GITLAB_TOKEN="personal-gitlab-token"
```

## Environment Variables

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JIRA_BASE_URL` | Jira instance URL | `https://company.atlassian.net` |
| `JIRA_TOKEN` | Jira API token | `your-api-token` |
| `GITLAB_BASE_URL` | GitLab instance URL | `https://gitlab.com` |
| `GITLAB_TOKEN` | GitLab personal access token | `your-pat-token` |

### Setting Environment Variables

#### Linux/macOS

**Temporary (current session):**

```bash
export JIRA_BASE_URL="https://company.atlassian.net"
export JIRA_TOKEN="your-jira-token"
export GITLAB_BASE_URL="https://gitlab.com"
export GITLAB_TOKEN="your-gitlab-token"
```

**Permanent (add to `~/.bashrc` or `~/.zshrc`):**

```bash
echo 'export JIRA_BASE_URL="https://company.atlassian.net"' >> ~/.bashrc
echo 'export JIRA_TOKEN="your-jira-token"' >> ~/.bashrc
echo 'export GITLAB_BASE_URL="https://gitlab.com"' >> ~/.bashrc
echo 'export GITLAB_TOKEN="your-gitlab-token"' >> ~/.bashrc
source ~/.bashrc
```

#### Windows

**Temporary (current session):**

```cmd
set JIRA_BASE_URL=https://company.atlassian.net
set JIRA_TOKEN=your-jira-token
set GITLAB_BASE_URL=https://gitlab.com
set GITLAB_TOKEN=your-gitlab-token
```

**PowerShell:**

```powershell
$env:JIRA_BASE_URL="https://company.atlassian.net"
$env:JIRA_TOKEN="your-jira-token"
$env:GITLAB_BASE_URL="https://gitlab.com"
$env:GITLAB_TOKEN="your-gitlab-token"
```

**Permanent (System Properties):**

1. Open System Properties → Advanced → Environment Variables
2. Add new user variables:
   - `JIRA_BASE_URL` = `https://company.atlassian.net`
   - `JIRA_TOKEN` = `your-jira-token`
   - `GITLAB_BASE_URL` = `https://gitlab.com`
   - `GITLAB_TOKEN` = `your-gitlab-token`

### Using .env Files

For local development, you can use a `.env` file with a tool like `dotenv`:

```bash
# .env
JIRA_BASE_URL=https://company.atlassian.net
JIRA_TOKEN=your-jira-token
GITLAB_BASE_URL=https://gitlab.com
GITLAB_TOKEN=your-gitlab-token
```

**Important:** Add `.env` to your `.gitignore` to avoid committing secrets!

## CLI Options

### Available Options

| Option | Short | Type | Description |
|--------|-------|------|-------------|
| `--ticket-url` | `-t` | string | Jira ticket URL |
| `--ticket-json` | `-j` | string | Jira ticket JSON data |
| `--mr-url` | `-m` | string | GitLab merge request URL |
| `--type` | | string | Ticket type (backend/frontend/infrastructure) |
| `--post-comment` | `-p` | boolean | Post DoD as Jira comment |
| `--config` | `-c` | string | Custom config directory path |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

### Usage Examples

```bash
# Basic usage
dod-gen --ticket-url https://jira.example.com/browse/ABC-123

# Short form
dod-gen -t https://jira.example.com/browse/ABC-123

# Multiple options
dod-gen -t https://jira.example.com/browse/ABC-123 \
        -m https://gitlab.com/project/repo/-/merge_requests/456 \
        --type backend \
        -p

# Custom config
dod-gen -t https://jira.example.com/browse/ABC-123 \
        -c /path/to/config

# Using ticket JSON
dod-gen -j '{"key":"ABC-123","summary":"...",...}'

# From file
dod-gen -j "$(cat fixtures/jira-backend-ticket.json)"
```

## Examples

### Example 1: Development Setup

**Scenario:** Developer working on multiple projects with different Jira instances.

**Solution:** Use environment variables for tokens, config file for base URLs.

```json
// ~/.dodrc.json (global config)
{
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

```json
// /project-a/.dodrc.json
{
  "jira": {
    "baseUrl": "https://project-a.atlassian.net"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.com"
  }
}
```

```json
// /project-b/.dodrc.json
{
  "jira": {
    "baseUrl": "https://project-b.atlassian.net"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.company.com"
  }
}
```

```bash
# Set tokens once
export JIRA_TOKEN="your-token"
export GITLAB_TOKEN="your-token"

# Use in project-a
cd /project-a
dod-gen -t https://project-a.atlassian.net/browse/ABC-123

# Use in project-b
cd /project-b
dod-gen -t https://project-b.atlassian.net/browse/XYZ-456
```

### Example 2: CI/CD Pipeline

**Scenario:** Automated DoD generation in CI/CD pipeline.

**Solution:** Use environment variables from CI secrets.

```yaml
# .gitlab-ci.yml
generate-dod:
  script:
    - npm install -g dod-generator
    - |
      dod-gen \
        --ticket-url $CI_MERGE_REQUEST_DESCRIPTION \
        --mr-url $CI_MERGE_REQUEST_URL \
        --post-comment
  variables:
    JIRA_TOKEN: $JIRA_API_TOKEN
    GITLAB_TOKEN: $GITLAB_PAT_TOKEN
```

### Example 3: Team Configuration

**Scenario:** Team wants shared configuration without exposing tokens.

**Solution:** Commit config file without tokens, use environment variables.

```json
// .dodrc.json (committed to repo)
{
  "jira": {
    "baseUrl": "https://company.atlassian.net"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.company.com"
  },
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

```bash
# .gitignore
.env
.dodrc.local.json
```

```bash
# Each developer creates .env (not committed)
JIRA_TOKEN=personal-token
GITLAB_TOKEN=personal-token
```

### Example 4: Multiple Environments

**Scenario:** Different configurations for dev, staging, and production.

**Solution:** Use different config files.

```json
// .dodrc.dev.json
{
  "jira": {
    "baseUrl": "https://dev-jira.company.net"
  },
  "gitlab": {
    "baseUrl": "https://dev-gitlab.company.net"
  }
}
```

```json
// .dodrc.prod.json
{
  "jira": {
    "baseUrl": "https://jira.company.net"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.company.net"
  }
}
```

```bash
# Use dev config
dod-gen -t https://dev-jira.company.net/browse/ABC-123 \
        --config .dodrc.dev.json

# Use prod config
dod-gen -t https://jira.company.net/browse/ABC-123 \
        --config .dodrc.prod.json
```

## Best Practices

### Security

1. **Never commit tokens to version control**
   ```bash
   # Add to .gitignore
   .dodrc.json
   .env
   ```

2. **Use environment variables for tokens**
   ```bash
   export JIRA_TOKEN="token"
   export GITLAB_TOKEN="token"
   ```

3. **Use config files for non-sensitive data**
   ```json
   {
     "jira": {
       "baseUrl": "https://company.atlassian.net"
     }
   }
   ```

4. **Rotate tokens regularly**
   - Set expiration dates on tokens
   - Update tokens every 90 days

### Organization

1. **Global config for personal defaults**
   ```bash
   ~/.dodrc.json
   ```

2. **Project config for team settings**
   ```bash
   /project/.dodrc.json
   ```

3. **Environment-specific configs**
   ```bash
   .dodrc.dev.json
   .dodrc.staging.json
   .dodrc.prod.json
   ```

### Performance

1. **Cache tokens in environment variables**
   - Faster than reading from config file
   - Avoids repeated file I/O

2. **Use local config files**
   - Faster than searching parent directories
   - Place `.dodrc.json` in project root

### Maintenance

1. **Document your configuration**
   ```json
   {
     "_comment": "Team configuration for Project X",
     "jira": {
       "baseUrl": "https://projectx.atlassian.net"
     }
   }
   ```

2. **Validate configuration**
   ```bash
   # Test configuration
   dod-gen --help
   ```

3. **Keep configuration DRY**
   - Use global config for common settings
   - Override only what's different in project configs

## Troubleshooting

### Configuration Not Found

**Problem:** Tool can't find configuration file.

**Solution:**
```bash
# Specify config path explicitly
dod-gen --config /path/to/config -t URL

# Or check search paths
ls -la .dodrc.json
ls -la ../.dodrc.json
ls -la ~/.dodrc.json
```

### Token Not Working

**Problem:** Authentication fails despite setting token.

**Solution:**
```bash
# Verify environment variable is set
echo $JIRA_TOKEN
echo $GITLAB_TOKEN

# Check config file
cat .dodrc.json

# Test with explicit token
dod-gen -t URL --jira-token "explicit-token"
```

### Wrong Configuration Used

**Problem:** Tool uses unexpected configuration.

**Solution:**
```bash
# Check precedence
# CLI > Env > Config > Defaults

# Debug by checking each level
echo $JIRA_BASE_URL  # Environment
cat .dodrc.json      # Config file
dod-gen --help       # See defaults
```

### Invalid JSON

**Problem:** Configuration file has syntax errors.

**Solution:**
```bash
# Validate JSON
cat .dodrc.json | jq .

# Or use online validator
# https://jsonlint.com/
```

## Default Values

When no configuration is provided, these defaults are used:

| Setting | Default Value |
|---------|---------------|
| `jira.baseUrl` | (required - no default) |
| `jira.token` | (required - no default) |
| `gitlab.baseUrl` | `https://gitlab.com` |
| `gitlab.token` | (required if using MR) |
| `defaults.ticketType` | Auto-detected from labels |
| `defaults.postComment` | `false` |
