@echo off
REM Test DoD Generator with fixtures (Windows)

echo Testing DoD Generator with Backend Ticket...
echo ================================================
type fixtures\jira-backend-ticket.json | node dist\cli\index.js --ticket-json "@-"

echo.
echo.
echo Testing DoD Generator with Frontend Ticket...
echo ================================================
type fixtures\jira-frontend-ticket.json | node dist\cli\index.js --ticket-json "@-"

echo.
echo.
echo Testing DoD Generator with Infrastructure Ticket...
echo =======================================================
type fixtures\jira-infrastructure-ticket.json | node dist\cli\index.js --ticket-json "@-"
