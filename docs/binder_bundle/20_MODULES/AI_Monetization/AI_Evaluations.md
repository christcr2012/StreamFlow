# AI Evaluations & Release

- Golden datasets per agent/action.
- Metrics: ROUGE/BLEU for drafts; % travel time saved for routing; precision/recall for anomaly; CSAT proxy for portal Q&A.
- Shadow mode → canary → percentage rollout; tenants may pin prior versions.
- No online learning; policy packs versioned and audited.
