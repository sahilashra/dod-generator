# 🛠️ Setup Guide for DoD Generator

Complete setup instructions for your DoD Generator with your credentials.

## ✅ Your Configuration

Your `.env` file has been created with the following configuration:

```
JIRA_BASE_URL=https://muhammed-sahil.atlassian.net
JIRA_TOKEN=ATATT3xFfGF0bAqnLBGx4CpVjPg5s855-YMtYBGWJOOOI8ch4UQmTa-qFK4PuBvdiPBwVZAFAzQMWYs8Rjfc4gdBCn_dwpQlLgYWT4L4tuisuUNAASqlmQOQ0mZ4nt2O6jb8fMeGZQJrEUh91BSsr979QOMhIznLmqeBqAU1BsI5Ud1UP3JgREk=C5E2E957
GITLAB_BASE_URL=https://gitlab.com
GITLAB_TOKEN=glpat-w-cXZrz_RK33axDX5Hy7A286MQp1Oml6eXpvCw
```

**GitLab Project:** https://gitlab.com/sahilashraf/DOD-Gen

## 🚀 Quick Commands

### Test with Fixtures (No API calls)

**PowerShell:**
```powershell
# Single test
$json = Get-Content fixtures/jira-backend-ticket.json -Raw
node dist/cli/index.js --ticket-json $json

# Or run the test script
.\test-dod.ps1
```

**Bash/Linux/Mac:**
```bash
# Single test
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Or run the test script
./test-dod.sh
```

### Generate DoD from Your Jira Tickets

```bash
# Replace TICKET-KEY with your actual ticket key
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY

# Save to file
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY > dod.md

# Post as comment to Jira
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY --post-comment
```

### With GitLab Merge Request

```bash
# Replace with your actual ticket and MR
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1
```

## 📝 Example Workflow

1. **Create a Jira ticket** in your project
2. **Create a merge request** in GitLab
3. **Generate the DoD:**
   ```bash
   node dist/cli/index.js \
     --ticket-url https://muhammed-sahil.atlassian.net/browse/YOUR-TICKET \
     --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/YOUR-MR \
     --post-comment
   ```
4. **Check your Jira ticket** - the DoD will be posted as a comment!

## 🔧 Advanced Usage

### Override Ticket Type

```bash
# Force frontend type
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY \
  --type frontend

# Force infrastructure type
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY \
  --type infrastructure
```

### Use Configuration File

Create `.dodrc.json` for default settings:

```json
{
  "jira": {
    "baseUrl": "https://muhammed-sahil.atlassian.net",
    "token": "your-token-here"
  },
  "gitlab": {
    "baseUrl": "https://gitlab.com",
    "token": "your-token-here"
  },
  "defaults": {
    "ticketType": "backend",
    "postComment": false
  }
}
```

Then you can use shorter commands:
```bash
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY
```

## 🎯 Testing Your Setup

### 1. Test with Fixtures (No API needed)

```bash
# This should work immediately
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```

### 2. Test Jira Connection

```bash
# Replace with a real ticket from your Jira
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY
```

### 3. Test GitLab Connection

```bash
# Replace with a real MR from your GitLab
node dist/cli/index.js \
  --ticket-json "$(cat fixtures/jira-backend-ticket.json)" \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1
```

### 4. Test Full Integration

```bash
# Use real ticket and MR
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1
```

## 🐛 Troubleshooting

### "Invalid Jira token" or 401 Error

1. Check your `.env` file has the correct token
2. Verify the token hasn't expired
3. Test the token manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://muhammed-sahil.atlassian.net/rest/api/3/myself
   ```

### "GitLab API error" or 404

1. Verify the merge request URL is correct
2. Check your GitLab token has `read_api` scope
3. Ensure you have access to the repository

### "Cannot find module 'dotenv'"

```bash
npm install
npm run build
```

### JSON Parsing Error

If using PowerShell, make sure to load the JSON into a variable first:
```powershell
$json = Get-Content fixtures/jira-backend-ticket.json -Raw
node dist/cli/index.js --ticket-json $json
```

## 📚 Next Steps

- Read [QUICKSTART.md](QUICKSTART.md) for more examples
- Check [README.md](README.md) for full documentation
- Explore [fixtures/](fixtures/) for example data
- Run `npm test` to verify everything works

## 🎉 You're All Set!

Your DoD Generator is configured and ready to use. Start by testing with fixtures, then try with your real Jira tickets!

**Happy DoD generating!** 🚀
