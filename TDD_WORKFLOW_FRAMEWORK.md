# TDD Workflow Framework
### Test-First Development Enforcement Script
**Version:** 1.0 | **Methodology:** Test-Driven Development (TDD) with Equivalent Requirement Specifications

---

> **How to use this document:** Work through each phase sequentially. Every gate (🔒) is a hard stop — you cannot proceed until all items above it are checked. Every template section marked `[FILL]` must be completed with real content. "N/A" is only acceptable if you can justify it in writing.

---

## QUICK REFERENCE: The Three Laws

Before any work begins, internalize these:

1. **You may not write a single line of production code unless it is to make a failing test pass.**
2. **You may not write more of a test than is sufficient to fail.**
3. **You may not write more production code than is sufficient to pass the currently failing test.**

Violation of these laws means restarting the current phase, not continuing forward.

---

## PHASE 0 — PROJECT INTAKE
*Time estimate: 30–60 minutes*

### Purpose
Establish the project's identity and the people accountable for each phase. This phase prevents work from starting on an unclear problem.

### 0.1 — Project Identity

```
PROJECT NAME       : [FILL]
PROJECT ID / TICKET: [FILL]
DATE INITIATED     : [FILL]
LEAD DEVELOPER     : [FILL]
QA OWNER           : [FILL]
STAKEHOLDER(S)     : [FILL]
REPOSITORY / BRANCH: [FILL]
```

### 0.2 — Problem Statement

Write in plain language. No jargon. No technical solution language yet.

```
PROBLEM BEING SOLVED:
[FILL — 2–5 sentences describing what is broken, missing, or needed.
Example: "Users cannot reset their password without contacting support.
This creates a support bottleneck and degrades user trust."]

DEFINITION OF DONE (BUSINESS LEVEL):
[FILL — What does a non-technical stakeholder need to see to call this complete?]

OUT OF SCOPE (explicitly list what this work will NOT do):
[FILL]
```

### 0.3 — Entry Criteria Check

- [ ] A real stakeholder has reviewed and approved the problem statement
- [ ] Out-of-scope items are agreed upon and documented
- [ ] A repository or working directory exists with this document committed

---

🔒 **GATE 0 — INTAKE COMPLETE**
*Do not open Phase 1 until all Phase 0 checkboxes are checked and the document is committed to version control.*

---

## PHASE 1 — PLANNING
*Time estimate: 2–8 hours depending on complexity*

### Purpose
Define every requirement, write every test, and document every use case **before writing any implementation code**. This phase is the contract. Development in Phase 2 is fulfilling that contract — nothing more, nothing less.

---

### 1.1 — Equivalent Requirement Specifications (ERS)

> **What is an ERS?** An ERS translates a business requirement into a precise, testable specification. Each ERS must be independently verifiable — you should be able to point to a single test that proves it is met.

**Template — copy this block for each requirement:**

```
ERS-[###]
─────────────────────────────────────────────────────────────
REQUIREMENT      : [FILL — one sentence, plain language]
ORIGIN           : [FILL — stakeholder request / bug report / tech debt / regulatory]
PRIORITY         : [ ] Critical  [ ] High  [ ] Medium  [ ] Low
─────────────────────────────────────────────────────────────
PRECONDITIONS    : [FILL — what must be true before this requirement applies?]
TRIGGER          : [FILL — what event or action activates this requirement?]
EXPECTED OUTCOME : [FILL — what is the observable, measurable result?]
─────────────────────────────────────────────────────────────
EQUIVALENT TEST  : TC-[###]  (link to test case defined in 1.2)
ACCEPTANCE SIGNAL: [FILL — exact pass condition. e.g., "HTTP 200 returned with
                   body containing { status: 'ok' } within 500ms"]
─────────────────────────────────────────────────────────────
NOTES / CONSTRAINTS:
[FILL — performance limits, security constraints, edge cases to handle]
```

**ERS Index** (fill as you create them):

| ERS ID  | Requirement Summary      | Priority | Linked Test | Status  |
|---------|--------------------------|----------|-------------|---------|
| ERS-001 | [FILL]                   | [FILL]   | TC-001      | DRAFT   |
| ERS-002 | [FILL]                   | [FILL]   | TC-002      | DRAFT   |
| ...     | ...                      | ...      | ...         | ...     |

**ERS Status values:** `DRAFT → REVIEWED → APPROVED → IMPLEMENTED → VERIFIED`

---

### 1.2 — Test Case Definitions

> **Rule:** Every ERS must have at least one test case. A test case that does not trace back to an ERS is scope creep — add it to the ERS table first, or delete the test.

**Template — copy this block for each test case:**

```
TC-[###]  ←→  ERS-[###]
─────────────────────────────────────────────────────────────
TEST NAME        : [FILL — descriptive, verb-noun format]
                   e.g., "validates_email_format_on_registration"
TYPE             : [ ] Unit  [ ] Integration  [ ] E2E  [ ] Performance  [ ] Security
─────────────────────────────────────────────────────────────
GIVEN (Context)  : [FILL — system state and data before the test runs]
WHEN  (Action)   : [FILL — the specific action or input being tested]
THEN  (Assertion): [FILL — the exact, measurable outcome that proves success]
─────────────────────────────────────────────────────────────
NEGATIVE CASE    : [FILL — what invalid/boundary input should this test also cover?]
EDGE CASES       : [FILL — list boundary values, null inputs, concurrent access, etc.]
─────────────────────────────────────────────────────────────
SETUP REQUIRED   : [FILL — fixtures, mocks, database state, env vars]
TEARDOWN REQUIRED: [FILL — cleanup actions after the test runs]
─────────────────────────────────────────────────────────────
ESTIMATED STATUS : [ ] Will Pass  [ ] Will Fail (expected before implementation)
NOTES            :
```

**Test Case Index:**

| TC ID  | Test Name                      | Type        | ERS Link | Written | Reviewed |
|--------|--------------------------------|-------------|----------|---------|----------|
| TC-001 | [FILL]                         | [FILL]      | ERS-001  | [ ]     | [ ]      |
| TC-002 | [FILL]                         | [FILL]      | ERS-002  | [ ]     | [ ]      |
| ...    | ...                            | ...         | ...      | ...     | ...      |

---

### 1.3 — Use Case Scenarios

> **What is a Use Case Scenario?** It is a narrative that describes how a real user (or system) moves through the feature end-to-end. Where test cases verify individual assertions, use case scenarios verify the *experience* stitched together. They become your integration and E2E test scripts.

**Template — copy this block for each scenario:**

```
UC-[###]
─────────────────────────────────────────────────────────────
SCENARIO TITLE   : [FILL — e.g., "New User Completes Onboarding and Places First Order"]
ACTOR(S)         : [FILL — who or what initiates this scenario?]
RELATED ERS      : [FILL — list ERS IDs this scenario exercises]
─────────────────────────────────────────────────────────────
HAPPY PATH STEPS:
  1. [FILL]
  2. [FILL]
  3. [FILL]
  ...
─────────────────────────────────────────────────────────────
ALTERNATIVE PATHS (things that could branch):
  A1 — [FILL — e.g., "User enters invalid credit card → system shows inline error"]
  A2 — [FILL]
─────────────────────────────────────────────────────────────
EXCEPTION PATHS (failure scenarios):
  E1 — [FILL — e.g., "Payment gateway timeout → order placed in pending state,
        user notified via email within 5 minutes"]
  E2 — [FILL]
─────────────────────────────────────────────────────────────
SUCCESS CRITERIA : [FILL — what observable outcome confirms this scenario passed?]
MAPPED TEST CASES: [FILL — list TC IDs that collectively cover this scenario]
```

---

### 1.4 — Pre-Development Test Authoring

> **This is the core TDD commitment.** Write the actual test code here — not pseudocode, not comments, not TODO stubs. Real, runnable tests that currently fail because the implementation doesn't exist yet.

**Checklist before calling this section done:**

- [ ] Every TC in the index has runnable test code authored in the repository
- [ ] Running the test suite produces failures (not errors) for all new tests
  - A *failure* means the assertion was reached and returned false
  - An *error* means setup is broken — fix errors before proceeding
- [ ] Test file locations are documented below
- [ ] A colleague has reviewed at least the Critical and High priority tests

**Test File Registry:**

```
UNIT TESTS        : [FILL — file paths]
INTEGRATION TESTS : [FILL — file paths]
E2E TESTS         : [FILL — file paths]
PERFORMANCE TESTS : [FILL — file paths]
HOW TO RUN ALL    : [FILL — exact command, e.g., "npm test" or "pytest ./tests/"]
```

**Phase 1 Completion Snapshot:**

```
TOTAL ERS DEFINED         : [FILL]
TOTAL TEST CASES WRITTEN  : [FILL]
TOTAL USE CASES DOCUMENTED: [FILL]
TESTS CURRENTLY FAILING   : [FILL]  ← must equal total test cases for new work
TESTS CURRENTLY ERRORING  : [FILL]  ← must be 0
```

---

### 1.5 — Phase 1 Exit Criteria

- [ ] All ERS have status `APPROVED` (reviewed by at least one person who is not the author)
- [ ] Every ERS maps to at least one TC
- [ ] Every TC maps back to an ERS (no orphan tests)
- [ ] All test code is committed to version control
- [ ] Running the suite produces 0 errors and N failures (where N = number of new tests)
- [ ] Stakeholder or tech lead has signed off on the ERS index

---

🔒 **GATE 1 — PLANNING COMPLETE**
*Writing implementation code before this gate is checked is a process violation. If you have already written implementation code, it must be reverted before Phase 2 begins.*

---

## PHASE 2 — DEVELOPMENT
*Time estimate: variable — but now bounded by the tests*

### Purpose
Implement the system described by the failing tests. Nothing more. You are not discovering requirements here — you are fulfilling the contract defined in Phase 1. If you encounter something Phase 1 didn't cover, stop, go back to Phase 1, add it, and return.

---

### 2.1 — Development Rules (Non-Negotiable)

1. **Red → Green → Refactor.** Pick one failing test. Write the minimum code to make it pass. Refactor only after it passes. Then pick the next failing test.
2. **No gold-plating.** Do not build functionality that isn't covered by a test.
3. **No test modification to make failing tests pass.** If a test seems wrong, escalate it — don't quietly change the assertion.
4. **Commit frequency.** Commit after every Red → Green cycle. Micro-commits are the record of your thinking.
5. **If you discover a gap.** Stop development. Return to Phase 1. Add the ERS and TC. Get approval. Then continue.

---

### 2.2 — Development Progress Tracker

> Update this table as you work. It is your real-time scoreboard.

| TC ID  | Test Name           | Status               | Commit Reference | Notes                  |
|--------|---------------------|----------------------|------------------|------------------------|
| TC-001 | [FILL]              | 🔴 Failing            |                  |                        |
| TC-002 | [FILL]              | 🔴 Failing            |                  |                        |
| ...    | ...                 | ...                  | ...              | ...                    |

**Status legend:** 🔴 Failing | 🟡 In Progress | 🟢 Passing | ⚪ Skipped (document reason)

---

### 2.3 — Mid-Development Check-ins

Every time 25% of tests move from 🔴 to 🟢, complete this check-in:

```
CHECK-IN AT [25% / 50% / 75% / 100%]
─────────────────────────────────────────────────────────────
DATE                    : [FILL]
TESTS PASSING           : [FILL] / [TOTAL]
NEW GAPS DISCOVERED     : [ ] Yes (return to Phase 1)  [ ] No
TEST MODIFICATIONS MADE : [ ] Yes (justify below)       [ ] No

IF YES — justification for any test modifications:
[FILL — only acceptable reasons: test setup was broken, not the assertion]
```

---

### 2.4 — Phase 2 Exit Criteria

- [ ] All tests in the TC index are 🟢 Passing (or formally deferred with written justification)
- [ ] No test assertions were modified to force a pass (commits are the audit trail)
- [ ] All mid-development check-ins are completed
- [ ] Code has been reviewed by at least one other developer
- [ ] No known errors or warnings in the CI pipeline related to this work

---

🔒 **GATE 2 — DEVELOPMENT COMPLETE**
*Do not begin validation until every test is passing or formally deferred.*

---

## PHASE 3 — VALIDATION
*Time estimate: 2–4 hours*

### Purpose
Prove — with evidence — that what was built matches what was planned. This phase is not a formality. It is the moment of honest reckoning. It compares the Phase 1 contract against the Phase 2 delivery.

---

### 3.1 — Full Test Suite Execution

Run the complete test suite in a **clean environment** (not your local development environment).

```
VALIDATION RUN DATE      : [FILL]
ENVIRONMENT              : [FILL — staging / CI / Docker / etc.]
EXECUTED BY              : [FILL]
COMMAND USED             : [FILL — exact command]
─────────────────────────────────────────────────────────────
RESULTS:
  Total Tests Run        : [FILL]
  Passed                 : [FILL]
  Failed                 : [FILL]
  Skipped / Deferred     : [FILL]
  Errors (setup failures): [FILL]
─────────────────────────────────────────────────────────────
PASS RATE                : [FILL]%
ACCEPTABLE THRESHOLD     : 100% of Critical/High, ≥95% of Medium/Low
THRESHOLD MET            : [ ] Yes  [ ] No
```

Attach or link the full test output here: `[FILL — link or file path]`

---

### 3.2 — ERS Traceability Matrix

> For every ERS, verify that its linked test passed and that the acceptance signal was observed.

| ERS ID  | Requirement Summary     | Linked TC | TC Result | Acceptance Signal Observed | Status       |
|---------|-------------------------|-----------|-----------|----------------------------|--------------|
| ERS-001 | [FILL]                  | TC-001    | [FILL]    | [ ] Yes  [ ] No            | [FILL]       |
| ERS-002 | [FILL]                  | TC-002    | [FILL]    | [ ] Yes  [ ] No            | [FILL]       |
| ...     | ...                     | ...       | ...       | ...                        | ...          |

**Traceability Status values:** `VERIFIED | PARTIAL | FAILED | DEFERRED`

---

### 3.3 — Use Case Scenario Walkthrough

For each UC defined in Phase 1, perform a manual or automated walkthrough and record results:

| UC ID  | Scenario Title            | Happy Path | Alt Paths | Exception Paths | Result       |
|--------|---------------------------|------------|-----------|-----------------|--------------|
| UC-001 | [FILL]                    | [ ] Pass   | [ ] Pass  | [ ] Pass        | [FILL]       |
| UC-002 | [FILL]                    | [ ] Pass   | [ ] Pass  | [ ] Pass        | [FILL]       |
| ...    | ...                       | ...        | ...       | ...             | ...          |

---

### 3.4 — Failure Decision Logic

> When a test or scenario fails during validation, use this decision tree — do not make ad hoc decisions.

```
A failure is detected.
│
├── Q1: Is the failure caused by a code defect?
│     (The requirement is correct, but the implementation is wrong)
│     └── YES → DEFECT PATH
│               ├── Log a defect with: TC ID, ERS ID, observed vs. expected behavior
│               ├── Assign severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
│               ├── Return to Phase 2 (do not alter Phase 1 artifacts)
│               └── Re-run full validation after fix
│
├── Q2: Is the failure caused by an incorrect or incomplete requirement?
│     (The test was valid, but the requirement turned out to be wrong or missing context)
│     └── YES → REQUIREMENT REVISION PATH
│               ├── Document the gap in Section 3.5 below
│               ├── Escalate to stakeholder for approval before any change
│               ├── Return to Phase 1, revise ERS, revise TC, get approval
│               └── Return to Phase 2 to implement revised requirement
│
├── Q3: Is the failure caused by a broken test (setup/environment issue)?
│     (The assertion is correct, but the test infrastructure is broken)
│     └── YES → INFRASTRUCTURE PATH
│               ├── Fix the test setup — NOT the assertion
│               ├── Document what was fixed and why
│               └── Re-run validation
│
└── Q4: Is the failure an accepted known limitation / deferred item?
      └── YES → DEFERRAL PATH
                ├── Document formally in Section 3.6
                ├── Create a backlog ticket for the deferred item
                ├── Obtain written sign-off from tech lead AND stakeholder
                └── Note in release documentation
```

---

### 3.5 — Requirement Revision Log

> Any time a Phase 1 artifact must change as a result of validation findings, log it here.

```
REVISION-[###]
─────────────────────────────────────────────────────────────
DATE               : [FILL]
TRIGGERED BY       : [FILL — TC ID and/or validation finding]
ORIGINAL ERS/TC    : [FILL]
REASON FOR REVISION: [FILL — what was wrong or incomplete about the original spec?]
CHANGE MADE        : [FILL — what was updated?]
APPROVED BY        : [FILL — stakeholder or tech lead sign-off]
RE-VALIDATION DATE : [FILL]
```

---

### 3.6 — Deferral Register

> Deferred items are not failures swept under the rug. They are accepted technical debt with a paper trail.

| Deferral ID | ERS/TC ID | Reason for Deferral      | Risk Assessment | Backlog Ticket | Sign-off       |
|-------------|-----------|--------------------------|-----------------|----------------|----------------|
| DEF-001     | [FILL]    | [FILL]                   | [FILL]          | [FILL]         | [FILL]         |

---

### 3.7 — Regression Check

If this project modifies existing functionality, confirm that existing tests were not broken:

```
PRE-EXISTING TESTS BEFORE THIS WORK  : [FILL]
PRE-EXISTING TESTS PASSING NOW       : [FILL]
REGRESSIONS INTRODUCED               : [ ] Yes (list below)  [ ] No
REGRESSION DETAILS                   : [FILL if yes]
```

---

### 3.8 — Phase 3 Exit Criteria

- [ ] Full test suite has been run in a clean environment
- [ ] Traceability matrix is complete — every ERS has a recorded result
- [ ] All use case scenarios have been walked through and recorded
- [ ] All failures have been processed through the decision logic (3.4)
- [ ] Requirement revisions are logged and approved (if any)
- [ ] Deferrals are logged with backlog tickets and sign-offs (if any)
- [ ] Regression check completed with 0 new regressions (or regressions documented and accepted)
- [ ] 100% of Critical and High ERS have status `VERIFIED`
- [ ] ≥95% of Medium and Low ERS have status `VERIFIED`

---

🔒 **GATE 3 — VALIDATION COMPLETE**
*Nothing ships before this gate is closed.*

---

## PHASE 4 — RELEASE SIGN-OFF
*Time estimate: 30 minutes*

### Purpose
Create a final, auditable record that this feature was built to specification and validated before release.

### 4.1 — Release Readiness Summary

```
PROJECT NAME             : [FILL]
VERSION / RELEASE TAG    : [FILL]
RELEASE DATE             : [FILL]
─────────────────────────────────────────────────────────────
TOTAL ERS                : [FILL]
  Verified               : [FILL]
  Deferred               : [FILL]
  Failed (blocked)       : [FILL — must be 0 for Critical/High to release]
─────────────────────────────────────────────────────────────
TOTAL TEST CASES         : [FILL]
  Passing                : [FILL]
  Deferred               : [FILL]
  Failing (blocked)      : [FILL — must be 0 for Critical/High to release]
─────────────────────────────────────────────────────────────
KNOWN LIMITATIONS        : [FILL — or "None"]
DEFERRED ITEMS           : [FILL — backlog ticket numbers or "None"]
DOCUMENTATION UPDATED    : [ ] Yes  [ ] N/A
─────────────────────────────────────────────────────────────
RELEASE DECISION         : [ ] APPROVED TO RELEASE
                           [ ] BLOCKED — see failures above
                           [ ] CONDITIONAL — release with noted deferrals
```

### 4.2 — Sign-offs

```
LEAD DEVELOPER    : _________________________ DATE: ________
QA OWNER          : _________________________ DATE: ________
STAKEHOLDER       : _________________________ DATE: ________
TECH LEAD         : _________________________ DATE: ________
```

---

## APPENDIX A — TDD Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│  THE TDD CYCLE                                                       │
│                                                                      │
│   1. RED    → Write a test that fails                               │
│   2. GREEN  → Write the minimum code to make it pass                │
│   3. REFACTOR → Clean the code without changing behavior            │
│                                                                      │
│  The cycle is: minutes, not hours. If a single Red→Green            │
│  cycle takes more than 30 minutes, the test is too large.           │
│  Break it down.                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## APPENDIX B — Common Failure Patterns and Remedies

| Symptom                                  | Root Cause                            | Remedy                                           |
|------------------------------------------|---------------------------------------|--------------------------------------------------|
| Tests pass but feature feels wrong       | ERS acceptance signal was too vague   | Revise ERS acceptance signal. Add UC scenarios.  |
| Developer modified test to force pass    | Test was testing the wrong thing      | Revert code AND test. Revisit ERS together.      |
| Many tests failing during validation     | Phase 1 ERS were not reviewed         | Enforce the APPROVED status gate in future.      |
| Scope expanded mid-development           | Undisciplined Phase 2 execution       | Revert additions. Route through Phase 1 gate.    |
| Test suite passes but prod breaks        | Missing integration / E2E coverage    | Add UC scenarios to Phase 1 on next project.     |
| Phase 1 taking too long                  | Requirements were not actually known  | Timebox discovery. Spike first. Then plan.        |
| "We'll write tests later"                | Process breakdown                     | Gate 1 is a hard stop. No exceptions.            |

## APPENDIX C — Phase Time Budget Guide

| Project Scale  | Phase 0 | Phase 1  | Phase 2   | Phase 3 | Total Planning:Dev Ratio |
|----------------|---------|----------|-----------|---------|--------------------------|
| Small (<1 week)| 30 min  | 2–3 hrs  | 1–3 days  | 2 hrs   | ~30% planning            |
| Medium (1–4 wk)| 1 hr    | 4–8 hrs  | 1–3 weeks | 4 hrs   | ~25% planning            |
| Large (>1 month| 2 hrs   | 2–3 days | 3–8 weeks | 1–2 days| ~20% planning            |

> **The planning ratio feels high until you've experienced the cost of unplanned development.** Time spent in Phase 1 typically returns 3x–5x in reduced rework.

---

## APPENDIX D — Document Revision History

| Version | Date       | Author | Change Description           |
|---------|------------|--------|------------------------------|
| 1.0     | [FILL]     | [FILL] | Initial framework creation   |

---

*This document and all phase artifacts should be committed to the project repository. They are the audit trail that proves the system was built to specification.*
