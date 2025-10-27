// Phase 1 scaffold: Recurring job creation
// TODO Phase 2: Generate jobs from recurring contracts and notify customers

export interface Job {
  id: string;
  date: string;
}

export class RecurringJobCreator {
  async createJobs(
    contractId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Job[]> {
    // TODO Phase 2: Generate recurring jobs from contract
    void contractId;
    void startDate;
    void endDate;
    return [];
  }

  async sendConfirmations(jobs: Job[]): Promise<void> {
    // TODO Phase 2: Send job confirmations to customers
    void jobs;
  }

  async updateNextRun(contractId: string): Promise<void> {
    // TODO Phase 2: Update nextOccurrence date
    void contractId;
  }
}
