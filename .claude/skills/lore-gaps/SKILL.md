---
name: lore-gaps
description: Quick analysis of underdeveloped areas in the lore database. Shows entry counts by category and suggests what to expand.
---

# Lore Gap Analysis

Quick overview of what's underdeveloped in the world.

## Run Analysis

```
list_categories()
```

For each category, get count:
```
list_entries("<category>")
```

## Output Format

```markdown
## Lore Coverage Report

| Category | Entries | Status |
|----------|---------|--------|
| culture | 51 | ✅ Rich |
| flora | 22 | ✅ Good |
| factions | 21 | ✅ Good |
| society | 21 | ✅ Good |
| architecture | 17 | ✅ Good |
| cuisine | 15 | ⚠️ Could expand |
| technology | 12 | ⚠️ Could expand |
| general | 8 | — Core docs |
| locations | 5 | 🔴 Underdeveloped |
| history | 4 | 🔴 Underdeveloped |
| professions | 4 | 🔴 Underdeveloped |
| world | 4 | — Meta docs |
| politics | 3 | 🔴 Underdeveloped |
| characters | 1 | 🔴 Severely lacking |

**Total entries:** 188

---

## Expansion Opportunities

### High Priority (🔴)

**Characters (1 entry)**
The world has rich factions and professions but almost no named NPCs.
Suggestions:
- Guild leaders for each major guild
- A notable figure in each province
- Mentor characters for newcomers

**Professions (4 entries)**
Many professions mentioned but not detailed.
Suggestions:
- Chef specializations (sushi master, tea ceremony)
- Artisan crafts (paper making, textile dyeing)
- Night-specific jobs

**Politics (3 entries)**
Power structures exist but aren't fleshed out.
Suggestions:
- The three succession candidates
- Guild council dynamics
- Province governance

### Medium Priority (⚠️)

**Cuisine (15 entries)**
Good foundation but could expand:
- Regional specialties for each province
- Festival foods
- Street food culture

---

**Pick a gap to explore?**
```

## Follow-Up

If user picks a gap, transition to either:
- Quick capture (single entry)
- `/lore-brainstorm` (exploratory)
- `/lore-expand` (multiple entries)
