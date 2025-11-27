import axios, { AxiosError } from 'axios';
import { MergeRequest } from '../models/types';

/**
 * GitLabFetcher handles fetching merge request data from GitLab REST API v4
 */
export class GitLabFetcher {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  /**
   * Fetches a GitLab merge request by its URL
   * @param mrUrl - The GitLab merge request URL (e.g., "https://gitlab.com/project/repo/-/merge_requests/123")
   * @returns Promise resolving to MergeRequest
   * @throws Error with descriptive message on failure
   */
  async fetchMergeRequest(mrUrl: string): Promise<MergeRequest> {
    try {
      const { projectPath, mrIid } = this.parseMrUrl(mrUrl);
      const encodedProjectPath = encodeURIComponent(projectPath);
      
      // Fetch MR data
      const mrApiUrl = `${this.baseUrl}/api/v4/projects/${encodedProjectPath}/merge_requests/${mrIid}`;
      const mrResponse = await axios.get(mrApiUrl, {
        headers: {
          'Private-Token': this.token,
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      // Fetch pipelines for the MR
      const pipelinesUrl = `${this.baseUrl}/api/v4/projects/${encodedProjectPath}/merge_requests/${mrIid}/pipelines`;
      const pipelinesResponse = await axios.get(pipelinesUrl, {
        headers: {
          'Private-Token': this.token,
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return this.parseGitLabResponse(mrResponse.data, pipelinesResponse.data, mrUrl);
    } catch (error) {
      throw this.handleError(error, mrUrl);
    }
  }

  /**
   * Parses GitLab MR URL to extract project path and MR IID
   */
  private parseMrUrl(mrUrl: string): { projectPath: string; mrIid: string } {
    // Expected format: https://gitlab.com/group/project/-/merge_requests/123
    // or: https://gitlab.example.com/group/subgroup/project/-/merge_requests/456
    const match = mrUrl.match(/\/([^\/]+(?:\/[^\/]+)*)\/-\/merge_requests\/(\d+)/);
    
    if (!match) {
      throw new Error(`Invalid GitLab MR URL format: ${mrUrl}`);
    }

    return {
      projectPath: match[1],
      mrIid: match[2]
    };
  }

  /**
   * Parses GitLab API v4 response into MergeRequest model
   */
  private parseGitLabResponse(mrData: any, pipelinesData: any[], mrUrl: string): MergeRequest {
    // Select the most recent pipeline
    const ciStatus = this.selectMostRecentPipelineStatus(pipelinesData);
    
    return {
      title: mrData.title || '',
      ciStatus,
      changedFiles: this.extractChangedFiles(mrData),
      webUrl: mrUrl
    };
  }

  /**
   * Selects the most recent pipeline status from multiple pipelines
   */
  private selectMostRecentPipelineStatus(pipelines: any[]): MergeRequest['ciStatus'] {
    if (!pipelines || pipelines.length === 0) {
      return 'pending';
    }

    // Sort pipelines by created_at or updated_at timestamp (most recent first)
    const sortedPipelines = [...pipelines].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });

    const mostRecentPipeline = sortedPipelines[0];
    const status = mostRecentPipeline.status?.toLowerCase();

    // Map GitLab pipeline statuses to our MergeRequest ciStatus type
    switch (status) {
      case 'success':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'running':
        return 'running';
      case 'pending':
        return 'pending';
      case 'canceled':
      case 'cancelled':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  /**
   * Extracts list of changed files from MR data
   */
  private extractChangedFiles(mrData: any): string[] {
    // GitLab API includes changes in the MR response
    if (mrData.changes && Array.isArray(mrData.changes)) {
      return mrData.changes.map((change: any) => 
        change.new_path || change.old_path || ''
      ).filter((path: string) => path !== '');
    }

    // Fallback: if changes aren't included, return empty array
    // In a real implementation, we might make an additional API call to get changes
    return [];
  }

  /**
   * Handles errors from API calls and converts them to descriptive error messages
   */
  private handleError(error: unknown, mrUrl: string): Error {
    // Check if it's an axios error by checking for isAxiosError property
    const isAxios = (error as any)?.isAxiosError === true || axios.isAxiosError(error);
    
    if (isAxios) {
      const axiosError = error as AxiosError;

      // Network errors
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        return new Error(`GitLab API unreachable: Unable to connect to ${this.baseUrl}`);
      }

      // Timeout errors
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        return new Error(`GitLab API timeout: Request timed out while fetching MR ${mrUrl}`);
      }

      // HTTP errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            return new Error(`GitLab authentication failed: Invalid or missing API token`);
          case 403:
            return new Error(`GitLab authorization failed: Token does not have permission to access ${mrUrl}`);
          case 404:
            return new Error(`GitLab merge request not found: ${mrUrl} does not exist`);
          case 429:
            return new Error(`GitLab rate limit exceeded: Too many requests, please try again later`);
          case 500:
          case 502:
          case 503:
          case 504:
            return new Error(`GitLab server error: The GitLab API returned status ${status}`);
          default:
            return new Error(`GitLab API error: Fetching MR failed for ${mrUrl} with status ${status}`);
        }
      }
    }

    // Generic error
    return new Error(`Unexpected error while fetching MR ${mrUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
