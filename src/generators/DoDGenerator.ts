import { JiraTicket, MergeRequest, DoDTable, DoDSection, DoDRow } from '../models/types';
import { inferTicketType } from '../utils/ticketTypeInference';

export class DoDGenerator {
  generateDoD(
    ticket: JiraTicket,
    mr?: MergeRequest,
    ticketType?: string
  ): DoDTable {
    const inferredType = ticketType || inferTicketType(ticket);
    
    const sections: DoDSection[] = [
      this.generateAcceptanceCriteriaSection(ticket),
      this.generateTestingSection(inferredType, ticket),
      this.generateManualTestSection(inferredType, ticket),
      this.generateDocumentationSection(inferredType, ticket),
      this.generateReviewerChecklist(),
    ];

    // Add CI section if MR is provided
    const ciSection = this.generateCISection(mr);
    sections.splice(sections.length - 1, 0, ciSection);

    // Add type-specific sections
    if (inferredType === 'backend') {
      const backendSections = this.generateBackendSpecificSections();
      sections.splice(sections.length - 1, 0, ...backendSections);
    } else if (inferredType === 'frontend') {
      const frontendSections = this.generateFrontendSpecificSections();
      sections.splice(sections.length - 1, 0, ...frontendSections);
    } else if (inferredType === 'infrastructure') {
      const infraSections = this.generateInfraSpecificSections();
      sections.splice(sections.length - 1, 0, ...infraSections);
    }

    return {
      sections,
      metadata: {
        ticketKey: ticket.key,
        ticketType: inferredType,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private generateAcceptanceCriteriaSection(ticket: JiraTicket): DoDSection {
    const rows: DoDRow[] = [];

    if (ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0) {
      // Map each acceptance criterion to a separate row
      ticket.acceptanceCriteria.forEach((criterion) => {
        rows.push({
          category: 'Acceptance Criteria',
          items: [criterion],
          checked: false,
        });
      });
    } else {
      // Placeholder when no explicit acceptance criteria
      rows.push({
        category: 'Acceptance Criteria',
        items: ['Manual review needed - no explicit acceptance criteria found'],
        checked: false,
      });
    }

    return {
      title: 'Acceptance Criteria',
      rows,
    };
  }

  private generateTestingSection(ticketType: string, ticket: JiraTicket): DoDSection {
    const rows: DoDRow[] = [];

    if (ticketType === 'backend') {
      // Backend: Emphasize unit and integration tests
      rows.push({
        category: 'Unit Tests',
        items: ['Write comprehensive unit tests for business logic, services, and utilities'],
        checked: false,
      });

      rows.push({
        category: 'Integration Tests',
        items: ['Write integration tests for API endpoints, database interactions, and external service integrations'],
        checked: false,
      });

      rows.push({
        category: 'End-to-End Tests',
        items: ['Write e2e tests for critical user flows'],
        checked: false,
      });
    } else if (ticketType === 'frontend') {
      // Frontend: Emphasize component and e2e tests
      rows.push({
        category: 'Component Tests',
        items: ['Write component tests for UI components, props, state, and user interactions'],
        checked: false,
      });

      rows.push({
        category: 'Integration Tests',
        items: ['Write integration tests for component interactions and data flow'],
        checked: false,
      });

      rows.push({
        category: 'End-to-End Tests',
        items: ['Write comprehensive e2e tests for user workflows and critical paths'],
        checked: false,
      });
    } else {
      // Default testing structure
      rows.push({
        category: 'Unit Tests',
        items: ['Write unit tests for new/modified functions and classes'],
        checked: false,
      });

      rows.push({
        category: 'Integration Tests',
        items: ['Write integration tests for component interactions'],
        checked: false,
      });

      rows.push({
        category: 'End-to-End Tests',
        items: ['Write e2e tests for critical user flows'],
        checked: false,
      });
    }

    // Add API contract testing if API-related terms detected
    if (this.hasApiRelatedContent(ticket)) {
      rows.push({
        category: 'API Contract Testing',
        items: ['Write tests to verify API contracts, request/response schemas, and endpoint behavior'],
        checked: false,
      });
    }

    return {
      title: 'Automated Tests',
      rows,
    };
  }

  private generateManualTestSection(ticketType: string, ticket: JiraTicket): DoDSection {
    const rows: DoDRow[] = [];

    if (ticketType === 'backend') {
      // Backend: Add API endpoint testing prompts
      rows.push({
        category: 'Manual Testing',
        items: [
          'Test API endpoints with various input scenarios (valid, invalid, edge cases)',
          'Verify response status codes and error messages',
          'Test authentication and authorization flows',
        ],
        checked: false,
      });
    } else if (ticketType === 'frontend') {
      // Frontend: Add UI interaction testing prompts
      rows.push({
        category: 'Manual Testing',
        items: [
          'Test UI interactions across different browsers (Chrome, Firefox, Safari)',
          'Verify responsive design on various screen sizes (mobile, tablet, desktop)',
          'Test keyboard navigation and focus management',
          'Verify visual appearance matches design specifications',
        ],
        checked: false,
      });
    } else {
      // Base manual test prompt
      rows.push({
        category: 'Manual Testing',
        items: ['Describe and execute manual test scenarios'],
        checked: false,
      });
    }

    // Add data validation prompts if data-related terms detected
    if (this.hasDataChangeContent(ticket)) {
      rows.push({
        category: 'Data Validation',
        items: [
          'Verify data integrity after changes',
          'Test data migration scripts if applicable',
          'Validate data transformations and schema changes',
        ],
        checked: false,
      });
    }

    return {
      title: 'Manual Test Steps',
      rows,
    };
  }

  private generateDocumentationSection(ticketType: string, ticket: JiraTicket): DoDSection {
    const rows: DoDRow[] = [];

    const items: string[] = ['Update relevant documentation (README, API docs, etc.)'];
    
    // Add runbook update prompts for infrastructure tickets
    if (ticketType === 'infrastructure') {
      items.push('Update runbooks with new procedures or configuration changes');
      items.push('Document troubleshooting steps for common issues');
    }

    // Add user-facing documentation prompts for feature stories
    if (this.isFeatureStory(ticket)) {
      items.push('Update user-facing documentation for new features');
      items.push('Create or update user guides and tutorials');
    }

    rows.push({
      category: 'Documentation',
      items,
      checked: false,
    });

    return {
      title: 'Documentation Updates',
      rows,
    };
  }

  private generateBackendSpecificSections(): DoDSection[] {
    const sections: DoDSection[] = [];

    // API Contract Changes section
    sections.push({
      title: 'API Contract Changes',
      rows: [
        {
          category: 'API Documentation',
          items: [
            'Document new or modified API endpoints (request/response schemas)',
            'Update API versioning if breaking changes introduced',
            'Update OpenAPI/Swagger specifications if applicable',
          ],
          checked: false,
        },
      ],
    });

    // Monitoring and Logging section
    sections.push({
      title: 'Monitoring and Logging',
      rows: [
        {
          category: 'Observability',
          items: [
            'Add appropriate logging for new functionality (info, warn, error levels)',
            'Add metrics/monitoring for critical operations',
            'Ensure sensitive data is not logged',
          ],
          checked: false,
        },
      ],
    });

    // Rollback and Migration Notes section
    sections.push({
      title: 'Rollback and Migration Notes',
      rows: [
        {
          category: 'Deployment Safety',
          items: [
            'Document rollback procedure if deployment fails',
            'Ensure database migrations are reversible',
            'Document any manual steps required for deployment',
          ],
          checked: false,
        },
      ],
    });

    return sections;
  }

  private generateFrontendSpecificSections(): DoDSection[] {
    const sections: DoDSection[] = [];

    // UI/UX Validation section
    sections.push({
      title: 'UI/UX Validation',
      rows: [
        {
          category: 'Design Compliance',
          items: [
            'Verify UI matches design mockups and specifications',
            'Ensure consistent styling with design system/style guide',
            'Validate spacing, typography, and color usage',
            'Test animations and transitions for smoothness',
          ],
          checked: false,
        },
      ],
    });

    // Accessibility Compliance section
    sections.push({
      title: 'Accessibility Compliance',
      rows: [
        {
          category: 'A11y Requirements',
          items: [
            'Ensure proper semantic HTML structure',
            'Verify ARIA labels and roles are correctly applied',
            'Test keyboard navigation and focus indicators',
            'Verify sufficient color contrast ratios (WCAG AA)',
            'Test with screen readers (NVDA, JAWS, VoiceOver)',
          ],
          checked: false,
        },
      ],
    });

    return sections;
  }

  private generateInfraSpecificSections(): DoDSection[] {
    const sections: DoDSection[] = [];

    // Deployment Procedures section
    sections.push({
      title: 'Deployment Procedures',
      rows: [
        {
          category: 'Deployment Steps',
          items: [
            'Document step-by-step deployment procedure',
            'Verify deployment can be executed without manual intervention',
            'Test deployment in staging environment before production',
            'Document rollback procedure in case of deployment failure',
          ],
          checked: false,
        },
      ],
    });

    // Infrastructure Validation section
    sections.push({
      title: 'Infrastructure Validation',
      rows: [
        {
          category: 'Infrastructure Testing',
          items: [
            'Verify infrastructure changes work as expected in test environment',
            'Validate resource limits and scaling configurations',
            'Test monitoring and alerting for infrastructure components',
            'Verify backup and disaster recovery procedures',
            'Confirm security configurations and access controls',
          ],
          checked: false,
        },
      ],
    });

    return sections;
  }

  private generateCISection(mr?: MergeRequest): DoDSection {
    const rows: DoDRow[] = [];

    if (mr) {
      // MR provided: Include actual CI status
      const statusIndicator = this.getCIStatusIndicator(mr.ciStatus);
      rows.push({
        category: 'CI Pipeline',
        items: [`CI Status: ${statusIndicator} ${mr.ciStatus}`],
        checked: mr.ciStatus === 'passed',
      });
    } else {
      // No MR: Include placeholder for manual verification
      rows.push({
        category: 'CI Pipeline',
        items: ['Verify CI pipeline passes before merging'],
        checked: false,
      });
    }

    return {
      title: 'Continuous Integration',
      rows,
    };
  }

  private generateReviewerChecklist(): DoDSection {
    const rows: DoDRow[] = [];

    rows.push({
      category: 'Code Review',
      items: [
        'Code follows project style guidelines',
        'No obvious bugs or code smells',
        'Tests are comprehensive and passing',
        'Documentation is clear and complete',
      ],
      checked: false,
    });

    return {
      title: 'Reviewer Checklist',
      rows,
    };
  }

  // Helper methods for conditional content detection

  private hasApiRelatedContent(ticket: JiraTicket): boolean {
    const combinedText = `${ticket.summary} ${ticket.description}`.toLowerCase();
    const apiTerms = [
      'api',
      'endpoint',
      'rest',
      'graphql',
      'http',
      'request',
      'response',
      'webhook',
      'microservice',
    ];
    return apiTerms.some(term => combinedText.includes(term));
  }

  private isFeatureStory(ticket: JiraTicket): boolean {
    // Check if issue type is "Story" or description mentions new features
    if (ticket.issueType.toLowerCase() === 'story') {
      return true;
    }
    
    const combinedText = `${ticket.summary} ${ticket.description}`.toLowerCase();
    const featureTerms = [
      'new feature',
      'feature',
      'user story',
      'enhancement',
      'capability',
    ];
    return featureTerms.some(term => combinedText.includes(term));
  }

  private hasDataChangeContent(ticket: JiraTicket): boolean {
    const combinedText = `${ticket.summary} ${ticket.description}`.toLowerCase();
    const dataTerms = [
      'database',
      'schema',
      'migration',
      'data',
      'table',
      'column',
      'index',
      'query',
      'sql',
      'nosql',
      'collection',
      'document',
    ];
    return dataTerms.some(term => combinedText.includes(term));
  }

  private getCIStatusIndicator(status: string): string {
    switch (status) {
      case 'passed':
        return '✓';
      case 'failed':
        return '✗';
      case 'running':
        return '⟳';
      case 'pending':
        return '⏳';
      case 'canceled':
        return '⊘';
      default:
        return '?';
    }
  }
}
