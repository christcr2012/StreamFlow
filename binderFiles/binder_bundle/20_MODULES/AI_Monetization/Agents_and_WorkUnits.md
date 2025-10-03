# AI Agents & Work Units

## Agent Types
- Inbox, Estimate/Bid, Scheduling/Route, Collections, Marketing, Budget Guardian, Portal Concierge, Document Review.

## Work Units (Examples)
- `inbound_parse`, `reply_draft`, `estimate_draft`, `proposal_polish`, `route_optimize`, `anomaly_scan`, `qa_turn`, `doc_extract`, `completion_report`.

## Pricing
- Baseline included for light tasks; premium bands for heavy tasks.
- Tiers: Eco ×1, Standard ×2, Max ×5 per token block.

## Logging
- `ai_task`: tenant_id, agent_type, action_type, role, power_level, tokens_in/out, raw_cost_cents, price_cents, status, error_code.
