import { DoDTable, DoDSection, DoDRow } from '../models/types';

export class MarkdownFormatter {
  /**
   * Formats a DoD table as Markdown
   */
  formatDoDTable(dod: DoDTable): string {
    const lines: string[] = [];

    // Add header with metadata
    lines.push(`# Definition of Done: ${dod.metadata.ticketKey}`);
    lines.push('');
    lines.push(`**Ticket Type:** ${dod.metadata.ticketType}`);
    lines.push(`**Generated:** ${new Date(dod.metadata.generatedAt).toLocaleString()}`);
    lines.push('');

    // Format each section
    for (const section of dod.sections) {
      lines.push(...this.formatSection(section));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Formats a single section as Markdown
   */
  private formatSection(section: DoDSection): string[] {
    const lines: string[] = [];

    // Section title
    lines.push(`## ${section.title}`);
    lines.push('');

    // Format each row
    for (const row of section.rows) {
      lines.push(...this.formatRow(row));
    }

    return lines;
  }

  /**
   * Formats a single row with checkbox syntax
   */
  private formatRow(row: DoDRow): string[] {
    const lines: string[] = [];
    const checkbox = row.checked ? '[x]' : '[ ]';

    // Escape asterisks in category to prevent ambiguity with bold markers
    const escapedCategory = this.escapeAsterisks(row.category);

    // If there's only one item, format it inline with the category
    if (row.items.length === 1) {
      lines.push(`- ${checkbox} **${escapedCategory}:** ${row.items[0]}`);
    } else {
      // Multiple items: category as header, items as sub-bullets
      lines.push(`- ${checkbox} **${escapedCategory}**`);
      for (const item of row.items) {
        lines.push(`  - ${item}`);
      }
    }

    return lines;
  }

  /**
   * Escapes asterisks in content to prevent ambiguity with Markdown bold markers
   */
  private escapeAsterisks(text: string): string {
    return text.replace(/\*/g, '\\*');
  }

  /**
   * Unescapes asterisks that were escaped for Markdown
   */
  private unescapeAsterisks(text: string): string {
    return text.replace(/\\\*/g, '*');
  }

  /**
   * Formats DoD table for Jira wiki markup
   */
  formatForJira(markdown: string): string {
    let jiraMarkup = markdown;

    // Convert headers
    jiraMarkup = jiraMarkup.replace(/^# (.+)$/gm, 'h1. $1');
    jiraMarkup = jiraMarkup.replace(/^## (.+)$/gm, 'h2. $1');
    jiraMarkup = jiraMarkup.replace(/^### (.+)$/gm, 'h3. $1');

    // Convert checkboxes
    jiraMarkup = jiraMarkup.replace(/- \[x\]/g, '- [x]');
    jiraMarkup = jiraMarkup.replace(/- \[ \]/g, '- [ ]');

    // Convert bold - handle Markdown bold (**text**) to Jira bold (*text*)
    // Process line by line to avoid cross-line matching
    // Use a regex that matches ** followed by content (which may include single *)
    // followed by **, but ensures we don't match across multiple bold sections
    const boldLines = jiraMarkup.split('\n');
    const boldConvertedLines = boldLines.map(line => {
      // Match **content** where content doesn't start or end with *
      // This prevents matching across multiple bold sections
      // Pattern: ** followed by (optional non-* char, then any chars, then optional non-* char) followed by **
      return line.replace(/\*\*([^*](?:.*?[^*])?)\*\*/g, '*$1*');
    });
    
    jiraMarkup = boldConvertedLines.join('\n');

    // Convert code blocks (preserve them)
    jiraMarkup = jiraMarkup.replace(/```(\w+)?\n([\s\S]*?)```/g, '{code:$1}\n$2{code}');

    // Convert Markdown tables to Jira wiki markup
    // First, identify and mark table separators, then process tables
    const lines = jiraMarkup.split('\n');
    const convertedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this is a table separator line (e.g., |---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmedLine)) {
        // Skip separator lines - don't add them to output
        continue;
      }

      // Check if this line is a table row
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.length > 2) {
        // Check if the next non-empty line is a separator (indicating this is a header)
        let isHeader = false;
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (/^\|[\s\-:|]+\|$/.test(nextLine)) {
            isHeader = true;
          }
        }

        if (isHeader) {
          // Convert to Jira header format: || Header 1 || Header 2 ||
          const headerContent = trimmedLine.slice(1, -1); // Remove outer pipes
          const headers = headerContent.split('|').map(h => h.trim());
          convertedLines.push('|| ' + headers.join(' || ') + ' ||');
        } else {
          // Regular table row - keep as is
          convertedLines.push(line);
        }
      } else {
        // Non-table line
        convertedLines.push(line);
      }
    }

    jiraMarkup = convertedLines.join('\n');

    return jiraMarkup;
  }
}
