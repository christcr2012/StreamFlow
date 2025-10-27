// Phase 1 scaffold: Import mapping service
// TODO Phase 2: Auto-detect columns, apply mapping, validate rows

export class ImportMapperService {
  async detectMapping(
    headers: string[],
    entityType: string,
  ): Promise<Record<string, string>> {
    // TODO Phase 2: Auto-detect column mappings
    void headers;
    void entityType;
    return {};
  }

  async applyMapping(row: any, mapping: Record<string, string>): Promise<any> {
    // TODO Phase 2: Apply mapping to row
    void mapping;
    return row;
  }

  async validateData(
    data: any[],
    entityType: string,
  ): Promise<{ valid: any[]; invalid: any[] }> {
    // TODO Phase 2: Validate imported data
    void data;
    void entityType;
    return { valid: [], invalid: [] };
  }
}
