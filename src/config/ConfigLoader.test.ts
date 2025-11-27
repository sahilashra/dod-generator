import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader } from './ConfigLoader';
import { DoDConfig } from './types';

// Mock fs module
jest.mock('fs');

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    configLoader = new ConfigLoader();
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.JIRA_BASE_URL;
    delete process.env.JIRA_TOKEN;
    delete process.env.GITLAB_BASE_URL;
    delete process.env.GITLAB_TOKEN;
  });

  describe('loadConfigFile', () => {
    it('should return null when no config file exists', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = configLoader.loadConfigFile('/test/dir');

      expect(result).toBeNull();
    });

    it('should load and parse config file when it exists', () => {
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://custom-jira.com',
          token: 'test-token',
        },
        gitlab: {
          baseUrl: 'https://custom-gitlab.com',
        },
        defaults: {
          ticketType: 'backend',
          postComment: true,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configLoader.loadConfigFile('/test/dir');

      expect(result).toEqual(mockConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        path.join('/test/dir', '.dodrc.json'),
        'utf-8'
      );
    });

    it('should throw error when config file has invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ invalid json }');

      expect(() => configLoader.loadConfigFile('/test/dir')).toThrow(
        /Failed to parse config file/
      );
    });

    it('should search parent directories for config file', () => {
      // Mock directory structure: /test/dir/subdir
      // Config exists in /test/dir
      const calls: string[] = [];
      mockFs.existsSync.mockImplementation((filePath) => {
        calls.push(filePath as string);
        return filePath === path.join('/test/dir', '.dodrc.json');
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify({ jira: { baseUrl: 'test' } }));

      const result = configLoader.loadConfigFile('/test/dir/subdir');

      expect(result).not.toBeNull();
      expect(calls).toContain(path.join('/test/dir/subdir', '.dodrc.json'));
      expect(calls).toContain(path.join('/test/dir', '.dodrc.json'));
    });
  });

  describe('loadEnvConfig', () => {
    it('should return empty config when no env vars are set', () => {
      const result = configLoader.loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should load Jira configuration from environment variables', () => {
      process.env.JIRA_BASE_URL = 'https://env-jira.com';
      process.env.JIRA_TOKEN = 'env-token';

      const result = configLoader.loadEnvConfig();

      expect(result).toEqual({
        jiraBaseUrl: 'https://env-jira.com',
        jiraToken: 'env-token',
      });
    });

    it('should load GitLab configuration from environment variables', () => {
      process.env.GITLAB_BASE_URL = 'https://env-gitlab.com';
      process.env.GITLAB_TOKEN = 'env-gitlab-token';

      const result = configLoader.loadEnvConfig();

      expect(result).toEqual({
        gitlabBaseUrl: 'https://env-gitlab.com',
        gitlabToken: 'env-gitlab-token',
      });
    });

    it('should load all configuration from environment variables', () => {
      process.env.JIRA_BASE_URL = 'https://env-jira.com';
      process.env.JIRA_TOKEN = 'env-jira-token';
      process.env.GITLAB_BASE_URL = 'https://env-gitlab.com';
      process.env.GITLAB_TOKEN = 'env-gitlab-token';

      const result = configLoader.loadEnvConfig();

      expect(result).toEqual({
        jiraBaseUrl: 'https://env-jira.com',
        jiraToken: 'env-jira-token',
        gitlabBaseUrl: 'https://env-gitlab.com',
        gitlabToken: 'env-gitlab-token',
      });
    });
  });

  describe('resolveConfig', () => {
    it('should use default values when no other config is provided', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = configLoader.resolveConfig();

      expect(result).toEqual({
        jiraBaseUrl: 'https://jira.atlassian.com',
        gitlabBaseUrl: 'https://gitlab.com',
        defaultPostComment: false,
      });
    });

    it('should merge config file with defaults', () => {
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://file-jira.com',
          token: 'file-token',
        },
        defaults: {
          ticketType: 'frontend',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configLoader.resolveConfig();

      expect(result).toEqual({
        jiraBaseUrl: 'https://file-jira.com',
        jiraToken: 'file-token',
        gitlabBaseUrl: 'https://gitlab.com', // default
        defaultTicketType: 'frontend',
        defaultPostComment: false,
      });
    });

    it('should prioritize env vars over config file', () => {
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://file-jira.com',
          token: 'file-token',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      process.env.JIRA_BASE_URL = 'https://env-jira.com';
      process.env.JIRA_TOKEN = 'env-token';

      const result = configLoader.resolveConfig();

      expect(result.jiraBaseUrl).toBe('https://env-jira.com');
      expect(result.jiraToken).toBe('env-token');
    });

    it('should prioritize CLI args over env vars and config file', () => {
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://file-jira.com',
          token: 'file-token',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      process.env.JIRA_BASE_URL = 'https://env-jira.com';
      process.env.JIRA_TOKEN = 'env-token';

      const cliConfig = {
        jiraBaseUrl: 'https://cli-jira.com',
        jiraToken: 'cli-token',
      };

      const result = configLoader.resolveConfig(cliConfig);

      expect(result.jiraBaseUrl).toBe('https://cli-jira.com');
      expect(result.jiraToken).toBe('cli-token');
    });

    it('should correctly merge all configuration sources with proper precedence', () => {
      // Config file provides base configuration
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://file-jira.com',
          token: 'file-jira-token',
        },
        gitlab: {
          baseUrl: 'https://file-gitlab.com',
          token: 'file-gitlab-token',
        },
        defaults: {
          ticketType: 'backend',
          postComment: true,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      // Env vars override some values
      process.env.JIRA_TOKEN = 'env-jira-token';
      process.env.GITLAB_BASE_URL = 'https://env-gitlab.com';

      // CLI args override specific values
      const cliConfig = {
        gitlabToken: 'cli-gitlab-token',
      };

      const result = configLoader.resolveConfig(cliConfig);

      // Verify precedence: CLI > env > file > defaults
      expect(result).toEqual({
        jiraBaseUrl: 'https://file-jira.com', // from file
        jiraToken: 'env-jira-token', // from env (overrides file)
        gitlabBaseUrl: 'https://env-gitlab.com', // from env (overrides file)
        gitlabToken: 'cli-gitlab-token', // from CLI (overrides file)
        defaultTicketType: 'backend', // from file
        defaultPostComment: true, // from file
      });
    });

    it('should handle partial config file', () => {
      const mockConfig: DoDConfig = {
        jira: {
          baseUrl: 'https://file-jira.com',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configLoader.resolveConfig();

      expect(result).toEqual({
        jiraBaseUrl: 'https://file-jira.com',
        gitlabBaseUrl: 'https://gitlab.com', // default
        defaultPostComment: false, // default
      });
    });
  });
});
