# Quick Test Script for DoD Generator
# This script helps you test the DoD Generator quickly

Write-Host "🧪 DoD Generator Quick Test" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Please create it first!" -ForegroundColor Red
    exit 1
}

# Check if dist folder exists
if (Test-Path dist) {
    Write-Host "✅ Project built" -ForegroundColor Green
} else {
    Write-Host "⚠️  Project not built. Building now..." -ForegroundColor Yellow
    npm run build
}

Write-Host ""
Write-Host "Choose a test option:" -ForegroundColor Cyan
Write-Host "1. Test with fixture (no API calls needed)" -ForegroundColor White
Write-Host "2. Test with your Jira ticket" -ForegroundColor White
Write-Host "3. Test with Jira ticket + GitLab MR" -ForegroundColor White
Write-Host "4. Test and post to Jira as comment" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🧪 Testing with backend fixture..." -ForegroundColor Cyan
        $json = Get-Content fixtures/jira-backend-ticket.json -Raw
        node dist/cli/index.js --ticket-json $json
    }
    "2" {
        Write-Host ""
        $ticketKey = Read-Host "Enter your Jira ticket key (e.g., DOD-1)"
        Write-Host ""
        Write-Host "🧪 Generating DoD for ticket $ticketKey..." -ForegroundColor Cyan
        node dist/cli/index.js --ticket-url "https://muhammed-sahil.atlassian.net/browse/$ticketKey"
    }
    "3" {
        Write-Host ""
        $ticketKey = Read-Host "Enter your Jira ticket key (e.g., DOD-1)"
        $mrNumber = Read-Host "Enter your GitLab MR number (e.g., 1)"
        Write-Host ""
        Write-Host "🧪 Generating DoD for ticket $ticketKey with MR !$mrNumber..." -ForegroundColor Cyan
        node dist/cli/index.js `
            --ticket-url "https://muhammed-sahil.atlassian.net/browse/$ticketKey" `
            --mr-url "https://gitlab.com/sahilashraf/DOD-Gen/-/merge_requests/$mrNumber"
    }
    "4" {
        Write-Host ""
        $ticketKey = Read-Host "Enter your Jira ticket key (e.g., DOD-1)"
        Write-Host ""
        Write-Host "🧪 Generating DoD and posting to Jira..." -ForegroundColor Cyan
        node dist/cli/index.js `
            --ticket-url "https://muhammed-sahil.atlassian.net/browse/$ticketKey" `
            --post-comment
        Write-Host ""
        Write-Host "✅ Check your Jira ticket for the DoD comment!" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For more testing options, see END-TO-END-TEST.md" -ForegroundColor Cyan
