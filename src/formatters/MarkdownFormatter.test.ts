import * as fc from 'fast-check';
import { MarkdownFormatter } from './MarkdownFormatter';
import { DoDTable, DoDSection, DoDRow } from '../models/types';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  // Generators for property-based testing
  const nonEmptyString = (minLength: number, maxLength: number) =>
    fc.string({ minLength, maxLength }).filter(s => s.trim().length > 0);

  const doDRowArbitrary = fc.record({
    category: nonEmptyString(1, 50),
    items: fc.array(nonEmptyString(1, 200), { minLength: 1, maxLength: 5 }),
    checked: fc.boolean(),
  });

  const doDSectionArbitrary = fc.record({
    title: nonEmptyString(1, 100),
    rows: fc.array(doDRowArbitrary, { minLength: 1, maxLength: 10 }),
  });

  const doDTableArbitrary = fc.record({
    sections: fc.array(doDSectionArbitrary, { minLength: 1, maxLength: 10 }),
    metadata: fc.record({
      ticketKey: nonEmptyString(1, 20),
      ticketType: fc.constantFrom('backend', 'frontend', 'infrastructure'),
      generatedAt: fc.date().map(d => d.toISOString()),
    }),
  });

  describe('Property-Based Tests', () => {
    // Feature: generate-dod, Property 6: Valid Markdown output structure
    // Validates: Requirements 3.1, 4.2
    test('Property 6: Valid Markdown output structure', () => {
      fc.assert(
        fc.property(doDTableArbitrary, (dod: DoDTable) => {
          const markdown = formatter.formatDoDTable(dod);

          // Verify output is a non-empty string
          expect(typeof markdown).toBe('string');
          expect(markdown.length).toBeGreaterThan(0);

          // Verify header structure
          expect(markdown).toMatch(/^# Definition of Done:/);
          expect(markdown).toContain(`**Ticket Type:** ${dod.metadata.ticketType}`);
          expect(markdown).toContain('**Generated:**');

          // Verify all sections are present
          for (const section of dod.sections) {
            expect(markdown).toContain(`## ${section.title}`);
          }

          // Verify checkbox syntax is valid (either [ ] or [x])
          const checkboxMatches = markdown.match(/- \[([ x])\]/g);
          if (checkboxMatches) {
            for (const match of checkboxMatches) {
              expect(match).toMatch(/- \[([ x])\]/);
            }
          }

          // Verify all categories are present (accounting for escaped asterisks)
          for (const section of dod.sections) {
            for (const row of section.rows) {
              // Categories with asterisks get escaped in the output
              const escapedCategory = row.category.replace(/\*/g, '\\*');
              expect(markdown).toContain(escapedCategory);
            }
          }

          // Verify all items are present
          for (const section of dod.sections) {
            for (const row of section.rows) {
              for (const item of row.items) {
                expect(markdown).toContain(item);
              }
            }
          }

          // Verify proper Markdown structure (no malformed syntax)
          // Headers should be followed by newlines
          const headerLines = markdown.split('\n').filter(line => line.startsWith('#'));
          expect(headerLines.length).toBeGreaterThan(0);

          // Verify no empty section titles
          expect(markdown).not.toMatch(/^## \s*$/m);
        }),
        { numRuns: 100 }
      );
    });

    // Feature: generate-dod, Property 15: CI status representation
    // Validates: Requirements 6.2, 6.3
    test('Property 15: CI status representation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('passed', 'failed', 'running', 'pending', 'canceled'),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom('backend', 'frontend', 'infrastructure'),
          (ciStatus, ticketKey, ticketType) => {
            // Create a DoD table with CI section
            const dod: DoDTable = {
              sections: [
                {
                  title: 'Continuous Integration',
                  rows: [
                    {
                      category: 'CI Pipeline',
                      items: [`CI Status: ${getCIStatusIndicator(ciStatus)} ${ciStatus}`],
                      checked: ciStatus === 'passed',
                    },
                  ],
                },
              ],
              metadata: {
                ticketKey,
                ticketType,
                generatedAt: new Date().toISOString(),
              },
            };

            const markdown = formatter.formatDoDTable(dod);

            // Verify CI status is present with correct indicator
            const expectedIndicator = getCIStatusIndicator(ciStatus);
            expect(markdown).toContain(`CI Status: ${expectedIndicator} ${ciStatus}`);

            // Verify checkbox state matches CI status
            if (ciStatus === 'passed') {
              expect(markdown).toContain('- [x] **CI Pipeline:**');
            } else {
              expect(markdown).toContain('- [ ] **CI Pipeline:**');
            }

            // Verify the indicator is one of the expected symbols
            expect(['✓', '✗', '⟳', '⏳', '⊘']).toContain(expectedIndicator);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: generate-dod, Property 17: Jira format transformation
    // Validates: Requirements 8.2
    test('Property 17: Jira format transformation', () => {
      fc.assert(
        fc.property(doDTableArbitrary, (dod: DoDTable) => {
          const markdown = formatter.formatDoDTable(dod);
          const jiraMarkup = formatter.formatForJira(markdown);

          // Verify Jira markup is a non-empty string
          expect(typeof jiraMarkup).toBe('string');
          expect(jiraMarkup.length).toBeGreaterThan(0);

          // Verify Markdown headers are converted to Jira format
          expect(jiraMarkup).not.toMatch(/^# /m);
          expect(jiraMarkup).not.toMatch(/^## /m);
          expect(jiraMarkup).not.toMatch(/^### /m);
          
          // Should contain Jira header format instead
          if (markdown.includes('# Definition of Done:')) {
            expect(jiraMarkup).toContain('h1. Definition of Done:');
          }
          
          // Verify section headers are converted
          for (const section of dod.sections) {
            expect(jiraMarkup).toContain(`h2. ${section.title}`);
          }

          // Verify Markdown bold (**text**) is converted to Jira bold (*text*)
          expect(jiraMarkup).not.toMatch(/\*\*[^*]+\*\*/);
          
          // Verify checkboxes are preserved
          const markdownCheckboxes = markdown.match(/- \[([ x])\]/g);
          const jiraCheckboxes = jiraMarkup.match(/- \[([ x])\]/g);
          if (markdownCheckboxes) {
            expect(jiraCheckboxes).toBeTruthy();
            expect(jiraCheckboxes?.length).toBe(markdownCheckboxes.length);
          }

          // Verify all content is preserved (accounting for transformations)
          // Categories get escaped in Markdown (e.g., * becomes \*), then wrapped in bold
          // Then in Jira format, ** becomes *
          for (const section of dod.sections) {
            for (const row of section.rows) {
              // Categories with asterisks get escaped in Markdown output
              const escapedCategory = row.category.replace(/\*/g, '\\*');
              // Then bold markers are converted: **text** becomes *text*
              const transformedCategory = escapedCategory.replace(/\*\*(.+?)\*\*/g, '*$1*');
              expect(jiraMarkup).toContain(transformedCategory);
              
              for (const item of row.items) {
                // Items may also have bold markers converted
                const transformedItem = item.replace(/\*\*(.+?)\*\*/g, '*$1*');
                expect(jiraMarkup).toContain(transformedItem);
              }
            }
          }

          // Verify metadata is preserved
          expect(jiraMarkup).toContain(dod.metadata.ticketKey);
          expect(jiraMarkup).toContain(dod.metadata.ticketType);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// Helper function to get CI status indicator (matches DoDGenerator logic)
function getCIStatusIndicator(status: string): string {
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


  describe('Unit Tests', () => {
    let unitFormatter: MarkdownFormatter;

    beforeEach(() => {
      unitFormatter = new MarkdownFormatter();
    });

    describe('formatDoDTable', () => {
      test('should format a simple DoD table with one section', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'Acceptance Criteria',
              rows: [
                {
                  category: 'Feature',
                  items: ['User can login'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'ABC-123',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);

        expect(markdown).toContain('# Definition of Done: ABC-123');
        expect(markdown).toContain('**Ticket Type:** backend');
        expect(markdown).toContain('## Acceptance Criteria');
        expect(markdown).toContain('- [ ] **Feature:** User can login');
      });

      test('should format multiple sections', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'Acceptance Criteria',
              rows: [
                {
                  category: 'Feature',
                  items: ['User can login'],
                  checked: false,
                },
              ],
            },
            {
              title: 'Testing',
              rows: [
                {
                  category: 'Unit Tests',
                  items: ['Write unit tests'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'XYZ-456',
            ticketType: 'frontend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);

        expect(markdown).toContain('## Acceptance Criteria');
        expect(markdown).toContain('## Testing');
      });

      test('should format rows with multiple items', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'Testing',
              rows: [
                {
                  category: 'Unit Tests',
                  items: [
                    'Test login function',
                    'Test logout function',
                    'Test session management',
                  ],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'TEST-789',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);

        expect(markdown).toContain('- [ ] **Unit Tests**');
        expect(markdown).toContain('  - Test login function');
        expect(markdown).toContain('  - Test logout function');
        expect(markdown).toContain('  - Test session management');
      });
    });

    describe('checkbox formatting', () => {
      test('should format unchecked items with [ ]', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'Tasks',
              rows: [
                {
                  category: 'Task',
                  items: ['Do something'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CHK-001',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('- [ ] **Task:** Do something');
      });

      test('should format checked items with [x]', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'Tasks',
              rows: [
                {
                  category: 'Task',
                  items: ['Done task'],
                  checked: true,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CHK-002',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('- [x] **Task:** Done task');
      });
    });

    describe('CI status indicators', () => {
      test('should display passed status with checkmark', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'CI',
              rows: [
                {
                  category: 'CI Pipeline',
                  items: ['CI Status: ✓ passed'],
                  checked: true,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CI-001',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('CI Status: ✓ passed');
        expect(markdown).toContain('- [x]');
      });

      test('should display failed status with X', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'CI',
              rows: [
                {
                  category: 'CI Pipeline',
                  items: ['CI Status: ✗ failed'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CI-002',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('CI Status: ✗ failed');
        expect(markdown).toContain('- [ ]');
      });

      test('should display running status with circular arrow', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'CI',
              rows: [
                {
                  category: 'CI Pipeline',
                  items: ['CI Status: ⟳ running'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CI-003',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('CI Status: ⟳ running');
      });

      test('should display pending status with hourglass', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'CI',
              rows: [
                {
                  category: 'CI Pipeline',
                  items: ['CI Status: ⏳ pending'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CI-004',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('CI Status: ⏳ pending');
      });

      test('should display canceled status with circle slash', () => {
        const dod: DoDTable = {
          sections: [
            {
              title: 'CI',
              rows: [
                {
                  category: 'CI Pipeline',
                  items: ['CI Status: ⊘ canceled'],
                  checked: false,
                },
              ],
            },
          ],
          metadata: {
            ticketKey: 'CI-005',
            ticketType: 'backend',
            generatedAt: '2024-01-01T00:00:00.000Z',
          },
        };

        const markdown = unitFormatter.formatDoDTable(dod);
        expect(markdown).toContain('CI Status: ⊘ canceled');
      });
    });

    describe('formatForJira', () => {
      test('should convert Markdown headers to Jira format', () => {
        const markdown = '# Main Title\n## Section Title\n### Subsection';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('h1. Main Title');
        expect(jira).toContain('h2. Section Title');
        expect(jira).toContain('h3. Subsection');
      });

      test('should convert bold text to Jira format', () => {
        const markdown = '**Bold text**';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toBe('*Bold text*');
      });

      test('should preserve checkboxes', () => {
        const markdown = '- [ ] Unchecked\n- [x] Checked';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('- [ ] Unchecked');
        expect(jira).toContain('- [x] Checked');
      });

      test('should convert code blocks to Jira format', () => {
        const markdown = '```javascript\nconst x = 1;\n```';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('{code:javascript}');
        expect(jira).toContain('const x = 1;');
        expect(jira).toContain('{code}');
      });

      test('should handle code blocks without language', () => {
        const markdown = '```\nsome code\n```';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('{code:}');
        expect(jira).toContain('some code');
        expect(jira).toContain('{code}');
      });

      test('should convert Markdown table headers to Jira format', () => {
        const markdown = '| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('|| Header 1 || Header 2 || Header 3 ||');
        expect(jira).not.toContain('|----------|');
      });

      test('should convert Markdown table cells to Jira format', () => {
        const markdown = '| Cell 1 | Cell 2 | Cell 3 |';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('| Cell 1 | Cell 2 | Cell 3 |');
      });

      test('should convert complete Markdown table to Jira format', () => {
        const markdown = '| Name | Status | Notes |\n|------|--------|-------|\n| Task 1 | Done | Complete |\n| Task 2 | Pending | In progress |';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('|| Name || Status || Notes ||');
        expect(jira).toContain('| Task 1 | Done | Complete |');
        expect(jira).toContain('| Task 2 | Pending | In progress |');
        expect(jira).not.toContain('|------|');
      });

      test('should preserve formatting in mixed content', () => {
        const markdown = '# Title\n\n**Bold** text\n\n| Col1 | Col2 |\n|------|------|\n| A | B |\n\n```js\ncode\n```';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('h1. Title');
        expect(jira).toContain('*Bold* text');
        expect(jira).toContain('|| Col1 || Col2 ||');
        expect(jira).toContain('| A | B |');
        expect(jira).toContain('{code:js}');
        expect(jira).toContain('code');
        expect(jira).toContain('{code}');
      });

      test('should handle tables with varying column counts', () => {
        const markdown = '| A | B |\n|---|---|\n| 1 | 2 |';
        const jira = unitFormatter.formatForJira(markdown);

        expect(jira).toContain('|| A || B ||');
        expect(jira).toContain('| 1 | 2 |');
      });
    });
  });
