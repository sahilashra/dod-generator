#!/usr/bin/env ts-node

/**
 * Script to test DoD generation with fixture files
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateDoDFromInput } from '../src/index';

async function testFixture() {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  
  // Load backend ticket fixture
  const ticketPath = path.join(fixturesDir, 'jira-backend-ticket.json');
  const ticketData = JSON.parse(fs.readFileSync(ticketPath, 'utf-8'));
  
  console.log('Testing DoD generation with backend ticket fixture...\n');
  console.log(`Ticket: ${ticketData.key} - ${ticketData.summary}\n`);
  
  try {
    const result = await generateDoDFromInput({
      ticket_json: ticketData,
      type: 'backend'
    });
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    } else {
      console.log('✓ DoD generated successfully!\n');
      console.log('Preview (first 500 characters):');
      console.log('─'.repeat(80));
      console.log(result.dod.substring(0, 500) + '...');
      console.log('─'.repeat(80));
      console.log(`\nTotal length: ${result.dod.length} characters`);
    }
  } catch (error) {
    console.error('✗ Failed to generate DoD:', error.message);
    process.exit(1);
  }
}

testFixture();
