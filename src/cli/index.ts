#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { generateDoDFromInput, DoDInput } from '../index';
import { ConfigLoader, ResolvedConfig } from '../config';

// Load environment variables from .env file
dotenv.config();

const program = new Command();

program
  .name('dod-gen')
  .description('Generate Definition-of-Done tables from Jira tickets and GitLab merge requests')
  .version('1.0.0');

program
  .option('--ticket-url <url>', 'Jira ticket URL')
  .option('--ticket-json <json>', 'Jira ticket data as JSON string')
  .option('--mr-url <url>', 'GitLab merge request URL')
  .option('--type <type>', 'Ticket type (backend, frontend, infrastructure)')
  .option('--post-comment', 'Post the generated DoD as a comment to the Jira ticket')
  .option('--config <path>', 'Path to configuration file directory')
  .action(async (options) => {
    try {
      // Load and merge configuration from all sources
      // Priority: CLI args > env vars > config file > defaults
      const configLoader = new ConfigLoader();
      
      const cliConfig: Partial<ResolvedConfig> = {};
      
      // CLI arguments take highest priority
      // Note: We don't set tokens from CLI as they should come from env or config file
      
      const config = configLoader.resolveConfig(cliConfig, options.config);

      // Validate required inputs
      if (!options.ticketUrl && !options.ticketJson) {
        console.error('Error: Either --ticket-url or --ticket-json must be provided');
        process.exit(1);
      }

      // Validate ticket type if provided
      if (options.type && !['backend', 'frontend', 'infrastructure'].includes(options.type)) {
        console.error('Error: --type must be one of: backend, frontend, infrastructure');
        process.exit(1);
      }

      // Build input object using resolved configuration
      const input: DoDInput = {
        jira_token: config.jiraToken,
        gitlab_token: config.gitlabToken,
        post_comment: options.postComment !== undefined ? options.postComment : config.defaultPostComment,
      };

      // Add ticket URL or JSON
      if (options.ticketUrl) {
        input.ticket_url = options.ticketUrl;
      } else if (options.ticketJson) {
        try {
          input.ticket_json = JSON.parse(options.ticketJson);
        } catch (error) {
          console.error('Error: Invalid JSON provided for --ticket-json');
          process.exit(1);
        }
      }

      // Add optional fields
      if (options.mrUrl) {
        input.mr_url = options.mrUrl;
      }

      // Use CLI type if provided, otherwise use default from config
      if (options.type) {
        input.type = options.type as 'backend' | 'frontend' | 'infrastructure';
      } else if (config.defaultTicketType) {
        input.type = config.defaultTicketType;
      }

      // Call main orchestration function with resolved base URLs
      const result = await generateDoDFromInput(input, config.jiraBaseUrl, config.gitlabBaseUrl);

      // Display formatted DoD to stdout
      console.log(result.dod);

      // Display errors to stderr
      if (result.errors.length > 0) {
        console.error('\nWarnings/Errors:');
        result.errors.forEach(error => {
          console.error(`  - ${error}`);
        });
      }

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(process.argv);
