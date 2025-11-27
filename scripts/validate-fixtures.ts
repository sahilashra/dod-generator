#!/usr/bin/env ts-node

/**
 * Script to validate fixture files against type definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import { isJiraTicket, isMergeRequest } from '../src/models/types';

const fixturesDir = path.join(__dirname, '..', 'fixtures');

// Validate Jira ticket fixtures
const jiraFixtures = [
  'jira-backend-ticket.json',
  'jira-frontend-ticket.json',
  'jira-infrastructure-ticket.json',
  'jira-bug-ticket.json'
];

console.log('Validating Jira ticket fixtures...\n');

jiraFixtures.forEach(filename => {
  const filepath = path.join(fixturesDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const data = JSON.parse(content);
  
  const isValid = isJiraTicket(data);
  const status = isValid ? '✓' : '✗';
  console.log(`${status} ${filename}: ${isValid ? 'VALID' : 'INVALID'}`);
  
  if (!isValid) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
});

// Validate GitLab MR fixtures
const mrFixtures = [
  'gitlab-mr-passed.json',
  'gitlab-mr-failed.json',
  'gitlab-mr-running.json'
];

console.log('\nValidating GitLab MR fixtures...\n');

mrFixtures.forEach(filename => {
  const filepath = path.join(fixturesDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const data = JSON.parse(content);
  
  const isValid = isMergeRequest(data);
  const status = isValid ? '✓' : '✗';
  console.log(`${status} ${filename}: ${isValid ? 'VALID' : 'INVALID'}`);
  
  if (!isValid) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
});

console.log('\nValidation complete!');
