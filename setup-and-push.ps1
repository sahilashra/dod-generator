# Setup and Push Script for Competition Submission
# This script will help you push your DoD Generator to GitHub

Write-Host "🚀 DoD Generator - GitHub Setup Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if git is installed
Write-Host "Step 1: Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first:" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Initialize Git repository
Write-Host "Step 2: Initializing Git repository..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to initialize Git repository" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Configure Git user (if not already configured)
Write-Host "Step 3: Configuring Git user..." -ForegroundColor Yellow
$gitUserName = git config user.name
$gitUserEmail = git config user.email

if ([string]::IsNullOrEmpty($gitUserName)) {
    Write-Host "⚠️  Git user name not configured" -ForegroundColor Yellow
    $userName = Read-Host "Enter your name (e.g., Muhammed Sahil)"
    git config user.name "$userName"
    Write-Host "✅ Git user name set to: $userName" -ForegroundColor Green
} else {
    Write-Host "✅ Git user name: $gitUserName" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($gitUserEmail)) {
    Write-Host "⚠️  Git user email not configured" -ForegroundColor Yellow
    $userEmail = Read-Host "Enter your email"
    git config user.email "$userEmail"
    Write-Host "✅ Git user email set to: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✅ Git user email: $gitUserEmail" -ForegroundColor Green
}

Write-Host ""

# Step 4: Add all files
Write-Host "Step 4: Adding files to Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All files added to Git" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add files" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Show what will be committed
Write-Host "Step 5: Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 6: Verify .kiro directory is included
Write-Host "Step 6: Verifying .kiro directory..." -ForegroundColor Yellow
if (Test-Path ".kiro") {
    Write-Host "✅ .kiro directory exists" -ForegroundColor Green
    $kiroFiles = git ls-files .kiro
    if ($kiroFiles) {
        Write-Host "✅ .kiro directory will be committed" -ForegroundColor Green
        Write-Host "   Files in .kiro:" -ForegroundColor Cyan
        $kiroFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  .kiro directory exists but no files staged" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .kiro directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 7: Commit
Write-Host "Step 7: Creating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: DoD Generator built with Kiro AI for AI for Bharat competition

- Automated Definition-of-Done generator for Jira tickets
- GitLab merge request integration
- Type-specific templates (backend/frontend/infrastructure)
- 284 tests with 21 correctness properties
- Built using Kiro AI's spec-driven development approach
- Includes .kiro directory with requirements, design, and tasks"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create commit" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Git repository is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 8: Instructions for GitHub
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a GitHub repository:" -ForegroundColor Yellow
Write-Host "   - Go to: https://github.com/sahilashra" -ForegroundColor White
Write-Host "   - Click 'New repository'" -ForegroundColor White
Write-Host "   - Name: dod-generator" -ForegroundColor White
Write-Host "   - Make it PUBLIC ✅" -ForegroundColor White
Write-Host "   - Don't initialize with README" -ForegroundColor White
Write-Host "   - Click 'Create repository'" -ForegroundColor White
Write-Host ""

Write-Host "2. After creating the repository, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   git remote add origin https://github.com/sahilashra/dod-generator.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Or, if you want to use SSH (recommended):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   git remote add origin git@github.com:sahilashra/dod-generator.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 Quick Commands (copy-paste after creating repo):" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Using HTTPS:" -ForegroundColor Yellow
Write-Host 'git remote add origin https://github.com/sahilashra/dod-generator.git; git branch -M main; git push -u origin main' -ForegroundColor Green
Write-Host ""
Write-Host "# Using SSH:" -ForegroundColor Yellow
Write-Host 'git remote add origin git@github.com:sahilashra/dod-generator.git; git branch -M main; git push -u origin main' -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📝 Important Reminders:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Repository must be PUBLIC" -ForegroundColor Green
Write-Host "✅ .kiro directory is included (verified above)" -ForegroundColor Green
Write-Host "✅ No sensitive data in commits" -ForegroundColor Green
Write-Host "✅ Ready for competition submission!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to continue with remote setup
Write-Host "Would you like to add the remote and push now? (y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Great! Let's set up the remote..." -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Choose authentication method:" -ForegroundColor Yellow
    Write-Host "1. HTTPS (requires GitHub username and token)" -ForegroundColor White
    Write-Host "2. SSH (requires SSH key setup)" -ForegroundColor White
    $authChoice = Read-Host "Enter choice (1 or 2)"
    
    if ($authChoice -eq "1") {
        $repoUrl = "https://github.com/sahilashra/dod-generator.git"
    } elseif ($authChoice -eq "2") {
        $repoUrl = "git@github.com:sahilashra/dod-generator.git"
    } else {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Adding remote..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    
    Write-Host "Setting main branch..." -ForegroundColor Yellow
    git branch -M main
    
    Write-Host ""
    Write-Host "Ready to push! Run this command when you've created the GitHub repo:" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Have you created the GitHub repository? (y/n)" -ForegroundColor Yellow
    $repoCreated = Read-Host
    
    if ($repoCreated -eq "y" -or $repoCreated -eq "Y") {
        Write-Host ""
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "🎉 SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "✅ Your repository: https://github.com/sahilashra/dod-generator" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Verify .kiro directory is visible on GitHub" -ForegroundColor White
            Write-Host "2. Write your blog post (use BLOG-POST-TEMPLATE.md)" -ForegroundColor White
            Write-Host "3. Submit to competition dashboard" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "❌ Push failed. Common issues:" -ForegroundColor Red
            Write-Host "- Repository doesn't exist on GitHub yet" -ForegroundColor Yellow
            Write-Host "- Authentication failed (check credentials)" -ForegroundColor Yellow
            Write-Host "- Network issues" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Create the repository on GitHub first, then run:" -ForegroundColor Cyan
            Write-Host "git push -u origin main" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "No problem! Create the repository on GitHub first, then run:" -ForegroundColor Cyan
        Write-Host "git push -u origin main" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "No problem! When you are ready, follow the instructions above." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🏆 Good luck with your competition submission!" -ForegroundColor Cyan
