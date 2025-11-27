# Simple Git Setup Script
# This prepares your repository for pushing to GitHub

Write-Host "🚀 Setting up Git repository..." -ForegroundColor Cyan
Write-Host ""

# Initialize Git
Write-Host "Initializing Git..." -ForegroundColor Yellow
git init

# Configure Git user if needed
$gitUserName = git config user.name
if ([string]::IsNullOrEmpty($gitUserName)) {
    git config user.name "Muhammed Sahil"
    Write-Host "✅ Git user name configured" -ForegroundColor Green
}

$gitUserEmail = git config user.email
if ([string]::IsNullOrEmpty($gitUserEmail)) {
    git config user.email "sahilashra@example.com"
    Write-Host "✅ Git user email configured" -ForegroundColor Green
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Show status
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

# Verify .kiro directory
Write-Host ""
Write-Host "Verifying .kiro directory..." -ForegroundColor Yellow
$kiroFiles = git ls-files .kiro
if ($kiroFiles) {
    Write-Host "✅ .kiro directory will be committed:" -ForegroundColor Green
    $kiroFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  Warning: .kiro directory not found in staged files" -ForegroundColor Yellow
}

# Create commit
Write-Host ""
Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: DoD Generator built with Kiro AI for AI for Bharat competition

- Automated Definition-of-Done generator for Jira tickets
- GitLab merge request integration  
- Type-specific templates (backend/frontend/infrastructure)
- 284 tests with 21 correctness properties
- Built using Kiro AI spec-driven development approach
- Includes .kiro directory with requirements, design, and tasks"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Git repository is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/sahilashra" -ForegroundColor Cyan
Write-Host "   - Click 'New repository'" -ForegroundColor White
Write-Host "   - Name: dod-generator" -ForegroundColor White
Write-Host "   - Make it PUBLIC" -ForegroundColor White
Write-Host ""
Write-Host "2. Then run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/sahilashra/dod-generator.git" -ForegroundColor Green
Write-Host "   git branch -M main" -ForegroundColor Green
Write-Host "   git push -u origin main" -ForegroundColor Green
Write-Host ""
Write-Host "Or copy this one-liner:" -ForegroundColor Yellow
Write-Host 'git remote add origin https://github.com/sahilashra/dod-generator.git; git branch -M main; git push -u origin main' -ForegroundColor Cyan
Write-Host ""
