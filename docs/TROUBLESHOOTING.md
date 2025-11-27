# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the DoD Generator.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [API Connection Issues](#api-connection-issues)
- [Configuration Issues](#configuration-issues)
- [Input Validation Issues](#input-validation-issues)
- [Output Issues](#output-issues)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)

## Authentication Issues

### Error: "Invalid Jira token" or 401 Unauthorized

**Symptoms:**
- Error message: "Authentication failed" or "401 Unauthorized"
- Cannot fetch ticket data from Jira

**Possible Causes:**
1. Invalid or expired API token
2. Incorrect Jira base URL
3. Token not properly set in environment or config

**Solutions:**

1. **Verify your token is correct:**
   ```bash
   echo $JIRA_TOKEN
   ```

2. **Test token with curl:**
   ```bash
   curl -H "Authorization: Bearer $JIRA_TOKEN" \
        "https://your-company.atlassian.net/rest/api/3/myself"
   ```

3. **Regenerate token:**
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Delete old token
   - Create new token
   - Update environment variable or config file

4. **Check base URL format:**
   ```bash
   # Correct format
   export JIRA_BASE_URL="https://company.atlassian.net"
   
   # Incorrect (no trailing slash, no /browse)
   export JIRA_BASE_URL="https://company.atlassian.net/"
   ```

### Error: "GitLab authentication failed" or 401

**Symptoms:**
- Cannot fetch merge request data
- Error mentions GitLab authentication

**Solutions:**

1. **Verify GitLab token:**
   ```bash
   echo $GITLAB_TOKEN
   ```

2. **Test token with curl:**
   ```bash
   curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        "https://gitlab.com/api/v4/user"
   ```

3. **Check token scopes:**
   - Token must have `read_api` scope
   - Regenerate token with correct scopes if needed

4. **Verify base URL:**
   ```bash
   # For gitlab.com
   export GITLAB_BASE_URL="https://gitlab.com"
   
   # For self-hosted
   export GITLAB_BASE_URL="https://gitlab.your-company.com"
   ```

## API Connection Issues

### Error: "Network request failed" or "ECONNREFUSED"

**Symptoms:**
- Cannot connect to Jira or GitLab
- Timeout errors
- Connection refused

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping jira.example.com
   ping gitlab.com
   ```

2. **Verify URLs are accessible:**
   ```bash
   curl -I https://your-company.atlassian.net
   curl -I https://gitlab.com
   ```

3. **Check firewall/proxy settings:**
   ```bash
   # Set proxy if needed
   export HTTP_PROXY="http://proxy.company.com:8080"
   export HTTPS_PROXY="http://proxy.company.com:8080"
   ```

4. **Verify VPN connection:**
   - Some companies require VPN to access Jira/GitLab
   - Connect to VPN and try again

### Error: "404 Not Found"

**Symptoms:**
- Ticket or MR not found
- Error message mentions 404

**Solutions:**

1. **Verify ticket exists:**
   - Open ticket URL in browser
   - Check ticket key is correct (e.g., "BACKEND-123")

2. **Check permissions:**
   - Ensure you have access to the ticket/project
   - Verify token has correct permissions

3. **Verify URL format:**
   ```bash
   # Correct Jira URL
   https://company.atlassian.net/browse/BACKEND-123
   
   # Correct GitLab MR URL
   https://gitlab.com/namespace/project/-/merge_requests/123
   ```

### Error: "429 Too Many Requests" or Rate Limit

**Symptoms:**
- Error mentions rate limiting
- Requests fail after working previously

**Solutions:**

1. **Wait and retry:**
   - Jira: Wait 1-5 minutes
   - GitLab: Wait based on rate limit headers

2. **Reduce request frequency:**
   ```typescript
   // Add delay between requests
   async function generateWithDelay(tickets: string[]) {
     for (const ticket of tickets) {
       await generateDoDFromInput({ ticket_url: ticket });
       await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
     }
   }
   ```

3. **Check rate limits:**
   ```bash
   # Jira rate limits vary by plan
   # GitLab: 300 requests per minute for authenticated users
   ```

## Configuration Issues

### Error: "Configuration file not found"

**Symptoms:**
- Tool can't find `.dodrc.json`
- Using default configuration

**Solutions:**

1. **Check file location:**
   ```bash
   ls -la .dodrc.json
   ls -la ../.dodrc.json
   ls -la ~/.dodrc.json
   ```

2. **Specify config path explicitly:**
   ```bash
   dod-gen --config /path/to/config --ticket-url URL
   ```

3. **Create config file:**
   ```bash
   cat > .dodrc.json << EOF
   {
     "jira": {
       "baseUrl": "https://company.atlassian.net"
     }
   }
   EOF
   ```

### Error: "Invalid JSON in configuration file"

**Symptoms:**
- Error parsing `.dodrc.json`
- Syntax error messages

**Solutions:**

1. **Validate JSON:**
   ```bash
   cat .dodrc.json | jq .
   ```

2. **Check for common issues:**
   - Missing commas
   - Trailing commas
   - Unquoted strings
   - Incorrect brackets

3. **Use example as template:**
   ```bash
   cp .dodrc.json.example .dodrc.json
   # Edit with your values
   ```

### Configuration Not Taking Effect

**Symptoms:**
- Changes to config file don't work
- Wrong values being used

**Solutions:**

1. **Check precedence:**
   ```
   CLI args > Environment variables > Config file > Defaults
   ```

2. **Clear environment variables:**
   ```bash
   unset JIRA_BASE_URL
   unset JIRA_TOKEN
   unset GITLAB_BASE_URL
   unset GITLAB_TOKEN
   ```

3. **Verify config is being loaded:**
   ```bash
   # Add debug output
   DEBUG=dod-gen:* dod-gen --ticket-url URL
   ```

## Input Validation Issues

### Error: "Invalid input format"

**Symptoms:**
- Error about missing required fields
- Input validation fails

**Solutions:**

1. **Provide either ticket_url or ticket_json:**
   ```bash
   # Valid
   dod-gen --ticket-url URL
   dod-gen --ticket-json '{"key":"ABC-123",...}'
   
   # Invalid (neither provided)
   dod-gen --mr-url URL
   ```

2. **Check ticket JSON structure:**
   ```typescript
   // Required fields
   {
     "key": "ABC-123",
     "summary": "Title",
     "description": "Description",
     "labels": ["backend"],
     "issueType": "Story",
     "linkedIssues": []
   }
   ```

3. **Validate with type guard:**
   ```typescript
   import { isJiraTicket } from 'dod-generator';
   
   const data = JSON.parse(jsonString);
   if (!isJiraTicket(data)) {
     console.error('Invalid ticket structure');
   }
   ```

### Error: "Invalid ticket type"

**Symptoms:**
- Error about invalid type parameter
- Type not recognized

**Solutions:**

1. **Use valid type:**
   ```bash
   # Valid types
   --type backend
   --type frontend
   --type infrastructure
   
   # Invalid
   --type api  # Use 'backend' instead
   ```

2. **Let tool auto-detect:**
   ```bash
   # Omit --type to use automatic detection
   dod-gen --ticket-url URL
   ```

### Error: "Malformed URL"

**Symptoms:**
- Error parsing ticket or MR URL
- Invalid URL format

**Solutions:**

1. **Check URL format:**
   ```bash
   # Jira - must include /browse/
   https://company.atlassian.net/browse/BACKEND-123
   
   # GitLab - must include /-/merge_requests/
   https://gitlab.com/namespace/project/-/merge_requests/123
   ```

2. **URL encode special characters:**
   ```bash
   # If project name has spaces or special chars
   https://gitlab.com/my%20project/repo/-/merge_requests/123
   ```

## Output Issues

### Issue: DoD Missing Expected Sections

**Symptoms:**
- Generated DoD doesn't include expected sections
- Missing type-specific sections

**Solutions:**

1. **Verify ticket type:**
   ```bash
   # Check what type was detected
   dod-gen --ticket-url URL | grep "Type:"
   ```

2. **Explicitly set type:**
   ```bash
   dod-gen --ticket-url URL --type backend
   ```

3. **Check ticket labels:**
   - Add appropriate labels to Jira ticket
   - Labels: "backend", "frontend", "infrastructure"

### Issue: Acceptance Criteria Not Parsed

**Symptoms:**
- Acceptance criteria section is empty or has placeholder
- Criteria exist in ticket but not in DoD

**Solutions:**

1. **Check description format:**
   ```
   Acceptance Criteria:
   1. First criterion
   2. Second criterion
   
   OR
   
   AC:
   - First criterion
   - Second criterion
   ```

2. **Use acceptanceCriteria field:**
   ```json
   {
     "key": "ABC-123",
     "description": "...",
     "acceptanceCriteria": [
       "First criterion",
       "Second criterion"
     ]
   }
   ```

### Issue: CI Status Not Showing

**Symptoms:**
- CI status section missing
- MR provided but no CI info

**Solutions:**

1. **Verify MR URL is provided:**
   ```bash
   dod-gen --ticket-url URL --mr-url MR_URL
   ```

2. **Check GitLab token:**
   ```bash
   echo $GITLAB_TOKEN
   ```

3. **Verify MR has pipeline:**
   - Open MR in browser
   - Check if pipeline exists

### Issue: Markdown Formatting Issues

**Symptoms:**
- Output has broken formatting
- Tables not rendering correctly

**Solutions:**

1. **Check Markdown viewer:**
   - Use proper Markdown viewer
   - GitHub, GitLab, VS Code all render differently

2. **Validate Markdown:**
   ```bash
   # Use markdownlint
   npm install -g markdownlint-cli
   dod-gen --ticket-url URL > output.md
   markdownlint output.md
   ```

## Performance Issues

### Issue: Slow Generation

**Symptoms:**
- DoD generation takes a long time
- Timeouts

**Solutions:**

1. **Check network latency:**
   ```bash
   time curl -I https://company.atlassian.net
   ```

2. **Use ticket JSON instead of URL:**
   ```bash
   # Faster (no API call)
   dod-gen --ticket-json "$(cat ticket.json)"
   
   # Slower (API call)
   dod-gen --ticket-url URL
   ```

3. **Reduce concurrent requests:**
   ```typescript
   // Instead of Promise.all
   for (const ticket of tickets) {
     await generateDoDFromInput({ ticket_url: ticket });
   }
   ```

### Issue: High Memory Usage

**Symptoms:**
- Process uses excessive memory
- Out of memory errors

**Solutions:**

1. **Process tickets in batches:**
   ```typescript
   async function processBatch(tickets: string[], batchSize: number) {
     for (let i = 0; i < tickets.length; i += batchSize) {
       const batch = tickets.slice(i, i + batchSize);
       await Promise.all(batch.map(generateDoD));
     }
   }
   ```

2. **Clear results after processing:**
   ```typescript
   for (const ticket of tickets) {
     const result = await generateDoDFromInput({ ticket_url: ticket });
     fs.writeFileSync(`${ticket}.md`, result.dod);
     // Result is garbage collected
   }
   ```

## Common Error Messages

### "Either ticket_url or ticket_json must be provided"

**Cause:** No ticket data provided

**Solution:**
```bash
dod-gen --ticket-url https://jira.example.com/browse/ABC-123
# OR
dod-gen --ticket-json '{"key":"ABC-123",...}'
```

### "Jira token is required when fetching from URL"

**Cause:** Missing Jira authentication token

**Solution:**
```bash
export JIRA_TOKEN="your-token"
# OR
dod-gen --ticket-url URL --jira-token "your-token"
```

### "GitLab token is required when fetching MR"

**Cause:** Missing GitLab authentication token

**Solution:**
```bash
export GITLAB_TOKEN="your-token"
# OR
dod-gen --ticket-url URL --mr-url MR_URL --gitlab-token "your-token"
```

### "Failed to parse acceptance criteria"

**Cause:** Acceptance criteria in unexpected format

**Solution:**
- Add acceptance criteria to `acceptanceCriteria` field
- Format description with clear "Acceptance Criteria:" header

### "Comment posting failed but DoD was generated"

**Cause:** Jira comment API call failed

**Solution:**
- Check Jira token permissions
- Verify ticket allows comments
- DoD is still available in output

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   ```bash
   DEBUG=dod-gen:* dod-gen --ticket-url URL 2> debug.log
   ```

2. **Verify installation:**
   ```bash
   npm list dod-generator
   dod-gen --version
   ```

3. **Test with fixtures:**
   ```bash
   dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
   ```

4. **Check GitHub issues:**
   - Search existing issues
   - Create new issue with:
     - Error message
     - Steps to reproduce
     - Environment (OS, Node version)
     - Debug logs (remove sensitive data)

5. **Contact support:**
   - Email: support@example.com
   - Include debug logs and error messages
   - Remove any sensitive information (tokens, URLs)

## Debug Checklist

When troubleshooting, check:

- [ ] API tokens are set and valid
- [ ] Base URLs are correct
- [ ] Internet connection is working
- [ ] Ticket/MR exists and is accessible
- [ ] Configuration file is valid JSON
- [ ] Environment variables are set correctly
- [ ] Using correct URL formats
- [ ] Have necessary permissions
- [ ] Not hitting rate limits
- [ ] Using latest version of tool

## Useful Commands

```bash
# Check environment
env | grep -E '(JIRA|GITLAB)'

# Test Jira connection
curl -H "Authorization: Bearer $JIRA_TOKEN" \
     "$JIRA_BASE_URL/rest/api/3/myself"

# Test GitLab connection
curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
     "$GITLAB_BASE_URL/api/v4/user"

# Validate config file
cat .dodrc.json | jq .

# Test with fixture
dod-gen --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Debug mode
DEBUG=* dod-gen --ticket-url URL

# Check version
dod-gen --version
npm list dod-generator
```
