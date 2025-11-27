import * as fs from 'fs';
import * as path from 'path';
import { DoDConfig, ResolvedConfig } from './types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ResolvedConfig = {
  jiraBaseUrl: 'https://jira.atlassian.com',
  gitlabBaseUrl: 'https://gitlab.com',
  defaultPostComment: false,
};

/**
 * ConfigLoader handles loading and merging configuration from multiple sources
 * Priority: CLI args > env vars > config file > defaults
 */
export class ConfigLoader {
  /**
   * Load configuration from .dodrc.json file if it exists
   * Searches in current directory and parent directories
   */
  loadConfigFile(startDir: string = process.cwd()): DoDConfig | null {
    let currentDir = startDir;
    const configFileName = '.dodrc.json';

    // Search up the directory tree for config file
    while (true) {
      const configPath = path.join(currentDir, configFileName);
      
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          const config = JSON.parse(configContent) as DoDConfig;
          return config;
        } catch (error) {
          throw new Error(`Failed to parse config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Move to parent directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root directory
        break;
      }
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvConfig(): Partial<ResolvedConfig> {
    const config: Partial<ResolvedConfig> = {};

    if (process.env.JIRA_BASE_URL) {
      config.jiraBaseUrl = process.env.JIRA_BASE_URL;
    }

    if (process.env.JIRA_TOKEN) {
      config.jiraToken = process.env.JIRA_TOKEN;
    }

    if (process.env.GITLAB_BASE_URL) {
      config.gitlabBaseUrl = process.env.GITLAB_BASE_URL;
    }

    if (process.env.GITLAB_TOKEN) {
      config.gitlabToken = process.env.GITLAB_TOKEN;
    }

    return config;
  }

  /**
   * Merge configuration from all sources with proper precedence
   * Priority: CLI args > env vars > config file > defaults
   * 
   * @param cliConfig - Configuration from CLI arguments
   * @param configFilePath - Optional path to start searching for config file
   */
  resolveConfig(
    cliConfig: Partial<ResolvedConfig> = {},
    configFilePath?: string
  ): ResolvedConfig {
    // Start with defaults
    const resolved: ResolvedConfig = { ...DEFAULT_CONFIG };

    // Load and merge config file
    const fileConfig = this.loadConfigFile(configFilePath);
    if (fileConfig) {
      if (fileConfig.jira?.baseUrl) {
        resolved.jiraBaseUrl = fileConfig.jira.baseUrl;
      }
      if (fileConfig.jira?.token) {
        resolved.jiraToken = fileConfig.jira.token;
      }
      if (fileConfig.gitlab?.baseUrl) {
        resolved.gitlabBaseUrl = fileConfig.gitlab.baseUrl;
      }
      if (fileConfig.gitlab?.token) {
        resolved.gitlabToken = fileConfig.gitlab.token;
      }
      if (fileConfig.defaults?.ticketType) {
        resolved.defaultTicketType = fileConfig.defaults.ticketType;
      }
      if (fileConfig.defaults?.postComment !== undefined) {
        resolved.defaultPostComment = fileConfig.defaults.postComment;
      }
    }

    // Merge environment variables (higher priority than config file)
    const envConfig = this.loadEnvConfig();
    Object.assign(resolved, envConfig);

    // Merge CLI arguments (highest priority)
    Object.assign(resolved, cliConfig);

    return resolved;
  }
}
