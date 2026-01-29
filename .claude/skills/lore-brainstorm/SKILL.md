---
name: lore-brainstorm
description: Deep collaborative lore creation for The Whisker Shogunate. Use for complex world-building that needs exploration, multiple approaches, or extended creative sessions.
---

# Lore Brainstorming Session

For when you want to go deep on a lore topic — not just quick capture, but real exploration.

## Phase 1: Understand the Idea

**Start by gathering context:**

```
search_lore("<topic>")
list_entries("<relevant_category>")
```

Then ask questions **one at a time** to refine the idea:
- What's the core concept?
- Where does this fit in the world? (province, faction, time period)
- What feeling or purpose should it serve?
- Any constraints or must-haves?

**Prefer multiple choice when possible** — easier to answer than open-ended.

## Phase 2: Explore Approaches

Once you understand the concept, propose **2-3 different approaches**:

```markdown
I see three ways this could work:

**A) [Approach Name]** (Recommended)
[2-3 sentences on what this means and why you recommend it]

**B) [Approach Name]**
[2-3 sentences on trade-offs]

**C) [Approach Name]**
[2-3 sentences on trade-offs]

Which direction resonates?
```

Lead with your recommendation and explain why.

## Phase 3: Draft in Sections

Once direction is chosen, present the lore **in sections of 200-300 words**:

```markdown
Here's the first section — the overview:

**[Title in Japanese-style + English]**

[200-300 words of lore prose...]

---

Does this feel right so far? I can adjust the tone, add more detail, or take a different angle.
```

After each section, **check if it looks right** before continuing.

Cover as relevant:
- Overview / purpose
- Physical description (if location/building)
- Key figures (if organization/faction)
- Daily life / operations
- Connections to existing lore
- Cultural significance
- Interesting quirks or tensions

## Phase 4: World Rule Check

Before finalizing, verify against rules:

| Rule | ✓/✗ |
|------|-----|
| No mammal meat (fish only) | |
| No toxic foods | |
| Whisker-Punk aesthetic | |
| Warm color palette | |
| No violence | |
| No clear villains | |
| Magical realism intact | |

If any violations, suggest corrections.

## Phase 5: Save & Connect

When the user approves:

```
create_entry({
  title: "...",
  content: "...",
  category: "...",
  tags: ["...", "..."]
})
```

Then search for connections and suggest next steps.

## Key Principles

- **One question at a time** — Don't overwhelm
- **Multiple choice preferred** — When possible
- **2-3 approaches** — Always explore alternatives
- **Section-by-section** — Validate incrementally
- **World rules always** — Check before saving
- **Connections matter** — Link to existing lore

## Creative Rut Toolkit

If the user is stuck, offer one of these:

**Random Inspiration:**
```
list_entries()
```
Find a category with few entries and propose expansion.

**Guided Discovery:**
"Let's discover something. Quick answers only:
1. Pick a province: [list 5]
2. Time of day: dawn / day / dusk / night
3. A problem someone might have: [open]"

**Gap Analysis:**
```
list_categories()
```
Show entry counts, highlight underdeveloped areas.

**"What If" Scenarios:**
- What if a guild had a secret tradition?
- What if two provinces had conflicting customs?
- What if a newcomer cat refused to transform fully?
