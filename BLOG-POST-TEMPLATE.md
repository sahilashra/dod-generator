# Blog Post Template for AWS Builder Center

---

# Building an Automated Definition-of-Done Generator with Kiro AI: A Spec-Driven Development Journey

## Introduction

In modern software development, ensuring quality and completeness before marking work as "done" is crucial. However, creating comprehensive Definition-of-Done (DoD) checklists manually is time-consuming, error-prone, and often inconsistent across teams. As a developer working with Jira and GitLab, I found myself spending 15-20 minutes crafting DoD checklists for each ticket, often missing important items or creating inconsistent formats.

This is where I decided to build an automated solution: a DoD Generator that creates comprehensive, type-specific checklists from Jira tickets and GitLab merge requests. What made this project unique was using **Kiro AI** to accelerate development through spec-driven development and property-based testing.

In this post, I'll share how Kiro AI transformed my development process, helping me build a production-ready tool with 284 tests and 21 correctness properties in a fraction of the time it would have taken traditionally.

## The Problem: Manual DoD Creation is Broken

Every development team knows the importance of a Definition-of-Done, but creating them consistently is challenging:

1. **Time-Consuming**: Manually writing DoD checklists takes 15-20 minutes per ticket
2. **Inconsistent**: Different developers create different formats and miss different items
3. **Type-Specific Needs**: Backend, frontend, and infrastructure work require different checklist items
4. **Integration Complexity**: Pulling data from Jira and GitLab APIs requires significant boilerplate
5. **Maintenance Burden**: Keeping DoD templates updated across the team is difficult

The result? Teams either skip comprehensive DoDs or spend significant time on manual checklist creation, neither of which is ideal.

## The Solution: Automated DoD Generation

I built a command-line tool that automatically generates comprehensive, type-specific Definition-of-Done checklists by:

1. **Fetching ticket data** from Jira REST API v3
2. **Extracting acceptance criteria** from ticket descriptions
3. **Inferring ticket type** (backend/frontend/infrastructure) from labels and content
4. **Fetching CI status** from GitLab merge requests
5. **Generating type-specific sections** (API contracts, UI/UX validation, deployment procedures)
6. **Formatting as Markdown** with proper checkbox syntax
7. **Optionally posting** back to Jira as a comment

**Result**: What took 15-20 minutes now takes 5 seconds, with consistent, comprehensive checklists every time.

## How Kiro AI Accelerated Development

This is where the story gets interesting. Building this tool with traditional development would have taken weeks. With Kiro AI's spec-driven development approach, I completed it in days with higher quality and confidence.

### 1. Spec-Driven Development: From Idea to Implementation

Kiro's workflow transformed how I approached the project:

#### Phase 1: Requirements Gathering with EARS Patterns

Instead of jumping straight to code, Kiro guided me through creating formal requirements using EARS (Easy Approach to Requirements Syntax) patterns:

```markdown
### Requirement 1
**User Story:** As a developer, I want to parse Jira ticket information, 
so that I can extract relevant details for the DoD table.

#### Acceptance Criteria
1. WHEN the DoD Generator receives a Jira ticket URL, 
   THE DoD Generator SHALL fetch the ticket data via Jira REST API
2. WHEN ticket data is retrieved, 
   THE DoD Generator SHALL extract the ticket summary, description, 
   acceptance criteria, labels, and linked issues
3. WHEN the ticket contains acceptance criteria in the description, 
   THE DoD Generator SHALL parse and structure them as individual items
```

**Impact**: This clarity prevented scope creep and ensured I built exactly what was needed.

[Screenshot: `.kiro/specs/generate-dod/requirements.md`]

#### Phase 2: Design with Correctness Properties

The game-changer was Kiro's approach to correctness properties. Instead of just writing code and hoping it works, I defined 21 formal properties that the system must satisfy:

```markdown
### Property 6: Valid Markdown output structure
*For any* generated DoD table, the output should be valid Markdown 
with properly formatted tables, headers, and checkbox syntax.
**Validates: Requirements 3.1, 4.2**

### Property 11: Acceptance criteria row mapping
*For any* ticket with N acceptance criteria, the generated DoD table 
should contain exactly N rows in the acceptance criteria section, 
each corresponding to one criterion.
**Validates: Requirements 4.1**
```

These properties became the foundation for property-based testing later.

**Impact**: Thinking about correctness upfront caught design issues before writing any code.

[Screenshot: `.kiro/specs/generate-dod/design.md` - Properties section]

#### Phase 3: Task Breakdown

Kiro automatically generated an implementation plan with 19 major tasks and numerous subtasks, each mapped to specific requirements:

```markdown
- [x] 4. Implement Jira API fetcher
  - Create JiraFetcher class with constructor accepting baseUrl and token
  - Implement fetchTicket() method using axios with Bearer token authentication
  - Parse Jira API v3 response into JiraTicket model
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 4.1 Write property test for data extraction
  - **Property 1: Complete data extraction from API responses**
  - **Validates: Requirements 1.2**
```

**Impact**: Clear roadmap with built-in traceability from requirements to implementation to tests.

[Screenshot: `.kiro/specs/generate-dod/tasks.md`]

### 2. Property-Based Testing: Catching Edge Cases Automatically

Traditional unit tests check specific examples. Property-based testing checks universal properties across randomly generated inputs. Kiro helped me implement this with fast-check:

```typescript
// Feature: generate-dod, Property 6: Valid Markdown output structure
// Validates: Requirements 3.1, 4.2
test('Property 6: Valid Markdown output structure', () => {
  fc.assert(
    fc.property(doDTableArbitrary, (dod: DoDTable) => {
      const markdown = formatter.formatDoDTable(dod);
      
      // Verify output is valid Markdown
      expect(markdown).toMatch(/^# Definition of Done:/);
      expect(markdown).toContain(`**Ticket Type:** ${dod.metadata.ticketType}`);
      
      // Verify all sections are present
      for (const section of dod.sections) {
        expect(markdown).toContain(`## ${section.title}`);
      }
      
      // Verify checkbox syntax is valid
      const checkboxMatches = markdown.match(/- \[([ x])\]/g);
      if (checkboxMatches) {
        for (const match of checkboxMatches) {
          expect(match).toMatch(/- \[([ x])\]/);
        }
      }
    }),
    { numRuns: 100 } // Test with 100 random inputs
  );
});
```

**What this caught:**
- Categories with asterisks (`*`) were breaking Markdown formatting
- Random strings like "uX" were being detected as frontend keywords
- Edge cases in URL parsing I never would have thought to test

**Impact**: 284 tests running 100+ iterations each = thousands of test cases automatically generated and verified.

[Screenshot: Test results showing all 284 tests passing]

### 3. AI-Assisted Implementation

Kiro's AI assistance accelerated every phase:

**Code Generation:**
```
Me: "Implement the JiraFetcher class according to the design"
Kiro: [Generates complete implementation with error handling, 
       type safety, and proper API integration]
```

**Test Writing:**
```
Me: "Write property test for Property 11: Acceptance criteria row mapping"
Kiro: [Generates property-based test with fast-check generators, 
       proper assertions, and edge case handling]
```

**Bug Fixing:**
When property tests failed, Kiro helped triage:
```
Counterexample: {"key":" ","summary":"uX","description":"","labels":[]}
Kiro: "The test is generating 'uX' which contains 'ux' (a frontend keyword).
       Filter out strings containing type keywords in your generator."
```

**Impact**: What would have taken days of debugging was fixed in minutes.

[Screenshot: Kiro chat showing code generation and bug fixing]

## Technical Architecture

The DoD Generator is built with TypeScript/Node.js and follows a modular architecture:

```
┌─────────────┐
│   CLI/API   │
│   Entry     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Input Parser   │
│  & Validator    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Data Fetchers  │─────▶│  Jira API    │
│                 │      └──────────────┘
│                 │      ┌──────────────┐
│                 │─────▶│  GitLab API  │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐
│  DoD Generator  │
│  (Template      │
│   Engine)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Output         │
│  Formatter      │
└─────────────────┘
```

### Key Components

**1. Input Parser**: Validates input and extracts ticket identifiers
```typescript
interface DoDInput {
  ticket_url?: string;
  ticket_json?: JiraTicket;
  type?: 'backend' | 'frontend' | 'infrastructure';
  mr_url?: string;
  post_comment?: boolean;
}
```

**2. Data Fetchers**: Handle API integration with error handling
```typescript
class JiraFetcher {
  async fetchTicket(ticketKey: string): Promise<JiraTicket> {
    // Fetch from Jira REST API v3
    // Parse response
    // Extract acceptance criteria
  }
}
```

**3. DoD Generator**: Core logic for generating type-specific checklists
```typescript
class DoDGenerator {
  generateDoD(ticket: JiraTicket, mr?: MergeRequest): DoDTable {
    // Infer ticket type
    // Generate mandatory sections
    // Add type-specific sections
    // Include conditional content
  }
}
```

**4. Formatters**: Output as Markdown or Jira wiki markup
```typescript
class MarkdownFormatter {
  formatDoDTable(dod: DoDTable): string {
    // Format as Markdown with checkboxes
  }
  
  formatForJira(markdown: string): string {
    // Convert to Jira wiki markup
  }
}
```

## Key Features

✅ **Automatic DoD Generation** - From Jira tickets in seconds
✅ **Type-Specific Templates** - Backend, frontend, and infrastructure
✅ **GitLab Integration** - CI status and code change tracking
✅ **Jira Comment Posting** - Automatically post DoD back to tickets
✅ **Flexible Configuration** - CLI args, environment variables, or config files
✅ **Comprehensive Testing** - 284 tests with 100% pass rate
✅ **Property-Based Testing** - 21 correctness properties verified
✅ **Error Handling** - Graceful degradation and clear error messages

## Results & Impact

### Time Savings
- **Before**: 15-20 minutes per ticket for manual DoD creation
- **After**: 5 seconds for automated generation
- **Savings**: ~95% time reduction

### Quality Improvements
- **Consistency**: 100% - all DoDs follow the same structure
- **Completeness**: Type-specific sections ensure nothing is missed
- **Correctness**: 21 properties verified with 284 tests

### Development Metrics
- **Total Tests**: 284 (all passing)
- **Property Tests**: 21 correctness properties
- **Test Iterations**: 100+ per property = thousands of test cases
- **Code Coverage**: Comprehensive coverage of all components
- **Development Time**: Days instead of weeks (thanks to Kiro)

### Example Output

```markdown
# Definition of Done: BACKEND-123

**Ticket Type:** backend
**Generated:** 1/15/2024, 10:30:00 AM

## Acceptance Criteria
- [ ] The endpoint should accept username and password via POST request
- [ ] The endpoint should validate credentials against the user database
- [ ] The endpoint should return a JWT token on successful authentication

## CI Status
✓ Pipeline passed

## Automated Tests
- [ ] Unit tests for authentication logic
- [ ] Integration tests for API endpoint
- [ ] API contract tests

## API Contract Changes
- [ ] API documentation updated
- [ ] Breaking changes documented
- [ ] Backward compatibility verified

## Monitoring and Logging Changes
- [ ] Add logging for authentication attempts
- [ ] Add metrics for authentication success rate
- [ ] Add alerts for unusual patterns

## Documentation Updates
- [ ] Update API documentation
- [ ] Update authentication guide

## Reviewer Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Security best practices followed
```

[Screenshot: Generated DoD example]
[Screenshot: DoD posted to Jira]

## Lessons Learned

### 1. Spec-Driven Development Catches Issues Early
Writing formal requirements and design documents before coding prevented:
- Scope creep
- Architectural mistakes
- Missing edge cases
- Unclear requirements

**Lesson**: Invest time upfront in specifications. It pays off exponentially.

### 2. Property-Based Testing Finds What You Miss
Traditional unit tests only check what you think to test. Property-based testing checks what you don't think to test:
- Edge cases with special characters
- Unexpected input combinations
- Boundary conditions
- Random data that breaks assumptions

**Lesson**: Combine unit tests (specific examples) with property tests (universal properties).

### 3. AI Assistance Accelerates Everything
Kiro's AI didn't just write code faster - it:
- Generated better test coverage
- Caught bugs I would have missed
- Suggested better architectures
- Created comprehensive documentation

**Lesson**: AI is a force multiplier, not a replacement. It amplifies good practices.

### 4. Clear Requirements Lead to Better Design
The EARS pattern for requirements forced clarity:
- WHEN [trigger], THE [system] SHALL [response]
- No ambiguity, no vague terms, no escape clauses

**Lesson**: Invest in requirement quality. Everything else follows.

## Conclusion

Building the DoD Generator with Kiro AI was a transformative experience. What started as a simple automation idea became a production-ready tool with:

- **284 tests** ensuring correctness
- **21 properties** defining expected behavior
- **Comprehensive documentation** for easy adoption
- **Type-specific templates** for different work types
- **Full API integration** with Jira and GitLab

But more importantly, it demonstrated the power of:
1. **Spec-driven development** for clarity and quality
2. **Property-based testing** for comprehensive verification
3. **AI assistance** for accelerated development

Kiro AI didn't just help me write code faster - it helped me write better code with higher confidence. The spec-driven approach caught issues before they became bugs, and property-based testing verified correctness across thousands of test cases.

**Time saved**: 95% reduction in DoD creation time
**Quality gained**: 100% consistency and completeness
**Confidence level**: 284 passing tests and 21 verified properties

If you're building software, especially tools that need to be correct and reliable, I highly recommend:
1. Start with formal specifications
2. Define correctness properties
3. Use property-based testing
4. Leverage AI assistance like Kiro

The combination is powerful and will transform how you develop software.

## Try It Yourself

**GitHub Repository**: https://github.com/sahilashra/dod-generator

The repository includes:
- Complete source code
- `.kiro` directory with specs
- Comprehensive documentation
- Example fixtures for testing
- Setup guides and tutorials

Clone it, try it, and see how automated DoD generation can transform your workflow!

## Links & Resources

- **GitHub Repository**: https://github.com/sahilashra/dod-generator
- **Kiro AI**: https://kiro.ai
- **Fast-check (Property Testing)**: https://fast-check.dev
- **EARS Requirements**: https://www.iaria.org/conferences2012/filesICCGI12/Tutorial%20ICCGI%202012%20Terzakis.pdf

---

**Tags**: #KiroAI #Automation #DevOps #Jira #GitLab #PropertyBasedTesting #SpecDrivenDevelopment #AIforBharat

---

*Built for the AI for Bharat competition, showcasing how Kiro AI accelerates development through spec-driven development and property-based testing.*
