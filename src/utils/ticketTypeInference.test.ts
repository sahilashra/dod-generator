import * as fc from 'fast-check';
import { inferTicketType, TicketType } from './ticketTypeInference';
import { JiraTicket } from '../models/types';

describe('ticketTypeInference', () => {
  describe('Property-Based Tests', () => {
    /**
     * Feature: generate-dod, Property 3: Ticket type classification from labels
     * Validates: Requirements 1.4
     * 
     * For any set of ticket labels, the system should correctly identify the ticket type
     * (backend, frontend, infrastructure) based on the presence of type-indicating labels.
     */
    it('should correctly classify ticket type from labels', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1 }),
            summary: fc.string(),
            description: fc.string(),
            labels: fc.oneof(
              // Backend labels
              fc.constant(['backend']),
              fc.constant(['Backend']),
              fc.constant(['BACKEND']),
              fc.constant(['back-end']),
              fc.constant(['api']),
              fc.constant(['server']),
              fc.constant(['database']),
              fc.constant(['db']),
              // Frontend labels
              fc.constant(['frontend']),
              fc.constant(['Frontend']),
              fc.constant(['FRONTEND']),
              fc.constant(['front-end']),
              fc.constant(['ui']),
              fc.constant(['ux']),
              fc.constant(['client']),
              fc.constant(['web']),
              // Infrastructure labels
              fc.constant(['infrastructure']),
              fc.constant(['Infrastructure']),
              fc.constant(['INFRASTRUCTURE']),
              fc.constant(['infra']),
              fc.constant(['devops']),
              fc.constant(['deployment']),
              fc.constant(['ci/cd']),
              fc.constant(['cicd']),
              // Mixed labels with backend
              fc.constant(['backend', 'urgent', 'bug']),
              fc.constant(['api', 'feature']),
              // Mixed labels with frontend
              fc.constant(['frontend', 'enhancement']),
              fc.constant(['ui', 'bug']),
              // Mixed labels with infrastructure
              fc.constant(['infrastructure', 'critical']),
              fc.constant(['devops', 'task'])
            ),
            issueType: fc.string(),
            linkedIssues: fc.array(fc.string()),
            acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined })
          }),
          (ticket: JiraTicket) => {
            const result = inferTicketType(ticket);
            
            // Determine expected type based on labels
            const normalizedLabels = ticket.labels.map(l => l.toLowerCase());
            let expectedType: TicketType;
            
            if (normalizedLabels.some(l => 
              l === 'backend' || l === 'back-end' || l.includes('api') || 
              l.includes('server') || l.includes('database') || l.includes('db')
            )) {
              expectedType = 'backend';
            } else if (normalizedLabels.some(l => 
              l === 'frontend' || l === 'front-end' || l.includes('ui') || 
              l.includes('ux') || l.includes('client') || l.includes('web')
            )) {
              expectedType = 'frontend';
            } else if (normalizedLabels.some(l => 
              l === 'infrastructure' || l.includes('infra') || l.includes('devops') || 
              l.includes('deployment') || l.includes('ci/cd') || l.includes('cicd')
            )) {
              expectedType = 'infrastructure';
            } else {
              expectedType = 'backend'; // default
            }
            
            return result === expectedType;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Explicit type parameter always takes precedence
     * 
     * For any ticket and any explicit type parameter, the explicit type should always
     * be returned regardless of labels or description content.
     */
    it('should prioritize explicit type parameter over labels and description', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1 }),
            summary: fc.string(),
            description: fc.string(),
            labels: fc.array(fc.string()),
            issueType: fc.string(),
            linkedIssues: fc.array(fc.string()),
            acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined })
          }),
          fc.constantFrom('backend' as const, 'frontend' as const, 'infrastructure' as const),
          (ticket: JiraTicket, explicitType: TicketType) => {
            const result = inferTicketType(ticket, explicitType);
            return result === explicitType;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Default to backend when no indicators present
     * 
     * For any ticket with no type-indicating labels or keywords, the system should
     * default to 'backend' type.
     */
    it('should default to backend when no type indicators are present', () => {
      // Define all keywords that would trigger type detection
      const allKeywords = [
        // Backend
        'api', 'endpoint', 'rest', 'graphql', 'database', 'sql', 'migration', 
        'server', 'backend', 'microservice', 'service',
        // Frontend
        'ui', 'ux', 'component', 'react', 'vue', 'angular', 'frontend', 
        'button', 'form', 'page', 'view', 'css', 'html', 'styling',
        // Infrastructure
        'infrastructure', 'deployment', 'ci/cd', 'pipeline', 'docker', 
        'kubernetes', 'k8s', 'terraform', 'ansible', 'devops', 'monitoring', 'logging'
      ];

      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1 }),
            summary: fc.string({ maxLength: 10 }).filter(s => {
              const lower = s.toLowerCase();
              return !allKeywords.some(keyword => lower.includes(keyword));
            }),
            description: fc.string({ maxLength: 10 }).filter(s => {
              const lower = s.toLowerCase();
              return !allKeywords.some(keyword => lower.includes(keyword));
            }),
            labels: fc.constant([]), // No labels
            issueType: fc.constant('Task'),
            linkedIssues: fc.array(fc.string()),
            acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined })
          }),
          (ticket: JiraTicket) => {
            const result = inferTicketType(ticket);
            return result === 'backend';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Result is always a valid ticket type
     * 
     * For any ticket, the inferred type should always be one of the three valid types.
     */
    it('should always return a valid ticket type', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1 }),
            summary: fc.string(),
            description: fc.string(),
            labels: fc.array(fc.string()),
            issueType: fc.string(),
            linkedIssues: fc.array(fc.string()),
            acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined })
          }),
          (ticket: JiraTicket) => {
            const result = inferTicketType(ticket);
            return ['backend', 'frontend', 'infrastructure'].includes(result);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    const createTicket = (overrides: Partial<JiraTicket> = {}): JiraTicket => ({
      key: 'TEST-123',
      summary: 'Test ticket',
      description: 'Test description',
      labels: [],
      issueType: 'Task',
      linkedIssues: [],
      ...overrides,
    });

    describe('Label-based classification', () => {
      it('should classify as backend with "backend" label', () => {
        const ticket = createTicket({ labels: ['backend'] });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should classify as backend with "api" label', () => {
        const ticket = createTicket({ labels: ['api'] });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should classify as backend with "database" label', () => {
        const ticket = createTicket({ labels: ['database'] });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should classify as frontend with "frontend" label', () => {
        const ticket = createTicket({ labels: ['frontend'] });
        expect(inferTicketType(ticket)).toBe('frontend');
      });

      it('should classify as frontend with "ui" label', () => {
        const ticket = createTicket({ labels: ['ui'] });
        expect(inferTicketType(ticket)).toBe('frontend');
      });

      it('should classify as frontend with "ux" label', () => {
        const ticket = createTicket({ labels: ['ux'] });
        expect(inferTicketType(ticket)).toBe('frontend');
      });

      it('should classify as infrastructure with "infrastructure" label', () => {
        const ticket = createTicket({ labels: ['infrastructure'] });
        expect(inferTicketType(ticket)).toBe('infrastructure');
      });

      it('should classify as infrastructure with "devops" label', () => {
        const ticket = createTicket({ labels: ['devops'] });
        expect(inferTicketType(ticket)).toBe('infrastructure');
      });

      it('should classify as infrastructure with "deployment" label', () => {
        const ticket = createTicket({ labels: ['deployment'] });
        expect(inferTicketType(ticket)).toBe('infrastructure');
      });

      it('should handle case-insensitive labels', () => {
        expect(inferTicketType(createTicket({ labels: ['BACKEND'] }))).toBe('backend');
        expect(inferTicketType(createTicket({ labels: ['Frontend'] }))).toBe('frontend');
        expect(inferTicketType(createTicket({ labels: ['Infrastructure'] }))).toBe('infrastructure');
      });

      it('should handle mixed labels and return first match', () => {
        const ticket = createTicket({ labels: ['backend', 'urgent', 'bug'] });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should prioritize backend when multiple type labels exist', () => {
        const ticket = createTicket({ labels: ['backend', 'frontend'] });
        expect(inferTicketType(ticket)).toBe('backend');
      });
    });

    describe('Description and issue type analysis', () => {
      it('should classify as backend based on API keywords in description', () => {
        const ticket = createTicket({
          description: 'Implement REST API endpoint for user authentication',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should classify as backend based on database keywords', () => {
        const ticket = createTicket({
          description: 'Add database migration for new user table',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should classify as frontend based on UI keywords in description', () => {
        const ticket = createTicket({
          description: 'Create new React component for user profile page',
        });
        expect(inferTicketType(ticket)).toBe('frontend');
      });

      it('should classify as frontend based on styling keywords', () => {
        const ticket = createTicket({
          description: 'Update CSS styling for the login form',
        });
        expect(inferTicketType(ticket)).toBe('frontend');
      });

      it('should classify as infrastructure based on deployment keywords', () => {
        const ticket = createTicket({
          description: 'Set up CI/CD pipeline for automated deployment',
        });
        expect(inferTicketType(ticket)).toBe('infrastructure');
      });

      it('should classify as infrastructure based on Docker keywords', () => {
        const ticket = createTicket({
          description: 'Create Dockerfile and Kubernetes manifests',
        });
        expect(inferTicketType(ticket)).toBe('infrastructure');
      });

      it('should analyze both summary and description', () => {
        const ticket = createTicket({
          summary: 'API endpoint implementation',
          description: 'Some generic description',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should use keyword scoring when multiple types mentioned', () => {
        const ticket = createTicket({
          description: 'Create API endpoint and add UI button',
        });
        // Both backend (API) and frontend (UI, button) keywords present
        // Should return the one with higher score or first match
        const result = inferTicketType(ticket);
        expect(['backend', 'frontend']).toContain(result);
      });
    });

    describe('Priority order', () => {
      it('should prioritize explicit type over labels', () => {
        const ticket = createTicket({ labels: ['backend'] });
        expect(inferTicketType(ticket, 'frontend')).toBe('frontend');
      });

      it('should prioritize explicit type over description', () => {
        const ticket = createTicket({
          description: 'Implement REST API endpoint',
        });
        expect(inferTicketType(ticket, 'infrastructure')).toBe('infrastructure');
      });

      it('should prioritize labels over description', () => {
        const ticket = createTicket({
          labels: ['frontend'],
          description: 'Implement REST API endpoint',
        });
        expect(inferTicketType(ticket)).toBe('frontend');
      });
    });

    describe('Default behavior', () => {
      it('should default to backend when no indicators present', () => {
        const ticket = createTicket({
          labels: [],
          description: 'Generic task',
          summary: 'Do something',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should default to backend with empty strings', () => {
        const ticket = createTicket({
          labels: [],
          description: '',
          summary: '',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });

      it('should default to backend with non-matching labels', () => {
        const ticket = createTicket({
          labels: ['urgent', 'bug', 'high-priority'],
          description: 'Fix the issue',
        });
        expect(inferTicketType(ticket)).toBe('backend');
      });
    });
  });
});
