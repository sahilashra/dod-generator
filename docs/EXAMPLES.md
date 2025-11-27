# Usage Examples

This document provides practical examples of using the DoD Generator in various scenarios.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [CLI Examples](#cli-examples)
- [Programmatic Examples](#programmatic-examples)
- [Real-World Scenarios](#real-world-scenarios)
- [Testing Examples](#testing-examples)

## Quick Start Examples

### Example 1: Generate DoD from Jira Ticket

```bash
# Set up your tokens
export JIRA_TOKEN="your-jira-api-token"
export JIRA_BASE_URL="https://company.atlassian.net"

# Generate DoD
dod-gen --ticket-url https://company.atlassian.net/browse/BACKEND-123
```

### Example 2: Include Merge Request Information

```bash
# Set up tokens
export JIRA_TOKEN="your-jira-api-token"
export GITLAB_TOKEN="your-gitlab-pat-token"

# Generate DoD with MR
dod-gen --ticket-url https://company.atlassian.net/browse/BACKEND-123 \
        --mr-url https://gitlab.com/company/project/-/merge_requests/456
```

### Example 3: Post to Jira as Comment

```bash
# Generate and post to Jira
dod-gen --ticket-url https://company.atlassian.net/browse/BACKEND-123 \
        --post-comment
```

## CLI Examples

### Using Fixtures for Testing

```bash
# Test with backend ticket
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Test with frontend ticket
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)"

# Test with infrastructure ticket
dod-gen --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"

# Test with bug ticket
dod-gen --ticket-json "$(cat fixtures/jira-bug-ticket.json)"
```

### Specifying Ticket Type

```bash
# Override automatic type detection
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type backend
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type frontend
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 --type infrastructure
```

### Using Custom Configuration

```bash
# Use config from specific directory
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --config /path/to/config

# Use different configs for different environments
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --config ./config/dev

dod-gen --ticket-url https://jira.example.com/browse/ABC-123 \
        --config ./config/prod
```

### Saving Output to File

```bash
# Save to file
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 > dod-output.md

# Save with error handling
dod-gen --ticket-url https://jira.example.com/browse/ABC-123 2>errors.log > dod-output.md
```

## Programmatic Examples

### Example 1: Basic Usage

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateDoD() {
  const result = await generateDoDFromInput({
    ticket_url: 'https://jira.example.com/browse/BACKEND-123',
    jira_token: process.env.JIRA_TOKEN
  });
  
  console.log(result.dod);
  
  if (result.errors.length > 0) {
    console.error('Warnings:', result.errors);
  }
}

generateDoD();
```

### Example 2: With Error Handling

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateDoDSafely(ticketUrl: string) {
  try {
    const result = await generateDoDFromInput({
      ticket_url: ticketUrl,
      jira_token: process.env.JIRA_TOKEN,
      gitlab_token: process.env.GITLAB_TOKEN
    });
    
    if (result.errors.length > 0) {
      console.warn('Generated with warnings:');
      result.errors.forEach(err => console.warn(`  - ${err}`));
    }
    
    return result.dod;
  } catch (error) {
    console.error('Failed to generate DoD:', error.message);
    throw error;
  }
}
```

### Example 3: Using Fixture Data

```typescript
import { generateDoDFromInput } from 'dod-generator';
import * as fs from 'fs';

async function testWithFixture() {
  const ticketData = JSON.parse(
    fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
  );
  
  const result = await generateDoDFromInput({
    ticket_json: ticketData,
    type: 'backend'
  });
  
  console.log(result.dod);
}

testWithFixture();
```

### Example 4: Batch Processing

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function batchGenerateDoDs(ticketKeys: string[]) {
  const results = await Promise.allSettled(
    ticketKeys.map(key =>
      generateDoDFromInput({
        ticket_url: `https://jira.example.com/browse/${key}`,
        jira_token: process.env.JIRA_TOKEN
      })
    )
  );
  
  results.forEach((result, index) => {
    const key = ticketKeys[index];
    
    if (result.status === 'fulfilled') {
      console.log(`\n=== ${key} ===`);
      console.log(result.value.dod);
      
      // Save to file
      fs.writeFileSync(`dod-${key}.md`, result.value.dod);
    } else {
      console.error(`Failed for ${key}:`, result.reason.message);
    }
  });
}

batchGenerateDoDs(['BACKEND-123', 'FRONTEND-456', 'INFRA-789']);
```

### Example 5: Custom Processing

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
    process.env.JIRA_BASE_URL!,
    process.env.JIRA_TOKEN!
  );
  const ticket = await jiraFetcher.fetchTicket('BACKEND-123');
  
  // Optionally fetch MR
  let mr;
  if (process.env.MR_URL) {
    const gitlabFetcher = new GitLabFetcher(
      process.env.GITLAB_BASE_URL || 'https://gitlab.com',
      process.env.GITLAB_TOKEN!
    );
    mr = await gitlabFetcher.fetchMergeRequest(process.env.MR_URL);
  }
  
  // Generate DoD
  const generator = new DoDGenerator();
  const dod = generator.generateDoD(ticket, mr, 'backend');
  
  // Format output
  const formatter = new MarkdownFormatter();
  const markdown = formatter.formatDoDTable(dod);
  
  // Custom processing
  const enhancedMarkdown = `
<!-- Auto-generated DoD -->
${markdown}

<!-- Additional notes -->
- Generated at: ${new Date().toISOString()}
- Ticket: ${ticket.key}
- Type: ${dod.metadata.ticketType}
  `;
  
  console.log(enhancedMarkdown);
}

customGeneration();
```

## Real-World Scenarios

### Scenario 1: Pre-Commit Hook

Generate DoD before committing code.

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Extract ticket key from branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TICKET=$(echo $BRANCH | grep -oE '[A-Z]+-[0-9]+')

if [ -n "$TICKET" ]; then
  echo "Generating DoD for $TICKET..."
  dod-gen --ticket-url "https://jira.example.com/browse/$TICKET" > DoD.md
  git add DoD.md
fi
```

### Scenario 2: Pull Request Template

Generate DoD when creating a pull request.

```typescript
// scripts/generate-pr-dod.ts
import { generateDoDFromInput } from 'dod-generator';
import { execSync } from 'child_process';

async function generatePRDoD() {
  // Get current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
  
  // Extract ticket key
  const match = branch.match(/([A-Z]+-\d+)/);
  if (!match) {
    console.error('No ticket key found in branch name');
    process.exit(1);
  }
  
  const ticketKey = match[1];
  const ticketUrl = `https://jira.example.com/browse/${ticketKey}`;
  
  // Generate DoD
  const result = await generateDoDFromInput({
    ticket_url: ticketUrl,
    jira_token: process.env.JIRA_TOKEN
  });
  
  // Output for PR description
  console.log('## Definition of Done\n');
  console.log(result.dod);
}

generatePRDoD();
```

### Scenario 3: CI/CD Integration

Automatically generate and post DoD in CI pipeline.

```yaml
# .gitlab-ci.yml
generate-dod:
  stage: prepare
  script:
    - npm install -g dod-generator
    - |
      # Extract ticket key from MR title or branch
      TICKET=$(echo $CI_MERGE_REQUEST_TITLE | grep -oE '[A-Z]+-[0-9]+')
      
      # Generate and post DoD
      dod-gen \
        --ticket-url "https://jira.example.com/browse/$TICKET" \
        --mr-url "$CI_MERGE_REQUEST_URL" \
        --post-comment
  variables:
    JIRA_TOKEN: $JIRA_API_TOKEN
    GITLAB_TOKEN: $GITLAB_PAT_TOKEN
  only:
    - merge_requests
```

### Scenario 4: Slack Integration

Post DoD to Slack channel.

```typescript
import { generateDoDFromInput } from 'dod-generator';
import { WebClient } from '@slack/web-api';

async function postDoDToSlack(ticketUrl: string, channel: string) {
  // Generate DoD
  const result = await generateDoDFromInput({
    ticket_url: ticketUrl,
    jira_token: process.env.JIRA_TOKEN
  });
  
  // Post to Slack
  const slack = new WebClient(process.env.SLACK_TOKEN);
  await slack.chat.postMessage({
    channel: channel,
    text: 'New DoD Generated',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Definition of Done*\n\n${result.dod}`
        }
      }
    ]
  });
}

postDoDToSlack(
  'https://jira.example.com/browse/BACKEND-123',
  '#engineering'
);
```

### Scenario 5: Automated Testing

Generate DoD as part of test suite.

```typescript
import { generateDoDFromInput } from 'dod-generator';
import * as fs from 'fs';

describe('DoD Generation', () => {
  it('should generate valid DoD for backend tickets', async () => {
    const ticketData = JSON.parse(
      fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
    );
    
    const result = await generateDoDFromInput({
      ticket_json: ticketData,
      type: 'backend'
    });
    
    expect(result.dod).toContain('# Definition of Done');
    expect(result.dod).toContain('## Acceptance Criteria');
    expect(result.dod).toContain('## API Contract Changes');
    expect(result.errors).toHaveLength(0);
  });
  
  it('should include CI status when MR is provided', async () => {
    const ticketData = JSON.parse(
      fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
    );
    
    const result = await generateDoDFromInput({
      ticket_json: ticketData,
      mr_url: 'https://gitlab.com/project/repo/-/merge_requests/123',
      gitlab_token: process.env.GITLAB_TOKEN
    });
    
    expect(result.dod).toContain('## CI Status');
  });
});
```

## Testing Examples

### Testing with Different Ticket Types

```bash
# Backend ticket
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)" > test-backend.md

# Frontend ticket
dod-gen --ticket-json "$(cat fixtures/jira-frontend-ticket.json)" > test-frontend.md

# Infrastructure ticket
dod-gen --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)" > test-infra.md

# Compare outputs
diff test-backend.md test-frontend.md
```

### Testing with Different CI Statuses

```typescript
import { generateDoDFromInput } from 'dod-generator';
import * as fs from 'fs';

async function testCIStatuses() {
  const ticket = JSON.parse(
    fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
  );
  
  const statuses = ['passed', 'failed', 'running'];
  
  for (const status of statuses) {
    const mrData = {
      title: 'Test MR',
      ciStatus: status,
      changedFiles: ['file.ts'],
      webUrl: 'https://gitlab.com/project/repo/-/merge_requests/123'
    };
    
    // Mock the GitLab fetcher to return our test data
    // (In real tests, you'd use proper mocking)
    
    console.log(`\n=== Testing CI Status: ${status} ===`);
    // Generate DoD and verify CI status indicator
  }
}

testCIStatuses();
```

### Testing Error Handling

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function testErrorHandling() {
  // Test invalid input
  try {
    await generateDoDFromInput({});
  } catch (error) {
    console.log('✓ Caught invalid input error:', error.message);
  }
  
  // Test missing token
  try {
    await generateDoDFromInput({
      ticket_url: 'https://jira.example.com/browse/ABC-123'
      // No token provided
    });
  } catch (error) {
    console.log('✓ Caught missing token error:', error.message);
  }
  
  // Test invalid URL
  try {
    await generateDoDFromInput({
      ticket_url: 'invalid-url',
      jira_token: 'token'
    });
  } catch (error) {
    console.log('✓ Caught invalid URL error:', error.message);
  }
}

testErrorHandling();
```

### Performance Testing

```typescript
import { generateDoDFromInput } from 'dod-generator';
import * as fs from 'fs';

async function performanceTest() {
  const ticket = JSON.parse(
    fs.readFileSync('fixtures/jira-backend-ticket.json', 'utf-8')
  );
  
  const iterations = 100;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await generateDoDFromInput({
      ticket_json: ticket,
      type: 'backend'
    });
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / iterations;
  
  console.log(`Average generation time: ${avgTime.toFixed(2)}ms`);
}

performanceTest();
```

## Tips and Tricks

### Tip 1: Use Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dod='dod-gen --ticket-url'
alias dod-post='dod-gen --ticket-url --post-comment'

# Usage
dod https://jira.example.com/browse/ABC-123
dod-post https://jira.example.com/browse/ABC-123
```

### Tip 2: Extract Ticket from Branch

```bash
# Get ticket key from current branch
TICKET=$(git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]+-[0-9]+')
dod-gen --ticket-url "https://jira.example.com/browse/$TICKET"
```

### Tip 3: Combine with jq for JSON Processing

```bash
# Extract specific fields from fixture
cat fixtures/jira-backend-ticket.json | jq '.acceptanceCriteria'

# Modify fixture on the fly
cat fixtures/jira-backend-ticket.json | \
  jq '.labels += ["new-label"]' | \
  dod-gen --ticket-json "$(cat)"
```

### Tip 4: Use with Watch for Development

```bash
# Regenerate DoD when fixture changes
npm install -g nodemon

nodemon --watch fixtures/jira-backend-ticket.json \
        --exec "dod-gen --ticket-json \"\$(cat fixtures/jira-backend-ticket.json)\" > output.md"
```

### Tip 5: Create Custom Templates

```typescript
import { generateDoDFromInput } from 'dod-generator';

async function generateWithTemplate(ticketUrl: string, template: string) {
  const result = await generateDoDFromInput({
    ticket_url: ticketUrl,
    jira_token: process.env.JIRA_TOKEN
  });
  
  // Apply custom template
  const output = template
    .replace('{{dod}}', result.dod)
    .replace('{{date}}', new Date().toISOString())
    .replace('{{author}}', process.env.USER || 'Unknown');
  
  return output;
}

const template = `
# Project Documentation

Generated by: {{author}}
Date: {{date}}

{{dod}}
`;

generateWithTemplate('https://jira.example.com/browse/ABC-123', template);
```
