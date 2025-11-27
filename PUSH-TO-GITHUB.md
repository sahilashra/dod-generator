# 🚀 Push to GitHub - Step by Step Guide

## Option 1: Automated Script (Easiest!)

Run this PowerShell script that does most of the work for you:

```powershell
.\setup-and-push.ps1
```

This script will:
1. ✅ Initialize Git repository
2. ✅ Configure Git user
3. ✅ Add all files
4. ✅ Verify .kiro directory is included
5. ✅ Create commit
6. ✅ Guide you through pushing to GitHub

---

## Option 2: Manual Steps

### Step 1: Create GitHub Repository

1. Go to: https://github.com/sahilashra
2. Click "New repository" (green button)
3. Fill in:
   - **Repository name:** `dod-generator`
   - **Description:** `Automated Definition-of-Done Generator for Jira tickets and GitLab merge requests. Built with Kiro AI for the AI for Bharat competition.`
   - **Visibility:** PUBLIC ✅ (IMPORTANT!)
   - **Don't check** "Initialize with README"
4. Click "Create repository"

### Step 2: Initialize Git Locally

Open PowerShell in your project directory and run:

```powershell
# Initialize Git
git init

# Configure your identity (if not already done)
git config user.name "Muhammed Sahil"
git config user.email "your-email@example.com"

# Add all files
git add .

# Verify .kiro directory is included
git ls-files .kiro

# Create commit
git commit -m "Initial commit: DoD Generator built with Kiro AI for AI for Bharat competition"
```

### Step 3: Connect to GitHub

Choose one method:

**Method A: HTTPS (Easier for first time)**
```powershell
git remote add origin https://github.com/sahilashra/dod-generator.git
git branch -M main
git push -u origin main
```

You'll be prompted for:
- Username: `sahilashra`
- Password: Use a **Personal Access Token** (not your GitHub password)

**Method B: SSH (If you set up SSH key)**
```powershell
git remote add origin git@github.com:sahilashra/dod-generator.git
git branch -M main
git push -u origin main
```

### Step 4: Verify on GitHub

1. Go to: https://github.com/sahilashra/dod-generator
2. Check that all files are there
3. **IMPORTANT:** Verify `.kiro` directory is visible
4. Click into `.kiro/specs/generate-dod/`
5. Verify these files exist:
   - requirements.md
   - design.md
   - tasks.md

---

## 🔑 Getting GitHub Personal Access Token (for HTTPS)

If you don't have a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "DoD Generator Upload"
4. Select scopes:
   - ✅ `repo` (all repo permissions)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

---

## 🐛 Troubleshooting

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Generate a new token at: https://github.com/settings/tokens

### "Repository not found"
- Make sure you created the repository on GitHub first
- Check the repository name is exactly `dod-generator`
- Verify the URL: `https://github.com/sahilashra/dod-generator`

### ".kiro directory not showing"
- Check `.gitignore` doesn't include `.kiro` (it shouldn't)
- Run: `git ls-files .kiro` to verify files are tracked
- If not tracked, run: `git add .kiro -f` then commit and push again

### "Permission denied (SSH)"
- Make sure you set up SSH key (see SSH-SETUP.md)
- Add your SSH key to GitHub: https://github.com/settings/keys
- Or use HTTPS method instead

---

## ✅ Verification Checklist

After pushing, verify:

- [ ] Repository is public
- [ ] All files are visible
- [ ] `.kiro` directory is visible
- [ ] `.kiro/specs/generate-dod/requirements.md` exists
- [ ] `.kiro/specs/generate-dod/design.md` exists
- [ ] `.kiro/specs/generate-dod/tasks.md` exists
- [ ] README.md displays correctly
- [ ] No sensitive data (tokens, passwords) visible

---

## 🎯 Quick Commands Reference

### Initialize and Commit
```powershell
git init
git add .
git commit -m "Initial commit: DoD Generator built with Kiro AI"
```

### Add Remote (HTTPS)
```powershell
git remote add origin https://github.com/sahilashra/dod-generator.git
git branch -M main
git push -u origin main
```

### Add Remote (SSH)
```powershell
git remote add origin git@github.com:sahilashra/dod-generator.git
git branch -M main
git push -u origin main
```

### Verify .kiro Directory
```powershell
git ls-files .kiro
```

### Check Status
```powershell
git status
```

### View Commit History
```powershell
git log --oneline
```

---

## 📝 After Pushing

Once your code is on GitHub:

1. ✅ Verify repository: https://github.com/sahilashra/dod-generator
2. ✅ Check .kiro directory is visible
3. ✅ Take screenshots for blog post
4. ✅ Write blog post (use BLOG-POST-TEMPLATE.md)
5. ✅ Submit to competition dashboard

---

## 🆘 Still Having Issues?

Run the automated script:
```powershell
.\setup-and-push.ps1
```

Or contact me for help!

---

**Your GitHub Profile:** https://github.com/sahilashra
**Target Repository:** https://github.com/sahilashra/dod-generator
**Competition:** AI for Bharat 2025

Good luck! 🏆
