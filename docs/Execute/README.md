<!-- STATUS: Reference-only. Treat binder/Execute docs as non-executable. Use codebase and current docs as the source of truth. See docs/AI_AGENT_REFERENCE.md. -->


# Cortiware — Augment Bundle v3.5
Generated: 2025-10-07 21:27:01

**Included (everything in one):**
- Phase 1 with **port-a-john** baked in
- Routing engine (capacity-based dump insertion + landfill selection)
- Agreements preset: roll-off rental grace after 30 days idle
- Seeds: assets, yards, landfills
- Importers:
  - Excel/XLSX (`importers/excel/*`)
  - Routeware Elements (`importers/routeware/*`)
  - AllyPro (`importers/allypro/*`)
- Templates for CSV/XLSX and AllyPro exports

**Run**
```bash
pnpm add xlsx fast-csv zod
node importers/excel/import_assets.mjs templates/assets.csv demo-fleet
node importers/routeware/routeware_to_corti.mjs
node importers/allypro/allypro_to_corti.mjs
```
