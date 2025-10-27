// Phase 1 scaffold: AI usage tracker
// TODO Phase 2: Persist to AIUsageEvent, aggregate usage

export interface AiMonthlySummary {
  month: string; // YYYY-MM
  totalTokens: number;
  totalCost: number;
}

export class AIUsageTracker {
  async logEvent(
    orgId: string,
    feature: string,
    tokensUsed: number,
  ): Promise<void> {
    // TODO Phase 2: Log to AIUsageEvent table
    void orgId;
    void feature;
    void tokensUsed;
  }

  async getCurrentMonthUsage(orgId: string): Promise<AiMonthlySummary> {
    // TODO Phase 2: Query current month usage
    void orgId;
    return { month: "", totalTokens: 0, totalCost: 0 };
  }

  async checkBudget(
    orgId: string,
  ): Promise<{ withinBudget: boolean; percentUsed: number }> {
    // TODO Phase 2: Compare usage to org budget
    void orgId;
    return { withinBudget: true, percentUsed: 0 };
  }
}
