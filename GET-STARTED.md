# 🎯 Get Started - DoD Generator

## ✅ Setup Complete!

Your DoD Generator is configured with:
- ✅ Jira credentials loaded from `.env`
- ✅ GitLab credentials loaded from `.env`
- ✅ Project built and ready to use
- ✅ All 284 tests passing

## 🚀 Try It Now!

### Option 1: Test with Fixtures (Easiest - No API calls)

**Windows PowerShell:**
```powershell
$json = Get-Content fixtures/jira-backend-ticket.json -Raw
node dist/cli/index.js --ticket-json $json
```

**Mac/Linux:**
```bash
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```

### Option 2: Use Your Real Jira Ticket

```bash
# Replace TICKET-KEY with your actual ticket
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY
```

### Option 3: Full Integration (Jira + GitLab)

```bash
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1
```

## 📖 What You Get

The tool generates a comprehensive DoD checklist with:

✅ **Acceptance Criteria** - Automatically extracted from your ticket
✅ **Testing Requirements** - Unit, integration, and E2E tests
✅ **Manual Test Steps** - Template for manual testing
✅ **Documentation Checklist** - What docs need updating
✅ **Code Review Items** - Reviewer checklist
✅ **Type-Specific Sections** - Backend/Frontend/Infrastructure specific items
✅ **CI Status** - Pipeline status from GitLab (if MR provided)

## 🎨 Example Output

```markdown
# Definition of Done: BACKEND-123

**Ticket Type:** backend
**Generated:** 1/15/2024, 10:30:00 AM

## Acceptance Criteria
- [ ] The endpoint should accept username and password
- [ ] The endpoint should return a JWT token
- [ ] The endpoint should validate credentials

## CI Status
✓ Pipeline passed

## Automated Tests
- [ ] Unit tests for authentication logic
- [ ] Integration tests for API endpoint
- [ ] API contract tests

## API Contract Changes
- [ ] API documentation updated
- [ ] Breaking changes documented

...
```

## 💡 Common Commands

```bash
# Generate and save to file
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY > dod.md

# Post as Jira comment
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY --post-comment

# Override ticket type
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/TICKET-KEY --type frontend

# Test all fixtures
.\test-dod.ps1  # Windows
./test-dod.sh   # Mac/Linux
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Your specific setup with credentials
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[README.md](README.md)** - Full documentation
- **[fixtures/](fixtures/)** - Example tickets and MRs

## 🆘 Need Help?

**Issue: "Invalid Jira token"**
- Check your `.env` file
- Verify token at: https://id.atlassian.com/manage-profile/security/api-tokens

**Issue: "GitLab API error"**
- Verify your GitLab token has `read_api` scope
- Check the MR URL is correct

**Issue: "Cannot find module"**
```bash
npm install
npm run build
```

## 🎉 You're Ready!

Start by testing with fixtures, then try with your real tickets. Enjoy automated DoD generation! 🚀

---

**Quick Test Command:**
```powershell
# Windows PowerShell
$json = Get-Content fixtures/jira-backend-ticket.json -Raw; node dist/cli/index.js --ticket-json $json
```

```bash
# Mac/Linux
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"
```
