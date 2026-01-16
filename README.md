# The Whisker Shogunate

A world-building project for an idle/life-sim game set in **Neko-kuni**, a feudal Japan-inspired world built by and for cats.

**[Browse the Lore](https://alexcatdad.github.io/the-whisker-shogunate/)**

## The Concept

Players control isekai'd cats—deceased or abandoned cats from our world who arrive via the Great Torii Gate and build new lives in a society powered by Whisker-Punk technology.

- **Genre**: Idle/life-sim game with deep world-building
- **Setting**: Feudal Japan aesthetic + Ghibli-inspired steampunk
- **Theme**: Second chances, finding purpose, transformation
- **Tone**: Cozy but meaningful, hopeful but grounded

## The Five Provinces

1. **Higashi-hama** (East Shore) - Landing province for newcomers
2. **Kawa-no-kuni** (River Country) - Agricultural heartland
3. **Yama-takumi** (Mountain Forge) - Industrial engineering hub
4. **Mori-shizuka** (Silent Forest) - Spiritual/medical center
5. **Minato-kassei** (Thriving Port) - Trade capital

## Core Theme

> **Becoming yourself is the greatest adventure.**

Every isekai'd cat faces the existential challenge of transitioning from a small, dependent animal to a fully sentient being. The idle game mechanics gain emotional weight because progress = helping your cat find peace, purpose, and identity.

## Project Structure

```
the-whisker-shogunate/
├── lore-server/          # MCP server for lore database
│   ├── src/              # Server source code
│   └── data/lore_db/     # LanceDB database (188 entries)
├── website/              # Astro static site
│   └── src/              # Components, layouts, pages
├── scripts/              # Build utilities
│   └── export-lore.ts    # Export lore to markdown
└── originals-archive.zip # Original markdown files (archived)
```

## Development

**Prerequisites**: [Bun](https://bun.sh), [Ollama](https://ollama.ai) with `nomic-embed-text` model

```bash
# Install dependencies
bun install

# Run website locally
bun run website:dev

# Build website
bun run website:build
```

## Lore Database

The lore is stored in a LanceDB database with semantic search capabilities. Access it via the MCP server tools:

- `search_lore(query)` - Semantic search across all entries
- `list_entries(category?)` - Browse by category
- `get_entry(id)` - Fetch a single entry

Categories: architecture, characters, cuisine, culture, factions, flora, general, history, locations, politics, professions, society, technology, world

---

See `CLAUDE.md` for comprehensive world-building reference when working with AI assistants.
