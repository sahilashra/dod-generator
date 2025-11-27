# Test DoD Generator with fixtures (PowerShell)

Write-Host "🧪 Testing DoD Generator with Backend Ticket..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
$backendJson = Get-Content -Path "fixtures/jira-backend-ticket.json" -Raw
node dist/cli/index.js --ticket-json $backendJson

Write-Host ""
Write-Host ""
Write-Host "🧪 Testing DoD Generator with Frontend Ticket..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
$frontendJson = Get-Content -Path "fixtures/jira-frontend-ticket.json" -Raw
node dist/cli/index.js --ticket-json $frontendJson

Write-Host ""
Write-Host ""
Write-Host "🧪 Testing DoD Generator with Infrastructure Ticket..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
$infraJson = Get-Content -Path "fixtures/jira-infrastructure-ticket.json" -Raw
node dist/cli/index.js --ticket-json $infraJson
