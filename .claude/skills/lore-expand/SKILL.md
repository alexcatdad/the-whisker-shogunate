---
name: lore-expand
description: Plan and execute large lore expansions (e.g., "flesh out the Healer Guild"). Creates a structured plan of multiple related entries, then guides through creating each one.
---

# Lore Expansion Planning

For when you want to deeply develop an area of the world — not one entry, but a whole interconnected set.

## When to Use

- "Let's flesh out the Healer Guild"
- "I want to develop Mori-shizuka province fully"
- "Create a complete cuisine guide for the mountain region"
- "Build out the nocturnal economy"

## Phase 1: Scope the Expansion

**Gather existing context:**
```
search_lore("<topic>")
list_entries("<category>")
```

**Ask scoping questions (one at a time):**
- What's the heart of this expansion?
- How deep should we go? (3-5 entries / 5-10 entries / 10+)
- Any specific aspects you definitely want?
- Any aspects to skip?

## Phase 2: Create the Expansion Plan

Structure the plan as **bite-sized entries** with dependencies:

```markdown
## Expansion Plan: [Topic]

**Goal:** [One sentence]

**Entries to Create:** [N total]

---

### Entry 1: [Foundation Entry]
**Category:** [x]
**Purpose:** Establishes the core concept
**Depends on:** Nothing (start here)
**Content outline:**
- [Key point 1]
- [Key point 2]
- [Key point 3]

---

### Entry 2: [Building Block]
**Category:** [x]
**Purpose:** [What this adds]
**Depends on:** Entry 1
**Content outline:**
- [Key points]

---

### Entry 3: [Character/Detail]
**Category:** characters
**Purpose:** Brings the concept to life
**Depends on:** Entry 1, 2
**Content outline:**
- [Key points]

---

[Continue for all planned entries]
```

**Ask:** "Does this plan look right? Want to add, remove, or reorder anything?"

## Phase 3: Execute Entry by Entry

For each entry:

1. **Announce:** "Starting Entry N: [Title]"
2. **Draft:** Write ~200-400 words
3. **Check rules:** Verify world rules
4. **Confirm:** "Ready to save?"
5. **Save:** `create_entry(...)`
6. **Connect:** Note connections to previous entries
7. **Next:** Move to next entry or pause

**Offer checkpoints:**
- After every 3 entries: "Good stopping point. Continue or pause?"
- If energy seems low: "Want to pause and pick this up later?"

## Phase 4: Wrap Up

When complete:

```markdown
## Expansion Complete: [Topic]

**Entries created:** [N]

| # | Title | Category | ID |
|---|-------|----------|-----|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

**Connections made:**
- [Entry X] now references [Entry Y]
- [Existing entry Z] could be updated to mention this

**Future expansions this enables:**
- [Idea 1]
- [Idea 2]
```

## Key Principles

- **Dependencies matter** — Build foundation first
- **Checkpoints** — Don't exhaust the user
- **Flexibility** — Plan can change mid-execution
- **Connections** — Each entry should link to others
- **World rules** — Check every entry before saving
