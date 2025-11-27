import { JiraTicket } from '../models/types';

export type TicketType = 'backend' | 'frontend' | 'infrastructure';

/**
 * Infers the ticket type based on labels, issue type, and description
 * Priority order: explicit type parameter > labels > description analysis > default
 * (Requirement 1.4)
 */
export function inferTicketType(
  ticket: JiraTicket,
  explicitType?: TicketType
): TicketType {
  // Priority 1: Explicit type parameter
  if (explicitType) {
    return explicitType;
  }

  // Priority 2: Labels
  const typeFromLabels = inferFromLabels(ticket.labels);
  if (typeFromLabels) {
    return typeFromLabels;
  }

  // Priority 3: Description and issue type analysis
  const typeFromAnalysis = inferFromDescriptionAndIssueType(
    ticket.description,
    ticket.issueType,
    ticket.summary
  );
  if (typeFromAnalysis) {
    return typeFromAnalysis;
  }

  // Priority 4: Default to backend
  return 'backend';
}

/**
 * Infers ticket type from labels
 * Returns the first matching type found in labels
 */
function inferFromLabels(labels: string[]): TicketType | null {
  const normalizedLabels = labels.map(label => label.toLowerCase());

  // Check for exact matches first
  if (normalizedLabels.includes('backend')) {
    return 'backend';
  }
  if (normalizedLabels.includes('frontend')) {
    return 'frontend';
  }
  if (normalizedLabels.includes('infrastructure')) {
    return 'infrastructure';
  }

  // Check for common variations
  const backendVariations = ['back-end', 'api', 'server', 'database', 'db'];
  const frontendVariations = ['front-end', 'ui', 'ux', 'client', 'web'];
  const infraVariations = ['infra', 'devops', 'deployment', 'ci/cd', 'cicd'];

  for (const label of normalizedLabels) {
    if (backendVariations.some(variant => label.includes(variant))) {
      return 'backend';
    }
    if (frontendVariations.some(variant => label.includes(variant))) {
      return 'frontend';
    }
    if (infraVariations.some(variant => label.includes(variant))) {
      return 'infrastructure';
    }
  }

  return null;
}

/**
 * Infers ticket type from description, summary, and issue type
 */
function inferFromDescriptionAndIssueType(
  description: string,
  issueType: string,
  summary: string
): TicketType | null {
  const combinedText = `${description} ${summary} ${issueType}`.toLowerCase();

  // Backend indicators
  const backendKeywords = [
    'api',
    'endpoint',
    'rest',
    'graphql',
    'database',
    'sql',
    'migration',
    'server',
    'backend',
    'microservice',
    'service',
  ];

  // Frontend indicators
  const frontendKeywords = [
    'ui',
    'ux',
    'component',
    'react',
    'vue',
    'angular',
    'frontend',
    'button',
    'form',
    'page',
    'view',
    'css',
    'html',
    'styling',
  ];

  // Infrastructure indicators
  const infraKeywords = [
    'infrastructure',
    'deployment',
    'ci/cd',
    'pipeline',
    'docker',
    'kubernetes',
    'k8s',
    'terraform',
    'ansible',
    'devops',
    'monitoring',
    'logging',
  ];

  // Count keyword matches for each type
  const backendScore = backendKeywords.filter(keyword =>
    combinedText.includes(keyword)
  ).length;
  const frontendScore = frontendKeywords.filter(keyword =>
    combinedText.includes(keyword)
  ).length;
  const infraScore = infraKeywords.filter(keyword =>
    combinedText.includes(keyword)
  ).length;

  // Return the type with the highest score
  const maxScore = Math.max(backendScore, frontendScore, infraScore);
  
  if (maxScore === 0) {
    return null;
  }

  if (backendScore === maxScore) {
    return 'backend';
  }
  if (frontendScore === maxScore) {
    return 'frontend';
  }
  if (infraScore === maxScore) {
    return 'infrastructure';
  }

  return null;
}
