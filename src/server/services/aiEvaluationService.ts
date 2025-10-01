// src/server/services/aiEvaluationService.ts
// AI evaluation system: golden datasets, metrics, A/B testing, shadow mode
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { z } from 'zod';

export { ServiceError };

// ===== SCHEMAS =====

const CreateGoldenDatasetSchema = z.object({
  agentType: z.string(),
  actionType: z.string(),
  input: z.record(z.any()),
  expectedOutput: z.string(),
  metadata: z.record(z.any()).optional(),
});

const CreateEvaluationSchema = z.object({
  agentType: z.string(),
  actionType: z.string(),
  modelVersion: z.string(),
  input: z.record(z.any()),
  actualOutput: z.string(),
  expectedOutput: z.string().optional(),
  metrics: z.record(z.number()).optional(),
});

const CreateModelVersionSchema = z.object({
  agentType: z.string(),
  version: z.string(),
  modelName: z.string(),
  config: z.record(z.any()).optional(),
  status: z.enum(['shadow', 'canary', 'active', 'deprecated']).default('shadow'),
});

// ===== AI EVALUATION SERVICE =====

export class AiEvaluationService {
  /**
   * Create golden dataset entry
   */
  async createGoldenDataset(providerEmail: string, input: z.infer<typeof CreateGoldenDatasetSchema>) {
    const validated = CreateGoldenDatasetSchema.parse(input);

    const dataset = await prisma.aiGoldenDataset.create({
      data: {
        agentType: validated.agentType,
        actionType: validated.actionType,
        input: validated.input,
        expectedOutput: validated.expectedOutput,
        metadata: validated.metadata || {},
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: 'PROVIDER',
        actorId: providerEmail,
        action: 'ai.golden_dataset.create',
        entityType: 'aiGoldenDataset',
        entityId: dataset.id,
        delta: { agentType: validated.agentType, actionType: validated.actionType },
      },
    });

    return dataset;
  }

  /**
   * Get golden datasets for agent/action
   */
  async getGoldenDatasets(agentType: string, actionType?: string) {
    return prisma.aiGoldenDataset.findMany({
      where: {
        agentType,
        ...(actionType && { actionType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create evaluation result
   */
  async createEvaluation(input: z.infer<typeof CreateEvaluationSchema>) {
    const validated = CreateEvaluationSchema.parse(input);

    // Calculate metrics if not provided
    const metrics = validated.metrics || (validated.expectedOutput 
      ? this.calculateMetrics(validated.actualOutput, validated.expectedOutput)
      : {});

    const evaluation = await prisma.aiEvaluation.create({
      data: {
        agentType: validated.agentType,
        actionType: validated.actionType,
        modelVersion: validated.modelVersion,
        input: validated.input,
        actualOutput: validated.actualOutput,
        expectedOutput: validated.expectedOutput,
        metrics,
      },
    });

    return evaluation;
  }

  /**
   * Calculate metrics (ROUGE, BLEU, etc.)
   */
  private calculateMetrics(actual: string, expected: string): Record<string, number> {
    // Simple metrics for now (TODO: implement proper ROUGE/BLEU)
    const actualWords = actual.toLowerCase().split(/\s+/);
    const expectedWords = expected.toLowerCase().split(/\s+/);

    // Precision: % of actual words in expected
    const precision = actualWords.filter(w => expectedWords.includes(w)).length / actualWords.length;

    // Recall: % of expected words in actual
    const recall = expectedWords.filter(w => actualWords.includes(w)).length / expectedWords.length;

    // F1 score
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // Length ratio
    const lengthRatio = actualWords.length / expectedWords.length;

    return {
      precision: Math.round(precision * 100) / 100,
      recall: Math.round(recall * 100) / 100,
      f1: Math.round(f1 * 100) / 100,
      lengthRatio: Math.round(lengthRatio * 100) / 100,
    };
  }

  /**
   * Get evaluation metrics for model version
   */
  async getModelMetrics(agentType: string, modelVersion: string) {
    const evaluations = await prisma.aiEvaluation.findMany({
      where: { agentType, modelVersion },
    });

    if (evaluations.length === 0) {
      return {
        count: 0,
        avgPrecision: 0,
        avgRecall: 0,
        avgF1: 0,
      };
    }

    const metrics = evaluations.map(e => e.metrics as Record<string, number>);

    return {
      count: evaluations.length,
      avgPrecision: this.avg(metrics.map(m => m.precision || 0)),
      avgRecall: this.avg(metrics.map(m => m.recall || 0)),
      avgF1: this.avg(metrics.map(m => m.f1 || 0)),
    };
  }

  private avg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
  }

  /**
   * Create model version
   */
  async createModelVersion(providerEmail: string, input: z.infer<typeof CreateModelVersionSchema>) {
    const validated = CreateModelVersionSchema.parse(input);

    const modelVersion = await prisma.aiModelVersion.create({
      data: {
        agentType: validated.agentType,
        version: validated.version,
        modelName: validated.modelName,
        config: validated.config || {},
        status: validated.status,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: 'PROVIDER',
        actorId: providerEmail,
        action: 'ai.model_version.create',
        entityType: 'aiModelVersion',
        entityId: modelVersion.id,
        delta: { agentType: validated.agentType, version: validated.version, status: validated.status },
      },
    });

    return modelVersion;
  }

  /**
   * Update model version status
   */
  async updateModelStatus(
    providerEmail: string,
    modelVersionId: string,
    status: 'shadow' | 'canary' | 'active' | 'deprecated'
  ) {
    const modelVersion = await prisma.aiModelVersion.update({
      where: { id: modelVersionId },
      data: { status },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: 'PROVIDER',
        actorId: providerEmail,
        action: 'ai.model_version.update_status',
        entityType: 'aiModelVersion',
        entityId: modelVersionId,
        delta: { status },
      },
    });

    return modelVersion;
  }

  /**
   * Get model version for org (A/B testing)
   */
  async getModelVersionForOrg(orgId: string, agentType: string): Promise<string> {
    // Check if org has pinned version
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });

    const settings = (org?.settings as any) || {};
    const pinnedVersions = settings.aiModelVersions || {};

    if (pinnedVersions[agentType]) {
      return pinnedVersions[agentType];
    }

    // Get active model version
    const activeModel = await prisma.aiModelVersion.findFirst({
      where: {
        agentType,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeModel) {
      return activeModel.version;
    }

    // Default version
    return 'v1.0';
  }

  /**
   * Assign org to A/B test
   */
  async assignToABTest(
    providerEmail: string,
    orgId: string,
    agentType: string,
    modelVersion: string
  ) {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });

    const settings = (org?.settings as any) || {};
    const pinnedVersions = settings.aiModelVersions || {};
    pinnedVersions[agentType] = modelVersion;

    await prisma.org.update({
      where: { id: orgId },
      data: {
        settings: {
          ...settings,
          aiModelVersions: pinnedVersions,
        } as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: providerEmail,
        action: 'ai.ab_test.assign',
        entityType: 'org',
        entityId: orgId,
        delta: { agentType, modelVersion },
      },
    });

    return { success: true, orgId, agentType, modelVersion };
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(agentType: string) {
    const modelVersions = await prisma.aiModelVersion.findMany({
      where: { agentType },
    });

    const results = [];

    for (const model of modelVersions) {
      const metrics = await this.getModelMetrics(agentType, model.version);
      
      // Count orgs using this version
      const orgs = await prisma.org.findMany({
        select: { id: true, settings: true },
      });

      const orgsUsingVersion = orgs.filter(org => {
        const settings = (org.settings as any) || {};
        const pinnedVersions = settings.aiModelVersions || {};
        return pinnedVersions[agentType] === model.version;
      }).length;

      results.push({
        version: model.version,
        status: model.status,
        orgsCount: orgsUsingVersion,
        ...metrics,
      });
    }

    return results;
  }
}

export const aiEvaluationService = new AiEvaluationService();

