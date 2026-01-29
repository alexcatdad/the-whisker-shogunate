---
name: lore-audit
description: Audit lore entries for consistency with world rules. Scans entries, scores quality, and reports violations for food taboos, aesthetic, tone, or magical realism.
---

# Lore Consistency Audit

Systematic review of lore entries for world rule violations.

## Quick Audit (Spot Check)

Search for common violations:

```
search_lore("meat beef pork chicken lamb")
search_lore("grape onion chocolate garlic")
search_lore("enemy villain evil attack kill fight")
search_lore("hidden machinery concealed mechanism")
```

Report any hits as potential violations.

## Full Audit (Category or All)

### Step 1: Select Scope

```
list_categories()
list_entries("<category>")  # or all
```

### Step 2: Score Each Entry

For each entry, check:

| Rule | Weight | Check |
|------|--------|-------|
| Food compliance | High | No mammal meat, no toxic foods |
| Aesthetic match | High | Whisker-Punk, warm palette, cat-scaled |
| Tone alignment | Medium | Cozy, hopeful, no villains |
| Violence-free | High | No combat, no physical conflict |
| Magical realism | Medium | Doesn't over-explain mysteries |
| Connections | Low | References other entries appropriately |

**Scoring:**
- **A (90-100)**: Fully compliant, rich, well-connected
- **B (70-89)**: Compliant, minor improvements possible
- **C (50-69)**: Some issues, needs revision
- **D (30-49)**: Multiple violations
- **F (0-29)**: Severely non-compliant

### Step 3: Output Report

```markdown
## Lore Audit Report

**Scope:** [Category or "All"]
**Entries audited:** [N]
**Average score:** [X]/100

---

### Violations Found

#### Entry: "[Title]" (id: xxx)
**Score:** D (35/100)

| Rule | Score | Issue |
|------|-------|-------|
| Food compliance | 0/20 | Mentions "chicken skewers" |
| Aesthetic | 20/20 | ✓ |
| Tone | 10/20 | "bitter rivalry" sounds too harsh |
| Violence-free | 20/20 | ✓ |
| Magical realism | 15/20 | ✓ |

**Violations:**
1. "chicken skewers" → Should be "fish skewers" or "grilled sardines"
2. "bitter rivalry" → Soften to "professional tension" or "competing philosophies"

**Suggested fix:**
```
update_entry({
  id: "xxx",
  content: "[corrected content]"
})
```

---

#### Entry: "[Title]" (id: yyy)
...

---

### Summary

| Grade | Count |
|-------|-------|
| A | 45 |
| B | 30 |
| C | 10 |
| D | 3 |
| F | 0 |

**Most common issues:**
1. [Issue type]: [N occurrences]
2. [Issue type]: [N occurrences]

---

**Fix violations?** I can update entries one by one with your approval.
```

## Violation Quick Reference

### Food (Immediate Fix)
- Any mammal meat → fish/seafood equivalent
- Grapes → plums or berries
- Onions → green onions (mild) or ginger
- Chocolate → carob or sweet bean paste
- Garlic → mild herbs

### Tone (Soften)
- "enemy" → "rival" or "competitor"
- "villain" → "antagonist" or "opponent"
- "attack" → "confront" or "challenge"
- "fight" → "dispute" or "contest"
- "hatred" → "resentment" or "frustration"

### Aesthetic (Adjust)
- "hidden/concealed" → "tucked away but visible"
- "chrome/silver/steel" → "brass/copper/bronze"
- "cold/harsh" → "warm/welcoming"
- "sleek/minimal" → "ornate/decorated"
