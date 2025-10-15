export type LeadData = Record<string, any>;

export const leadScoringService = {
  async scoreLead(lead: LeadData, _opts: any) {
    // Trivial scoring placeholder
    return { score: Math.min(100, (JSON.stringify(lead).length % 100) + 1), reasons: [] };
  },
  async scoreLeads(leads: LeadData[], opts: any) {
    const results = await Promise.all(leads.map((l: any) => this.scoreLead(l, opts)));
    return results;
  },
};

