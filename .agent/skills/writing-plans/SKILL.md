---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should ideally be run in a dedicated worktree (created via the brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**

- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agents:** REQUIRED: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Validation Strategy:** [Strict Mode + Spanish Localization]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**

- Create: `apps/api/src/modules/example/example.controller.ts`
- Modify: `apps/web/modules/example/hooks/use-example.ts`
- Test: `apps/api/src/modules/example/example.service.spec.ts`

**Step 1: Write the failing test**

```typescript
it("should perform specific behavior", () => {
  const result = service.calculate(input);
  expect(result).toBe(expected);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- example.service.spec.ts`
Expected: FAIL with "Property 'calculate' does not exist"

**Step 3: Write minimal implementation**

```typescript
calculate(input: any) {
    return expected;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- example.service.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/modules/example/
git commit -m "feat(api): add specific behavior to example service"
```
````

## Remember

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills by name
- Strict Zod/DTO + Spanish errors (implementing-strict-features skill)
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Same Session** - I execute tasks one by one with review between tasks, fast iteration

**2. Parallel Session** - Open new session, batch execution with checkpoints

**Which approach?"**

**If Same Session chosen:**

- **REQUIRED:** Read and follow the subagent-driven-development skill
- Stay in this session
- Fresh context per task + code review

**If Parallel Session chosen:**

- Guide the user to open new session in worktree
- **REQUIRED:** New session uses the executing-plans skill
