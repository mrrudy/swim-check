<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: 0.0.0 → 1.0.0 (MAJOR - Initial constitution ratification)

Modified Principles: N/A (initial creation)

Added Sections:
- Core Principles (3 principles: Test-First Development, Readable Code, Simplicity)
- Development Workflow
- Quality Gates
- Governance

Removed Sections: N/A (initial creation)

Templates Requiring Updates:
- .specify/templates/plan-template.md: ✅ Already aligned (Constitution Check section)
- .specify/templates/spec-template.md: ✅ Already aligned (user stories with testing)
- .specify/templates/tasks-template.md: ✅ Already aligned (test-first task ordering)

Follow-up TODOs: None
=============================================================================
-->

# Swim-Check Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

Every piece of functionality MUST have a test case written before implementation.

**Rules:**
- Tests MUST be written and approved before any implementation code
- Tests MUST fail before implementation (Red-Green-Refactor cycle)
- No functionality may be merged without corresponding test coverage
- Test names MUST clearly describe the expected behavior

**Rationale:** Test-first development ensures requirements are understood before
coding, prevents regression, and creates living documentation of expected behavior.

### II. Readable Code

Code MUST be easy to understand for both humans and AI assistants.

**Rules:**
- Variable, function, and class names MUST be descriptive and self-documenting
- Complex logic MUST be broken into named functions with clear purposes
- Comments MUST explain "why" not "what" (code should show the "what")
- Avoid clever tricks - prefer explicit over implicit
- File and folder structure MUST reflect logical organization

**Rationale:** Code is read far more often than written. Clear code reduces
cognitive load, speeds up debugging, and enables effective AI-assisted development.

### III. Simplicity

Functionality MUST be provided in the simplest possible way.

**Rules:**
- Start with the minimal solution that meets requirements (YAGNI)
- Avoid premature abstraction - wait for patterns to emerge from real usage
- Prefer standard library solutions over third-party dependencies
- Each module/function MUST have a single, clear responsibility
- If a simpler alternative exists, it MUST be justified to reject it

**Rationale:** Simple code is easier to test, debug, maintain, and extend. Complexity
is a cost that must be consciously accepted, not accidentally accumulated.

## Development Workflow

**Mandatory Process:**
1. Write test case(s) describing expected behavior
2. Verify test(s) fail (Red phase)
3. Implement minimal code to pass tests (Green phase)
4. Refactor while maintaining passing tests (Refactor phase)
5. Review for readability and simplicity before committing

**Code Review Checklist:**
- Does every new function have corresponding tests?
- Can a new developer understand this code without extensive context?
- Is this the simplest solution that meets the requirement?

## Quality Gates

**Before Implementation:**
- Test cases written and reviewed
- Tests demonstrate failure without implementation

**Before Merge:**
- All tests pass
- Code follows readability standards
- No unnecessary complexity introduced
- No commented-out code or debug statements

## Governance

This constitution supersedes all other development practices for the Swim-Check
project. All contributions MUST comply with these principles.

**Amendment Procedure:**
1. Propose amendment with rationale
2. Document impact on existing code
3. Update constitution with new version number
4. Propagate changes to dependent templates

**Versioning Policy:**
- MAJOR: Principle removal or fundamental redefinition
- MINOR: New principle added or existing guidance materially expanded
- PATCH: Clarifications, wording improvements, non-semantic changes

**Compliance Review:**
- All pull requests MUST be verified against Core Principles
- Violations require explicit justification in the PR description
- Unjustified violations block merge

**Version**: 1.0.0 | **Ratified**: 2026-01-30 | **Last Amended**: 2026-01-30
