#!/bin/bash

# Test DoD Generator with fixtures

echo "🧪 Testing DoD Generator with Backend Ticket..."
echo "================================================"
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-backend-ticket.json)"

echo ""
echo ""
echo "🧪 Testing DoD Generator with Frontend Ticket..."
echo "================================================"
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-frontend-ticket.json)"

echo ""
echo ""
echo "🧪 Testing DoD Generator with Infrastructure Ticket..."
echo "======================================================="
node dist/cli/index.js --ticket-json "$(cat fixtures/jira-infrastructure-ticket.json)"
