# Rolloff Dumpster — AI Tasks

- Dispatch Optimizer: assign trucks+containers, minimize landfill runs.
- Utilization Forecaster: predict when units become full by location/job type.
- Landfill Trip Consolidator: suggest best dump windows.

APIs: `POST /tenant/ai/rolloff/dispatch_optimize`, `.../forecast_utilization`.
Acceptance: optimization under 8s; forecast includes confidence and next-action suggestion.
