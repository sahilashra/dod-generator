# 🧪 End-to-End Test Guide

Complete guide to test your DoD Generator with a real Jira ticket and GitLab MR.

## 📋 Step 1: Create a Test Jira Ticket

### 1.1 Go to Your Jira Board
Visit: https://muhammed-sahil.atlassian.net

### 1.2 Create a New Ticket

Click "Create" and fill in:

**Project:** Your project (e.g., DOD)

**Issue Type:** Story

**Summary:** 
```
Implement user authentication API endpoint
```

**Description:**
```
Create a REST API endpoint for user authentication that validates credentials and returns JWT tokens.

## Acceptance Criteria

1. The endpoint should accept username and password via POST request
2. The endpoint should validate credentials against the user database
3. The endpoint should return a JWT token on successful authentication
4. The endpoint should return appropriate error messages for invalid credentials
5. The endpoint should implement rate limiting to prevent brute force attacks

## Technical Details

- Endpoint: POST /api/auth/login
- Request body: { "username": "string", "password": "string" }
- Response: { "token": "jwt-token", "expiresIn": 3600 }
- Use bcrypt for password hashing
- Implement JWT with 1-hour expiration
```

**Labels:** Add these labels:
- `backend`
- `api`
- `security`

**Priority:** Medium

Click **Create**

### 1.3 Note Your Ticket Key
After creation, note the ticket key (e.g., `DOD-1`, `TEST-1`, etc.)

---

## 🔀 Step 2: Create a Test GitLab Merge Request

### 2.1 Make Some Changes to Your Project

```bash
# Navigate to your project
cd C:\Sahil\Projects\DoDGen

# Create a new branch
git checkout -b feature/test-dod-generator

# Make a small change (add a comment to README)
echo "" >> README.md
echo "<!-- Test change for DoD Generator -->" >> README.md

# Commit the change
git add README.md
git commit -m "Test: Add comment for DoD generator testing"

# Push to GitLab
git push origin feature/test-dod-generator
```

### 2.2 Create Merge Request on GitLab

1. Go to: https://gitlab.com/sahilashraf/DOD-Gen
2. You should see a banner "Create merge request"
3. Click it, or go to: https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/new
4. Fill in:
   - **Title:** `Test: DoD Generator end-to-end test`
   - **Description:** `Testing the DoD Generator with a real ticket and MR`
   - **Source branch:** `feature/test-dod-generator`
   - **Target branch:** `main` or `master`
5. Click "Create merge request"
6. Note the MR number (e.g., `!1`, `!2`, etc.)

---

## 🚀 Step 3: Generate DoD

Now let's test the DoD Generator with your real ticket and MR!

### 3.1 Test with Ticket Only

```bash
# Replace DOD-1 with your actual ticket key
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1
```

### 3.2 Test with Ticket and MR

```bash
# Replace DOD-1 and 1 with your actual ticket key and MR number
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1 \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1
```

### 3.3 Save DoD to File

```bash
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1 \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1 \
  > test-dod-output.md
```

### 3.4 Post DoD as Jira Comment

```bash
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1 \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1 \
  --post-comment
```

Then check your Jira ticket - the DoD should appear as a comment!

---

## ✅ Expected Output

You should see something like:

```markdown
# Definition of Done: DOD-1

**Ticket Type:** backend
**Generated:** 1/15/2024, 10:30:00 AM

## Acceptance Criteria
- [ ] The endpoint should accept username and password via POST request
- [ ] The endpoint should validate credentials against the user database
- [ ] The endpoint should return a JWT token on successful authentication
- [ ] The endpoint should return appropriate error messages for invalid credentials
- [ ] The endpoint should implement rate limiting to prevent brute force attacks

## CI Status
✓ Pipeline passed (or current status)

## Automated Tests
- [ ] **Unit Tests:** Test authentication logic with valid/invalid credentials
- [ ] **Integration Tests:** Test full authentication flow with database
- [ ] **API Contract Tests:** Verify request/response format matches specification

## API Contract Changes
- [ ] API documentation updated for new /api/auth/login endpoint
- [ ] Request/response schemas documented
- [ ] Error codes and messages documented
- [ ] Authentication flow documented

## Manual Test Steps
- [ ] Test login with valid credentials
- [ ] Test login with invalid username
- [ ] Test login with invalid password
- [ ] Test rate limiting by making multiple failed attempts
- [ ] Verify JWT token is valid and contains correct claims
- [ ] Test token expiration after 1 hour

## Monitoring and Logging Changes
- [ ] Add logging for authentication attempts (success/failure)
- [ ] Add metrics for authentication success rate
- [ ] Add alerts for unusual authentication patterns
- [ ] Log rate limiting events

## Rollback and Migration Notes
- [ ] Document rollback procedure if authentication fails
- [ ] No database migrations required
- [ ] Ensure backward compatibility with existing sessions

## Documentation Updates
- [ ] Update API documentation
- [ ] Update authentication guide
- [ ] Update security documentation

## Reviewer Checklist
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Error handling is comprehensive
```

---

## 🧪 Verification Checklist

After running the tests, verify:

- [ ] ✅ DoD was generated successfully
- [ ] ✅ All acceptance criteria from Jira ticket are included
- [ ] ✅ Backend-specific sections are present (API Contract, Monitoring, etc.)
- [ ] ✅ CI status from GitLab MR is shown
- [ ] ✅ MR details are included (if MR URL provided)
- [ ] ✅ DoD is properly formatted as Markdown
- [ ] ✅ DoD was posted to Jira (if --post-comment used)

---

## 🐛 Troubleshooting

### "Invalid Jira token" Error

Check your `.env` file:
```bash
cat .env
```

Make sure `JIRA_TOKEN` is correct.

### "GitLab API error" Error

1. Verify the MR URL is correct
2. Check your GitLab token has `read_api` scope
3. Ensure the MR exists and you have access

### "Cannot find ticket" Error

1. Verify the ticket key is correct (e.g., `DOD-1`)
2. Check the ticket exists in your Jira
3. Ensure your Jira token has access to the project

### DoD Not Posted to Jira

1. Make sure you used `--post-comment` flag
2. Verify your Jira token has permission to add comments
3. Check the Jira ticket for the comment

---

## 📊 Test Different Scenarios

### Test 1: Backend Ticket
```bash
# Create a ticket with labels: backend, api
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/YOUR-TICKET
```

Expected: Should include API Contract Changes, Monitoring sections

### Test 2: Frontend Ticket
```bash
# Create a ticket with labels: frontend, ui
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/YOUR-TICKET
```

Expected: Should include UI/UX Validation, Accessibility sections

### Test 3: Infrastructure Ticket
```bash
# Create a ticket with labels: infrastructure, devops
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/YOUR-TICKET
```

Expected: Should include Deployment Procedures, Infrastructure Validation sections

### Test 4: With Different CI Statuses

Create MRs with different pipeline states:
- ✓ Passed
- ✗ Failed
- ⟳ Running

And verify the DoD shows the correct status.

---

## 🎯 Success Criteria

Your DoD Generator is working correctly if:

1. ✅ It fetches ticket data from Jira successfully
2. ✅ It fetches MR data from GitLab successfully
3. ✅ It generates a properly formatted DoD
4. ✅ It includes all acceptance criteria from the ticket
5. ✅ It includes type-specific sections based on labels
6. ✅ It shows CI status from the MR
7. ✅ It can post the DoD back to Jira as a comment

---

## 📝 Quick Test Commands

```bash
# Test with fixture (no API calls)
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

# Test with real Jira ticket
node dist/cli/index.js --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1

# Test with Jira + GitLab
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1 \
  --mr-url https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/1

# Test and post to Jira
node dist/cli/index.js \
  --ticket-url https://muhammed-sahil.atlassian.net/browse/DOD-1 \
  --post-comment
```

---

## 🎉 Congratulations!

If all tests pass, your DoD Generator is fully functional and ready for production use!

**Next Steps:**
- Use it for your real development workflow
- Share it with your team
- Customize the templates for your needs
- Add more ticket types or sections as needed

Happy DoD generating! 🚀
