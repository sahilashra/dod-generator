import * as fc from 'fast-check';
import { DoDGenerator } from './DoDGenerator';
import { JiraTicket, MergeRequest } from '../models/types';

// Generators for property-based testing
const jiraTicketArbitrary: fc.Arbitrary<JiraTicket> = fc.record({
  key: fc.string({ minLength: 1 }),
  summary: fc.string(),
  description: fc.string(),
  labels: fc.array(fc.string()),
  issueType: fc.string({ minLength: 1 }),
  linkedIssues: fc.array(fc.string()),
  acceptanceCriteria: fc.option(fc.array(fc.string()), { nil: undefined }),
});

const mergeRequestArbitrary: fc.Arbitrary<MergeRequest> = fc.record({
  title: fc.string(),
  ciStatus: fc.constantFrom('passed', 'failed', 'running', 'pending', 'canceled'),
  changedFiles: fc.array(fc.string()),
  webUrl: fc.string(),
});

const ticketTypeArbitrary = fc.constantFrom('backend', 'frontend', 'infrastructure');

describe('DoDGenerator Property-Based Tests', () => {
  let generator: DoDGenerator;

  beforeEach(() => {
    generator = new DoDGenerator();
  });

  describe('Property 7: Mandatory sections always present', () => {
    // Feature: generate-dod, Property 7: Mandatory sections always present
    // Validates: Requirements 3.2, 5.1, 7.1, 10.1

    it('should always include all mandatory sections for any ticket', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          // Extract section titles
          const sectionTitles = dod.sections.map(s => s.title);

          // Verify all mandatory sections are present
          expect(sectionTitles).toContain('Acceptance Criteria');
          expect(sectionTitles).toContain('Automated Tests');
          expect(sectionTitles).toContain('Manual Test Steps');
          expect(sectionTitles).toContain('Documentation Updates');
          expect(sectionTitles).toContain('Reviewer Checklist');
        }),
        { numRuns: 100 }
      );
    });

    it('should include mandatory sections with MR provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, mergeRequestArbitrary, (ticket, mr) => {
          const dod = generator.generateDoD(ticket, mr);

          const sectionTitles = dod.sections.map(s => s.title);

          // All mandatory sections must be present even with MR
          expect(sectionTitles).toContain('Acceptance Criteria');
          expect(sectionTitles).toContain('Automated Tests');
          expect(sectionTitles).toContain('Manual Test Steps');
          expect(sectionTitles).toContain('Documentation Updates');
          expect(sectionTitles).toContain('Reviewer Checklist');
        }),
        { numRuns: 100 }
      );
    });

    it('should include mandatory sections with explicit ticket type', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, ticketTypeArbitrary, (ticket, ticketType) => {
          const dod = generator.generateDoD(ticket, undefined, ticketType);

          const sectionTitles = dod.sections.map(s => s.title);

          // All mandatory sections must be present regardless of type
          expect(sectionTitles).toContain('Acceptance Criteria');
          expect(sectionTitles).toContain('Automated Tests');
          expect(sectionTitles).toContain('Manual Test Steps');
          expect(sectionTitles).toContain('Documentation Updates');
          expect(sectionTitles).toContain('Reviewer Checklist');
        }),
        { numRuns: 100 }
      );
    });

    it('should have at least 5 sections (the mandatory ones)', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          // At minimum, we should have 5 mandatory sections
          expect(dod.sections.length).toBeGreaterThanOrEqual(5);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Type-specific sections for backend tickets', () => {
    // Feature: generate-dod, Property 8: Type-specific sections for backend tickets
    // Validates: Requirements 3.3, 5.2, 7.3, 10.2

    it('should include API Contract Changes section for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('API Contract Changes');
        }),
        { numRuns: 100 }
      );
    });

    it('should include Monitoring and Logging section for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('Monitoring and Logging');
        }),
        { numRuns: 100 }
      );
    });

    it('should include Rollback and Migration Notes section for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('Rollback and Migration Notes');
        }),
        { numRuns: 100 }
      );
    });

    it('should include all three backend-specific sections for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // All three backend-specific sections must be present
          expect(sectionTitles).toContain('API Contract Changes');
          expect(sectionTitles).toContain('Monitoring and Logging');
          expect(sectionTitles).toContain('Rollback and Migration Notes');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include backend-specific sections for non-backend tickets', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          fc.constantFrom('frontend', 'infrastructure'),
          (ticket, ticketType) => {
            const dod = generator.generateDoD(ticket, undefined, ticketType);

            const sectionTitles = dod.sections.map(s => s.title);
            
            // Backend-specific sections should NOT be present
            expect(sectionTitles).not.toContain('API Contract Changes');
            expect(sectionTitles).not.toContain('Monitoring and Logging');
            expect(sectionTitles).not.toContain('Rollback and Migration Notes');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include API endpoint testing prompts in manual test section for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
          expect(manualTestSection).toBeDefined();

          // Extract all items from the manual test section
          const allItems = manualTestSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention API endpoint testing
          expect(combinedText).toMatch(/api|endpoint/);
        }),
        { numRuns: 100 }
      );
    });

    it('should emphasize unit and integration tests for backend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
          expect(testingSection).toBeDefined();

          // Extract all items from the testing section
          const allItems = testingSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should emphasize backend-specific testing (business logic, API endpoints, database)
          expect(combinedText).toMatch(/business logic|api|database|service/);
        }),
        { numRuns: 100 }
      );
    });

    it('should have backend-specific sections appear before Reviewer Checklist', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const sectionTitles = dod.sections.map(s => s.title);
          
          const reviewerChecklistIndex = sectionTitles.indexOf('Reviewer Checklist');
          const apiContractIndex = sectionTitles.indexOf('API Contract Changes');
          const monitoringIndex = sectionTitles.indexOf('Monitoring and Logging');
          const rollbackIndex = sectionTitles.indexOf('Rollback and Migration Notes');

          // All backend-specific sections should appear before Reviewer Checklist
          expect(apiContractIndex).toBeLessThan(reviewerChecklistIndex);
          expect(monitoringIndex).toBeLessThan(reviewerChecklistIndex);
          expect(rollbackIndex).toBeLessThan(reviewerChecklistIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in API Contract Changes section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const apiSection = dod.sections.find(s => s.title === 'API Contract Changes');
          expect(apiSection).toBeDefined();
          expect(apiSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = apiSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention API documentation, endpoints, or schemas
          expect(combinedText).toMatch(/api|endpoint|schema|documentation/);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in Monitoring and Logging section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const monitoringSection = dod.sections.find(s => s.title === 'Monitoring and Logging');
          expect(monitoringSection).toBeDefined();
          expect(monitoringSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = monitoringSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention logging, monitoring, or metrics
          expect(combinedText).toMatch(/log|monitor|metric|observability/);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in Rollback and Migration Notes section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'backend');

          const rollbackSection = dod.sections.find(s => s.title === 'Rollback and Migration Notes');
          expect(rollbackSection).toBeDefined();
          expect(rollbackSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = rollbackSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention rollback, migration, or deployment
          expect(combinedText).toMatch(/rollback|migration|deployment/);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Type-specific sections for frontend tickets', () => {
    // Feature: generate-dod, Property 9: Type-specific sections for frontend tickets
    // Validates: Requirements 3.4, 5.3, 7.2

    it('should include UI/UX Validation section for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('UI/UX Validation');
        }),
        { numRuns: 100 }
      );
    });

    it('should include Accessibility Compliance section for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('Accessibility Compliance');
        }),
        { numRuns: 100 }
      );
    });

    it('should include both frontend-specific sections for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // Both frontend-specific sections must be present
          expect(sectionTitles).toContain('UI/UX Validation');
          expect(sectionTitles).toContain('Accessibility Compliance');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include frontend-specific sections for non-frontend tickets', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          fc.constantFrom('backend', 'infrastructure'),
          (ticket, ticketType) => {
            const dod = generator.generateDoD(ticket, undefined, ticketType);

            const sectionTitles = dod.sections.map(s => s.title);
            
            // Frontend-specific sections should NOT be present
            expect(sectionTitles).not.toContain('UI/UX Validation');
            expect(sectionTitles).not.toContain('Accessibility Compliance');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include UI interaction testing prompts in manual test section for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
          expect(manualTestSection).toBeDefined();

          // Extract all items from the manual test section
          const allItems = manualTestSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention UI interaction testing
          expect(combinedText).toMatch(/ui|browser|responsive|keyboard|visual/);
        }),
        { numRuns: 100 }
      );
    });

    it('should emphasize component and e2e tests for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
          expect(testingSection).toBeDefined();

          // Extract all items from the testing section
          const allItems = testingSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should emphasize frontend-specific testing (component, UI, interactions)
          expect(combinedText).toMatch(/component|ui|interaction|user/);
        }),
        { numRuns: 100 }
      );
    });

    it('should have frontend-specific sections appear before Reviewer Checklist', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const sectionTitles = dod.sections.map(s => s.title);
          
          const reviewerChecklistIndex = sectionTitles.indexOf('Reviewer Checklist');
          const uiUxIndex = sectionTitles.indexOf('UI/UX Validation');
          const accessibilityIndex = sectionTitles.indexOf('Accessibility Compliance');

          // All frontend-specific sections should appear before Reviewer Checklist
          expect(uiUxIndex).toBeLessThan(reviewerChecklistIndex);
          expect(accessibilityIndex).toBeLessThan(reviewerChecklistIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in UI/UX Validation section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const uiUxSection = dod.sections.find(s => s.title === 'UI/UX Validation');
          expect(uiUxSection).toBeDefined();
          expect(uiUxSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = uiUxSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention UI/UX, design, styling, or visual elements
          expect(combinedText).toMatch(/ui|ux|design|styling|visual|mockup|animation/);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in Accessibility Compliance section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const accessibilitySection = dod.sections.find(s => s.title === 'Accessibility Compliance');
          expect(accessibilitySection).toBeDefined();
          expect(accessibilitySection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = accessibilitySection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention accessibility, ARIA, keyboard, screen reader, or WCAG
          expect(combinedText).toMatch(/accessibility|aria|keyboard|screen reader|wcag|semantic|contrast/);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include backend-specific sections for frontend tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'frontend');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // Backend-specific sections should NOT be present
          expect(sectionTitles).not.toContain('API Contract Changes');
          expect(sectionTitles).not.toContain('Monitoring and Logging');
          expect(sectionTitles).not.toContain('Rollback and Migration Notes');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Type-specific sections for infrastructure tickets', () => {
    // Feature: generate-dod, Property 10: Type-specific sections for infrastructure tickets
    // Validates: Requirements 3.5, 10.4

    it('should include Deployment Procedures section for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('Deployment Procedures');
        }),
        { numRuns: 100 }
      );
    });

    it('should include Infrastructure Validation section for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          expect(sectionTitles).toContain('Infrastructure Validation');
        }),
        { numRuns: 100 }
      );
    });

    it('should include both infrastructure-specific sections for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // Both infrastructure-specific sections must be present
          expect(sectionTitles).toContain('Deployment Procedures');
          expect(sectionTitles).toContain('Infrastructure Validation');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include infrastructure-specific sections for non-infrastructure tickets', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          fc.constantFrom('backend', 'frontend'),
          (ticket, ticketType) => {
            const dod = generator.generateDoD(ticket, undefined, ticketType);

            const sectionTitles = dod.sections.map(s => s.title);
            
            // Infrastructure-specific sections should NOT be present
            expect(sectionTitles).not.toContain('Deployment Procedures');
            expect(sectionTitles).not.toContain('Infrastructure Validation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include runbook update prompts in documentation section for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
          expect(docSection).toBeDefined();

          // Extract all items from the documentation section
          const allItems = docSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention runbook updates
          expect(combinedText).toMatch(/runbook/);
        }),
        { numRuns: 100 }
      );
    });

    it('should have infrastructure-specific sections appear before Reviewer Checklist', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          
          const reviewerChecklistIndex = sectionTitles.indexOf('Reviewer Checklist');
          const deploymentIndex = sectionTitles.indexOf('Deployment Procedures');
          const infraValidationIndex = sectionTitles.indexOf('Infrastructure Validation');

          // All infrastructure-specific sections should appear before Reviewer Checklist
          expect(deploymentIndex).toBeLessThan(reviewerChecklistIndex);
          expect(infraValidationIndex).toBeLessThan(reviewerChecklistIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in Deployment Procedures section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const deploymentSection = dod.sections.find(s => s.title === 'Deployment Procedures');
          expect(deploymentSection).toBeDefined();
          expect(deploymentSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = deploymentSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention deployment, rollback, or staging
          expect(combinedText).toMatch(/deployment|rollback|staging/);
        }),
        { numRuns: 100 }
      );
    });

    it('should include appropriate content in Infrastructure Validation section', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const infraValidationSection = dod.sections.find(s => s.title === 'Infrastructure Validation');
          expect(infraValidationSection).toBeDefined();
          expect(infraValidationSection!.rows.length).toBeGreaterThan(0);

          // Extract all items
          const allItems = infraValidationSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention infrastructure, monitoring, security, or validation
          expect(combinedText).toMatch(/infrastructure|monitoring|security|validation|backup/);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include backend-specific sections for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // Backend-specific sections should NOT be present
          expect(sectionTitles).not.toContain('API Contract Changes');
          expect(sectionTitles).not.toContain('Monitoring and Logging');
          expect(sectionTitles).not.toContain('Rollback and Migration Notes');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include frontend-specific sections for infrastructure tickets', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

          const sectionTitles = dod.sections.map(s => s.title);
          
          // Frontend-specific sections should NOT be present
          expect(sectionTitles).not.toContain('UI/UX Validation');
          expect(sectionTitles).not.toContain('Accessibility Compliance');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Acceptance criteria row mapping', () => {
    // Feature: generate-dod, Property 11: Acceptance criteria row mapping
    // Validates: Requirements 4.1

    it('should create exactly N rows for N acceptance criteria', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          (key, summary, description, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary,
              description,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the acceptance criteria section
            const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');
            expect(acSection).toBeDefined();

            // Should have exactly N rows for N acceptance criteria
            expect(acSection!.rows.length).toBe(acceptanceCriteria.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map each acceptance criterion to its own row', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary.filter((t): t is JiraTicket => !!t.acceptanceCriteria && t.acceptanceCriteria.length > 0),
          (ticket) => {
            const dod = generator.generateDoD(ticket);

            const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');
            expect(acSection).toBeDefined();

            // Each row should contain exactly one item (one criterion)
            acSection!.rows.forEach((row, index) => {
              expect(row.items.length).toBe(1);
              expect(row.items[0]).toBe(ticket.acceptanceCriteria![index]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve acceptance criteria content without modification', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary.filter((t): t is JiraTicket => !!t.acceptanceCriteria && t.acceptanceCriteria.length > 0),
          (ticket) => {
            const dod = generator.generateDoD(ticket);

            const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');
            expect(acSection).toBeDefined();

            // Extract all items from rows
            const extractedCriteria = acSection!.rows.flatMap(row => row.items);

            // Should match original acceptance criteria exactly
            expect(extractedCriteria).toEqual(ticket.acceptanceCriteria);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create placeholder row when no acceptance criteria exist', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary.filter((t): t is JiraTicket => !t.acceptanceCriteria || t.acceptanceCriteria.length === 0),
          (ticket) => {
            const dod = generator.generateDoD(ticket);

            const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');
            expect(acSection).toBeDefined();

            // Should have exactly 1 placeholder row
            expect(acSection!.rows.length).toBe(1);
            expect(acSection!.rows[0].items[0]).toContain('Manual review needed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark all acceptance criteria rows as unchecked initially', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');
          expect(acSection).toBeDefined();

          // All rows should be unchecked
          acSection!.rows.forEach(row => {
            expect(row.checked).toBe(false);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});


describe('DoDGenerator Unit Tests', () => {
  let generator: DoDGenerator;

  beforeEach(() => {
    generator = new DoDGenerator();
  });

  describe('Section generation with various ticket inputs', () => {
    it('should generate DoD for backend ticket with acceptance criteria', () => {
      const ticket: JiraTicket = {
        key: 'BACK-123',
        summary: 'Implement user authentication API',
        description: 'Add JWT-based authentication',
        labels: ['backend', 'api'],
        issueType: 'Story',
        linkedIssues: [],
        acceptanceCriteria: [
          'User can login with valid credentials',
          'Invalid credentials return 401 error',
          'JWT token is returned on successful login',
        ],
      };

      const dod = generator.generateDoD(ticket);

      expect(dod.metadata.ticketKey).toBe('BACK-123');
      expect(dod.metadata.ticketType).toBe('backend');
      expect(dod.sections.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate DoD for frontend ticket', () => {
      const ticket: JiraTicket = {
        key: 'FRONT-456',
        summary: 'Create login form component',
        description: 'Build React login form',
        labels: ['frontend', 'ui'],
        issueType: 'Story',
        linkedIssues: [],
        acceptanceCriteria: ['Form validates email format', 'Form shows error messages'],
      };

      const dod = generator.generateDoD(ticket, undefined, 'frontend');

      expect(dod.metadata.ticketKey).toBe('FRONT-456');
      expect(dod.metadata.ticketType).toBe('frontend');
      expect(dod.sections.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate DoD for infrastructure ticket', () => {
      const ticket: JiraTicket = {
        key: 'INFRA-789',
        summary: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions',
        labels: ['infrastructure', 'devops'],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket, undefined, 'infrastructure');

      expect(dod.metadata.ticketKey).toBe('INFRA-789');
      expect(dod.metadata.ticketType).toBe('infrastructure');
      expect(dod.sections.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate DoD with merge request', () => {
      const ticket: JiraTicket = {
        key: 'TEST-100',
        summary: 'Test ticket',
        description: 'Test description',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const mr: MergeRequest = {
        title: 'Add feature X',
        ciStatus: 'passed',
        changedFiles: ['src/feature.ts', 'src/feature.test.ts'],
        webUrl: 'https://gitlab.com/project/-/merge_requests/1',
      };

      const dod = generator.generateDoD(ticket, mr);

      expect(dod.metadata.ticketKey).toBe('TEST-100');
      expect(dod.sections.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Acceptance criteria mapping with different numbers of criteria', () => {
    it('should handle ticket with no acceptance criteria', () => {
      const ticket: JiraTicket = {
        key: 'NO-AC-1',
        summary: 'Ticket without AC',
        description: 'No acceptance criteria',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');

      expect(acSection).toBeDefined();
      expect(acSection!.rows.length).toBe(1);
      expect(acSection!.rows[0].items[0]).toContain('Manual review needed');
    });

    it('should handle ticket with single acceptance criterion', () => {
      const ticket: JiraTicket = {
        key: 'ONE-AC-1',
        summary: 'Ticket with one AC',
        description: 'Single criterion',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
        acceptanceCriteria: ['User can perform action X'],
      };

      const dod = generator.generateDoD(ticket);
      const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');

      expect(acSection).toBeDefined();
      expect(acSection!.rows.length).toBe(1);
      expect(acSection!.rows[0].items[0]).toBe('User can perform action X');
    });

    it('should handle ticket with multiple acceptance criteria', () => {
      const ticket: JiraTicket = {
        key: 'MULTI-AC-1',
        summary: 'Ticket with multiple AC',
        description: 'Multiple criteria',
        labels: [],
        issueType: 'Story',
        linkedIssues: [],
        acceptanceCriteria: [
          'Criterion 1',
          'Criterion 2',
          'Criterion 3',
          'Criterion 4',
          'Criterion 5',
        ],
      };

      const dod = generator.generateDoD(ticket);
      const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');

      expect(acSection).toBeDefined();
      expect(acSection!.rows.length).toBe(5);
      expect(acSection!.rows[0].items[0]).toBe('Criterion 1');
      expect(acSection!.rows[4].items[0]).toBe('Criterion 5');
    });

    it('should handle empty acceptance criteria array', () => {
      const ticket: JiraTicket = {
        key: 'EMPTY-AC-1',
        summary: 'Ticket with empty AC array',
        description: 'Empty array',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
        acceptanceCriteria: [],
      };

      const dod = generator.generateDoD(ticket);
      const acSection = dod.sections.find(s => s.title === 'Acceptance Criteria');

      expect(acSection).toBeDefined();
      expect(acSection!.rows.length).toBe(1);
      expect(acSection!.rows[0].items[0]).toContain('Manual review needed');
    });
  });

  describe('All mandatory sections are present', () => {
    it('should always include Acceptance Criteria section', () => {
      const ticket: JiraTicket = {
        key: 'TEST-1',
        summary: 'Test',
        description: 'Test',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const section = dod.sections.find(s => s.title === 'Acceptance Criteria');

      expect(section).toBeDefined();
      expect(section!.rows.length).toBeGreaterThan(0);
    });

    it('should always include Automated Tests section', () => {
      const ticket: JiraTicket = {
        key: 'TEST-2',
        summary: 'Test',
        description: 'Test',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const section = dod.sections.find(s => s.title === 'Automated Tests');

      expect(section).toBeDefined();
      expect(section!.rows.length).toBeGreaterThan(0);
      // Should have unit, integration, and e2e test rows
      expect(section!.rows.length).toBe(3);
    });

    it('should always include Manual Test Steps section', () => {
      const ticket: JiraTicket = {
        key: 'TEST-3',
        summary: 'Test',
        description: 'Test',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const section = dod.sections.find(s => s.title === 'Manual Test Steps');

      expect(section).toBeDefined();
      expect(section!.rows.length).toBeGreaterThan(0);
    });

    it('should always include Documentation Updates section', () => {
      const ticket: JiraTicket = {
        key: 'TEST-4',
        summary: 'Test',
        description: 'Test',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const section = dod.sections.find(s => s.title === 'Documentation Updates');

      expect(section).toBeDefined();
      expect(section!.rows.length).toBeGreaterThan(0);
    });

    it('should always include Reviewer Checklist section', () => {
      const ticket: JiraTicket = {
        key: 'TEST-5',
        summary: 'Test',
        description: 'Test',
        labels: [],
        issueType: 'Task',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);
      const section = dod.sections.find(s => s.title === 'Reviewer Checklist');

      expect(section).toBeDefined();
      expect(section!.rows.length).toBeGreaterThan(0);
    });

    it('should include metadata with correct fields', () => {
      const ticket: JiraTicket = {
        key: 'META-1',
        summary: 'Test metadata',
        description: 'Test',
        labels: ['backend'],
        issueType: 'Story',
        linkedIssues: [],
      };

      const dod = generator.generateDoD(ticket);

      expect(dod.metadata.ticketKey).toBe('META-1');
      expect(dod.metadata.ticketType).toBe('backend');
      expect(dod.metadata.generatedAt).toBeDefined();
      expect(new Date(dod.metadata.generatedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Property 12: API-related conditional content', () => {
    // Feature: generate-dod, Property 12: API-related conditional content
    // Validates: Requirements 5.4

    it('should include API Contract Testing when ticket mentions API-related terms', () => {
      const apiTerms = ['api', 'endpoint', 'rest', 'graphql', 'http', 'request', 'response', 'webhook', 'microservice'];
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(...apiTerms),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, apiTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            // Create a ticket with API-related content in summary or description
            const useInSummary = Math.random() > 0.5;
            const ticket: JiraTicket = {
              key,
              summary: useInSummary ? `Implement ${apiTerm} functionality` : 'Regular ticket',
              description: useInSummary ? restOfDescription : `This ticket involves ${apiTerm} ${restOfDescription}`,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Automated Tests section
            const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
            expect(testingSection).toBeDefined();

            // Extract all categories from the testing section
            const categories = testingSection!.rows.map(row => row.category);

            // Should include API Contract Testing
            expect(categories).toContain('API Contract Testing');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include API Contract Testing when ticket has no API-related terms', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const apiTerms = ['api', 'endpoint', 'rest', 'graphql', 'http', 'request', 'response', 'webhook', 'microservice'];
            return !apiTerms.some(term => lower.includes(term));
          }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const apiTerms = ['api', 'endpoint', 'rest', 'graphql', 'http', 'request', 'response', 'webhook', 'microservice'];
            return !apiTerms.some(term => lower.includes(term));
          }),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, summary, description, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary,
              description,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Automated Tests section
            const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
            expect(testingSection).toBeDefined();

            // Extract all categories from the testing section
            const categories = testingSection!.rows.map(row => row.category);

            // Should NOT include API Contract Testing
            expect(categories).not.toContain('API Contract Testing');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include API Contract Testing with appropriate content', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          fc.constantFrom('api', 'endpoint', 'rest', 'graphql'),
          (ticket, apiTerm) => {
            // Modify ticket to include API-related term
            const modifiedTicket: JiraTicket = {
              ...ticket,
              description: `${ticket.description} This involves ${apiTerm} integration`,
            };

            const dod = generator.generateDoD(modifiedTicket);

            // Find the Automated Tests section
            const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
            expect(testingSection).toBeDefined();

            // Find the API Contract Testing row
            const apiTestingRow = testingSection!.rows.find(row => row.category === 'API Contract Testing');
            expect(apiTestingRow).toBeDefined();

            // Should have items describing API contract testing
            expect(apiTestingRow!.items.length).toBeGreaterThan(0);

            // Extract all items
            const allItems = apiTestingRow!.items;
            const combinedText = allItems.join(' ').toLowerCase();

            // Should mention API, contract, schema, or endpoint
            expect(combinedText).toMatch(/api|contract|schema|endpoint|request|response/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect API terms case-insensitively', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom('API', 'Api', 'api', 'REST', 'Rest', 'rest', 'ENDPOINT', 'Endpoint', 'endpoint'),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, apiTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary: `Implement ${apiTerm} functionality`,
              description: restOfDescription,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Automated Tests section
            const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
            expect(testingSection).toBeDefined();

            // Extract all categories from the testing section
            const categories = testingSection!.rows.map(row => row.category);

            // Should include API Contract Testing regardless of case
            expect(categories).toContain('API Contract Testing');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include API Contract Testing for any ticket type when API terms present', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          ticketTypeArbitrary,
          (ticket, ticketType) => {
            // Modify ticket to include API-related term
            const modifiedTicket: JiraTicket = {
              ...ticket,
              summary: `${ticket.summary} API endpoint`,
            };

            const dod = generator.generateDoD(modifiedTicket, undefined, ticketType);

            // Find the Automated Tests section
            const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
            expect(testingSection).toBeDefined();

            // Extract all categories from the testing section
            const categories = testingSection!.rows.map(row => row.category);

            // Should include API Contract Testing regardless of ticket type
            expect(categories).toContain('API Contract Testing');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add API Contract Testing row in addition to standard test rows', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          ticketTypeArbitrary,
          (ticket, ticketType) => {
            // Create two versions: one with API terms, one without
            const ticketWithoutApi: JiraTicket = {
              ...ticket,
              summary: 'Regular feature',
              description: 'Regular description',
            };

            const ticketWithApi: JiraTicket = {
              ...ticket,
              summary: 'API feature',
              description: 'Regular description',
            };

            const dodWithoutApi = generator.generateDoD(ticketWithoutApi, undefined, ticketType);
            const dodWithApi = generator.generateDoD(ticketWithApi, undefined, ticketType);

            const testingSectionWithoutApi = dodWithoutApi.sections.find(s => s.title === 'Automated Tests');
            const testingSectionWithApi = dodWithApi.sections.find(s => s.title === 'Automated Tests');

            expect(testingSectionWithoutApi).toBeDefined();
            expect(testingSectionWithApi).toBeDefined();

            // The version with API should have one more row than the version without
            expect(testingSectionWithApi!.rows.length).toBe(testingSectionWithoutApi!.rows.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Feature-related conditional content', () => {
    // Feature: generate-dod, Property 13: Feature-related conditional content
    // Validates: Requirements 10.3

    it('should include user-facing documentation prompts when issue type is Story', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          fc.string(),
          fc.array(fc.string()),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, summary, description, labels, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary,
              description,
              labels,
              issueType: 'Story',
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Documentation Updates section
            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items from the documentation section
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include prompts for user-facing documentation
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include user-facing documentation prompts when ticket mentions new features', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom('new feature', 'feature', 'enhancement', 'capability'),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }).filter(t => t.toLowerCase() !== 'story'),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, featureTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            // Create a ticket with feature-related content in summary or description
            const useInSummary = Math.random() > 0.5;
            const ticket: JiraTicket = {
              key,
              summary: useInSummary ? `Implement ${featureTerm} for users` : 'Regular ticket',
              description: useInSummary ? restOfDescription : `This ticket involves ${featureTerm} ${restOfDescription}`,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Documentation Updates section
            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items from the documentation section
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include prompts for user-facing documentation
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include user-facing documentation prompts when ticket is not a feature story', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const featureTerms = ['new feature', 'feature', 'user story', 'enhancement', 'capability'];
            return !featureTerms.some(term => lower.includes(term));
          }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const featureTerms = ['new feature', 'feature', 'user story', 'enhancement', 'capability'];
            return !featureTerms.some(term => lower.includes(term));
          }),
          fc.array(fc.string()),
          fc.constantFrom('Task', 'Bug', 'Subtask', 'Epic'),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, summary, description, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary,
              description,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Documentation Updates section
            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items from the documentation section
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should NOT include prompts for user-facing documentation
            expect(combinedText).not.toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect feature terms case-insensitively', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom('FEATURE', 'Feature', 'feature', 'NEW FEATURE', 'New Feature', 'new feature'),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }).filter(t => t.toLowerCase() !== 'story'),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, featureTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary: `Implement ${featureTerm} functionality`,
              description: restOfDescription,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Documentation Updates section
            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items from the documentation section
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include prompts for user-facing documentation regardless of case
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include user-facing documentation prompts for any ticket type when feature terms present', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          ticketTypeArbitrary,
          (ticket, ticketType) => {
            // Modify ticket to include feature-related term
            const modifiedTicket: JiraTicket = {
              ...ticket,
              summary: `${ticket.summary} new feature`,
            };

            const dod = generator.generateDoD(modifiedTicket, undefined, ticketType);

            // Find the Documentation Updates section
            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items from the documentation section
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include prompts for user-facing documentation regardless of ticket type
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add user-facing documentation items in addition to standard documentation items', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            // Create two versions: one with feature terms, one without
            const ticketWithoutFeature: JiraTicket = {
              ...ticket,
              summary: 'Regular task',
              description: 'Regular description',
              issueType: 'Task',
            };

            const ticketWithFeature: JiraTicket = {
              ...ticket,
              summary: 'New feature task',
              description: 'Regular description',
              issueType: 'Story',
            };

            const dodWithoutFeature = generator.generateDoD(ticketWithoutFeature);
            const dodWithFeature = generator.generateDoD(ticketWithFeature);

            const docSectionWithoutFeature = dodWithoutFeature.sections.find(s => s.title === 'Documentation Updates');
            const docSectionWithFeature = dodWithFeature.sections.find(s => s.title === 'Documentation Updates');

            expect(docSectionWithoutFeature).toBeDefined();
            expect(docSectionWithFeature).toBeDefined();

            // Extract all items
            const itemsWithoutFeature = docSectionWithoutFeature!.rows.flatMap(row => row.items);
            const itemsWithFeature = docSectionWithFeature!.rows.flatMap(row => row.items);

            // The version with feature should have more items than the version without
            expect(itemsWithFeature.length).toBeGreaterThan(itemsWithoutFeature.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include both standard and user-facing documentation items for feature stories', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            const featureTicket: JiraTicket = {
              ...ticket,
              issueType: 'Story',
            };

            const dod = generator.generateDoD(featureTicket);

            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include both standard documentation (README, API docs)
            expect(combinedText).toMatch(/readme|api|documentation/);

            // AND user-facing documentation
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect "user story" as a feature term', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            const modifiedTicket: JiraTicket = {
              ...ticket,
              description: `${ticket.description} This is a user story for implementing new functionality`,
              issueType: 'Task',
            };

            const dod = generator.generateDoD(modifiedTicket);

            const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
            expect(docSection).toBeDefined();

            // Extract all items
            const allItems = docSection!.rows.flatMap(row => row.items);
            const combinedText = allItems.join(' ').toLowerCase();

            // Should include prompts for user-facing documentation
            expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Data change conditional content', () => {
    // Feature: generate-dod, Property 14: Data change conditional content
    // Validates: Requirements 7.4

    it('should include data validation prompts when ticket mentions data-related terms', () => {
      const dataTerms = ['database', 'schema', 'migration', 'data', 'table', 'column', 'index', 'query', 'sql', 'nosql', 'collection', 'document'];
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(...dataTerms),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, dataTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            // Create a ticket with data-related content in summary or description
            const useInSummary = Math.random() > 0.5;
            const ticket: JiraTicket = {
              key,
              summary: useInSummary ? `Update ${dataTerm} for feature` : 'Regular ticket',
              description: useInSummary ? restOfDescription : `This ticket involves ${dataTerm} changes ${restOfDescription}`,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Manual Test Steps section
            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            // Extract all categories from the manual test section
            const categories = manualTestSection!.rows.map(row => row.category);

            // Should include Data Validation
            expect(categories).toContain('Data Validation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include data validation prompts when ticket has no data-related terms', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const dataTerms = ['database', 'schema', 'migration', 'data', 'table', 'column', 'index', 'query', 'sql', 'nosql', 'collection', 'document'];
            return !dataTerms.some(term => lower.includes(term));
          }),
          fc.string().filter(s => {
            const lower = s.toLowerCase();
            const dataTerms = ['database', 'schema', 'migration', 'data', 'table', 'column', 'index', 'query', 'sql', 'nosql', 'collection', 'document'];
            return !dataTerms.some(term => lower.includes(term));
          }),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, summary, description, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary,
              description,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Manual Test Steps section
            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            // Extract all categories from the manual test section
            const categories = manualTestSection!.rows.map(row => row.category);

            // Should NOT include Data Validation
            expect(categories).not.toContain('Data Validation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data validation prompts with appropriate content', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          fc.constantFrom('database', 'schema', 'migration', 'data'),
          (ticket, dataTerm) => {
            // Modify ticket to include data-related term
            const modifiedTicket: JiraTicket = {
              ...ticket,
              description: `${ticket.description} This involves ${dataTerm} changes`,
            };

            const dod = generator.generateDoD(modifiedTicket);

            // Find the Manual Test Steps section
            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            // Find the Data Validation row
            const dataValidationRow = manualTestSection!.rows.find(row => row.category === 'Data Validation');
            expect(dataValidationRow).toBeDefined();

            // Should have items describing data validation
            expect(dataValidationRow!.items.length).toBeGreaterThan(0);

            // Extract all items
            const allItems = dataValidationRow!.items;
            const combinedText = allItems.join(' ').toLowerCase();

            // Should mention data, validation, integrity, migration, or schema
            expect(combinedText).toMatch(/data|validation|integrity|migration|schema|transformation/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect data terms case-insensitively', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom('DATABASE', 'Database', 'database', 'SCHEMA', 'Schema', 'schema', 'MIGRATION', 'Migration', 'migration'),
          fc.string(),
          fc.array(fc.string()),
          fc.string({ minLength: 1 }),
          fc.array(fc.string()),
          fc.option(fc.array(fc.string()), { nil: undefined }),
          (key, dataTerm, restOfDescription, labels, issueType, linkedIssues, acceptanceCriteria) => {
            const ticket: JiraTicket = {
              key,
              summary: `Update ${dataTerm} for feature`,
              description: restOfDescription,
              labels,
              issueType,
              linkedIssues,
              acceptanceCriteria,
            };

            const dod = generator.generateDoD(ticket);

            // Find the Manual Test Steps section
            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            // Extract all categories from the manual test section
            const categories = manualTestSection!.rows.map(row => row.category);

            // Should include Data Validation regardless of case
            expect(categories).toContain('Data Validation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data validation prompts for any ticket type when data terms present', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          ticketTypeArbitrary,
          (ticket, ticketType) => {
            // Modify ticket to include data-related term
            const modifiedTicket: JiraTicket = {
              ...ticket,
              summary: `${ticket.summary} database migration`,
            };

            const dod = generator.generateDoD(modifiedTicket, undefined, ticketType);

            // Find the Manual Test Steps section
            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            // Extract all categories from the manual test section
            const categories = manualTestSection!.rows.map(row => row.category);

            // Should include Data Validation regardless of ticket type
            expect(categories).toContain('Data Validation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add data validation row in addition to standard manual test rows', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          ticketTypeArbitrary,
          (ticket, ticketType) => {
            // Create two versions: one with data terms, one without
            const ticketWithoutData: JiraTicket = {
              ...ticket,
              summary: 'Regular feature',
              description: 'Regular description',
            };

            const ticketWithData: JiraTicket = {
              ...ticket,
              summary: 'Database feature',
              description: 'Regular description',
            };

            const dodWithoutData = generator.generateDoD(ticketWithoutData, undefined, ticketType);
            const dodWithData = generator.generateDoD(ticketWithData, undefined, ticketType);

            const manualTestSectionWithoutData = dodWithoutData.sections.find(s => s.title === 'Manual Test Steps');
            const manualTestSectionWithData = dodWithData.sections.find(s => s.title === 'Manual Test Steps');

            expect(manualTestSectionWithoutData).toBeDefined();
            expect(manualTestSectionWithData).toBeDefined();

            // The version with data should have one more row than the version without
            expect(manualTestSectionWithData!.rows.length).toBe(manualTestSectionWithoutData!.rows.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data validation prompts mentioning data integrity', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            const modifiedTicket: JiraTicket = {
              ...ticket,
              description: `${ticket.description} This involves database schema changes`,
            };

            const dod = generator.generateDoD(modifiedTicket);

            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            const dataValidationRow = manualTestSection!.rows.find(row => row.category === 'Data Validation');
            expect(dataValidationRow).toBeDefined();

            // Extract all items
            const allItems = dataValidationRow!.items;
            const combinedText = allItems.join(' ').toLowerCase();

            // Should specifically mention data integrity
            expect(combinedText).toContain('data integrity');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data validation prompts mentioning migration scripts', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            const modifiedTicket: JiraTicket = {
              ...ticket,
              summary: `${ticket.summary} migration`,
            };

            const dod = generator.generateDoD(modifiedTicket);

            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            const dataValidationRow = manualTestSection!.rows.find(row => row.category === 'Data Validation');
            expect(dataValidationRow).toBeDefined();

            // Extract all items
            const allItems = dataValidationRow!.items;
            const combinedText = allItems.join(' ').toLowerCase();

            // Should mention migration scripts
            expect(combinedText).toMatch(/migration.*script/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include data validation prompts mentioning schema changes', () => {
      fc.assert(
        fc.property(
          jiraTicketArbitrary,
          (ticket) => {
            const modifiedTicket: JiraTicket = {
              ...ticket,
              summary: `${ticket.summary} schema update`,
            };

            const dod = generator.generateDoD(modifiedTicket);

            const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
            expect(manualTestSection).toBeDefined();

            const dataValidationRow = manualTestSection!.rows.find(row => row.category === 'Data Validation');
            expect(dataValidationRow).toBeDefined();

            // Extract all items
            const allItems = dataValidationRow!.items;
            const combinedText = allItems.join(' ').toLowerCase();

            // Should mention schema changes
            expect(combinedText).toMatch(/schema.*change/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect all data-related terms', () => {
      const dataTerms = ['database', 'schema', 'migration', 'data', 'table', 'column', 'index', 'query', 'sql', 'nosql', 'collection', 'document'];
      
      dataTerms.forEach(term => {
        const ticket: JiraTicket = {
          key: 'TEST-1',
          summary: `Update ${term}`,
          description: 'Test description',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });
    });
  });

  describe('Conditional logic unit tests', () => {
    describe('API term detection with various ticket descriptions', () => {
      it('should detect "api" in ticket summary', () => {
        const ticket: JiraTicket = {
          key: 'TEST-1',
          summary: 'Implement API endpoint',
          description: 'Regular description',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "endpoint" in ticket description', () => {
        const ticket: JiraTicket = {
          key: 'TEST-2',
          summary: 'Regular task',
          description: 'Add new endpoint for user management',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "rest" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'TEST-3',
          summary: 'Build REST service',
          description: 'Create REST API for data access',
          labels: [],
          issueType: 'Story',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "graphql" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'TEST-4',
          summary: 'Implement GraphQL resolver',
          description: 'Add GraphQL query support',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "http" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'TEST-5',
          summary: 'Fix HTTP request handling',
          description: 'Improve HTTP error responses',
          labels: [],
          issueType: 'Bug',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "webhook" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'TEST-6',
          summary: 'Add webhook support',
          description: 'Implement webhook notifications',
          labels: [],
          issueType: 'Story',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "microservice" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'TEST-7',
          summary: 'Create microservice',
          description: 'Build new microservice for payments',
          labels: [],
          issueType: 'Story',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should NOT detect API terms when none are present', () => {
        const ticket: JiraTicket = {
          key: 'TEST-8',
          summary: 'Update UI component',
          description: 'Refactor button styling',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).not.toContain('API Contract Testing');
      });

      it('should detect API terms case-insensitively', () => {
        const ticket: JiraTicket = {
          key: 'TEST-9',
          summary: 'Update API',
          description: 'Modify REST endpoint',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });

      it('should detect "request" and "response" terms', () => {
        const ticket: JiraTicket = {
          key: 'TEST-10',
          summary: 'Handle request validation',
          description: 'Validate request and response formats',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const testingSection = dod.sections.find(s => s.title === 'Automated Tests');
        const categories = testingSection!.rows.map(row => row.category);

        expect(categories).toContain('API Contract Testing');
      });
    });

    describe('Feature detection with different issue types', () => {
      it('should detect Story issue type as feature', () => {
        const ticket: JiraTicket = {
          key: 'STORY-1',
          summary: 'Regular task',
          description: 'No feature keywords',
          labels: [],
          issueType: 'Story',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect "new feature" in summary', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-1',
          summary: 'Add new feature for users',
          description: 'Regular description',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect "feature" in description', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-2',
          summary: 'Regular task',
          description: 'This feature will allow users to export data',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect "enhancement" as feature term', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-3',
          summary: 'Enhancement to search functionality',
          description: 'Improve search',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect "capability" as feature term', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-4',
          summary: 'Add new capability',
          description: 'Extend system capabilities',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect "user story" as feature term', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-5',
          summary: 'Regular task',
          description: 'This user story describes new functionality',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should NOT detect feature for Bug issue type without feature keywords', () => {
        const ticket: JiraTicket = {
          key: 'BUG-1',
          summary: 'Fix login error',
          description: 'Resolve authentication issue',
          labels: [],
          issueType: 'Bug',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).not.toMatch(/user-facing|user guide|tutorial/);
      });

      it('should NOT detect feature for Task issue type without feature keywords', () => {
        const ticket: JiraTicket = {
          key: 'TASK-1',
          summary: 'Refactor code',
          description: 'Clean up legacy code',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).not.toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect feature terms case-insensitively', () => {
        const ticket: JiraTicket = {
          key: 'FEAT-6',
          summary: 'NEW FEATURE implementation',
          description: 'Add ENHANCEMENT',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });

      it('should detect Story issue type regardless of case', () => {
        const ticket: JiraTicket = {
          key: 'STORY-2',
          summary: 'Regular task',
          description: 'No keywords',
          labels: [],
          issueType: 'story',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const docSection = dod.sections.find(s => s.title === 'Documentation Updates');
        const allItems = docSection!.rows.flatMap(row => row.items);
        const combinedText = allItems.join(' ').toLowerCase();

        expect(combinedText).toMatch(/user-facing|user guide|tutorial/);
      });
    });

    describe('Data change detection with various keywords', () => {
      it('should detect "database" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-1',
          summary: 'Update database schema',
          description: 'Modify tables',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "schema" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-2',
          summary: 'Schema changes',
          description: 'Update schema definition',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "migration" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-3',
          summary: 'Run data migration',
          description: 'Migrate user data to new format',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "data" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-4',
          summary: 'Process data updates',
          description: 'Handle data transformation',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "table" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-5',
          summary: 'Add new table',
          description: 'Create users table',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "column" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-6',
          summary: 'Add column to table',
          description: 'Add email column',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "index" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-7',
          summary: 'Create database index',
          description: 'Add index for performance',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "query" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-8',
          summary: 'Optimize query performance',
          description: 'Improve SQL query',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "sql" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-9',
          summary: 'Write SQL script',
          description: 'Create SQL migration',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "nosql" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-10',
          summary: 'Setup NoSQL database',
          description: 'Configure MongoDB',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "collection" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-11',
          summary: 'Create collection',
          description: 'Add new MongoDB collection',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect "document" in ticket', () => {
        const ticket: JiraTicket = {
          key: 'DATA-12',
          summary: 'Update document structure',
          description: 'Modify document schema',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should NOT detect data terms when none are present', () => {
        const ticket: JiraTicket = {
          key: 'UI-1',
          summary: 'Update button style',
          description: 'Change button color',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).not.toContain('Data Validation');
      });

      it('should detect data terms case-insensitively', () => {
        const ticket: JiraTicket = {
          key: 'DATA-13',
          summary: 'DATABASE migration',
          description: 'Run SCHEMA update',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });

      it('should detect data terms in both summary and description', () => {
        const ticket: JiraTicket = {
          key: 'DATA-14',
          summary: 'Regular task',
          description: 'This involves database changes',
          labels: [],
          issueType: 'Task',
          linkedIssues: [],
        };

        const dod = generator.generateDoD(ticket);
        const manualTestSection = dod.sections.find(s => s.title === 'Manual Test Steps');
        const categories = manualTestSection!.rows.map(row => row.category);

        expect(categories).toContain('Data Validation');
      });
    });
  });

  describe('Property 5: Conditional MR section inclusion', () => {
    // Feature: generate-dod, Property 5: Conditional MR section inclusion
    // Validates: Requirements 2.4, 6.1, 6.4

    it('should include CI section with actual status when MR is provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, mergeRequestArbitrary, (ticket, mr) => {
          const dod = generator.generateDoD(ticket, mr);

          const sectionTitles = dod.sections.map(s => s.title);
          
          // CI section should be present
          expect(sectionTitles).toContain('Continuous Integration');

          // Find the CI section
          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();
          expect(ciSection!.rows.length).toBeGreaterThan(0);

          // Extract all items from CI section
          const allItems = ciSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention the actual CI status
          expect(combinedText).toContain(mr.ciStatus.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should include CI section with placeholder when MR is not provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          const sectionTitles = dod.sections.map(s => s.title);
          
          // CI section should be present
          expect(sectionTitles).toContain('Continuous Integration');

          // Find the CI section
          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();
          expect(ciSection!.rows.length).toBeGreaterThan(0);

          // Extract all items from CI section
          const allItems = ciSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ').toLowerCase();

          // Should mention verification or manual check (placeholder)
          expect(combinedText).toMatch(/verify|manual|pipeline/);
        }),
        { numRuns: 100 }
      );
    });

    it('should mark CI row as checked only when status is passed', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, mergeRequestArbitrary, (ticket, mr) => {
          const dod = generator.generateDoD(ticket, mr);

          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();

          // Check if any row is checked
          const hasCheckedRow = ciSection!.rows.some(row => row.checked);

          // Should be checked only if CI status is passed
          if (mr.ciStatus === 'passed') {
            expect(hasCheckedRow).toBe(true);
          } else {
            expect(hasCheckedRow).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not mark CI row as checked when MR is not provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();

          // No row should be checked when MR is not provided
          const hasCheckedRow = ciSection!.rows.some(row => row.checked);
          expect(hasCheckedRow).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should include CI status indicator when MR is provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, mergeRequestArbitrary, (ticket, mr) => {
          const dod = generator.generateDoD(ticket, mr);

          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();

          // Extract all items from CI section
          const allItems = ciSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ');

          // Should include a status indicator (✓, ✗, ⟳, ⏳, ⊘)
          expect(combinedText).toMatch(/[✓✗⟳⏳⊘]/);
        }),
        { numRuns: 100 }
      );
    });

    it('should not include CI status indicator when MR is not provided', () => {
      fc.assert(
        fc.property(jiraTicketArbitrary, (ticket) => {
          const dod = generator.generateDoD(ticket);

          const ciSection = dod.sections.find(s => s.title === 'Continuous Integration');
          expect(ciSection).toBeDefined();

          // Extract all items from CI section
          const allItems = ciSection!.rows.flatMap(row => row.items);
          const combinedText = allItems.join(' ');

          // Should NOT include status indicators
          expect(combinedText).not.toMatch(/[✓✗⟳⏳⊘]/);
        }),
        { numRuns: 100 }
      );
    });
  });
});
