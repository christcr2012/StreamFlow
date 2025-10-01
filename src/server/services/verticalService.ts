// src/server/services/verticalService.ts
// Vertical-specific configuration and AI task management
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';

export { ServiceError };

// ===== VERTICAL TYPES =====

export const VERTICALS = {
  CLEANING: 'cleaning',
  FENCING: 'fencing',
  CONCRETE: 'concrete',
  WINDOWS_DOORS: 'windows_doors',
  ROLLOFF: 'rolloff',
  PORTAJOHN: 'portajohn',
  TRUCKING: 'trucking',
  HVAC: 'hvac',
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  LANDSCAPING: 'landscaping',
  ROOFING: 'roofing',
  PAINTING: 'painting',
  FLOORING: 'flooring',
  PEST_CONTROL: 'pest_control',
  POOL_SERVICE: 'pool_service',
  APPLIANCE_REPAIR: 'appliance_repair',
  LOCKSMITH: 'locksmith',
  MOVING: 'moving',
  JUNK_REMOVAL: 'junk_removal',
} as const;

export type VerticalType = typeof VERTICALS[keyof typeof VERTICALS];

// ===== SCHEMAS =====

export const VerticalConfigSchema = z.object({
  vertical: z.string(),
  enabledAiTasks: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

// ===== VERTICAL SERVICE =====

export class VerticalService {
  /**
   * Get or create vertical config (cached)
   */
  async getConfig(orgId: string) {
    // Try cache first
    const cacheKey = CacheKeys.verticalConfig(orgId);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached as any;

    let config = await prisma.verticalConfig.findUnique({
      where: { orgId },
    });

    if (!config) {
      // Create default config (no vertical selected yet)
      config = await prisma.verticalConfig.create({
        data: {
          orgId,
          vertical: '',
          enabledAiTasks: [],
          customFields: {},
          settings: {},
        },
      });
    }

    // Cache for 1 hour
    await cache.set(cacheKey, config, CacheTTL.LONG);

    return config;
  }

  /**
   * Set vertical for org
   */
  async setVertical(
    orgId: string,
    userId: string,
    vertical: string
  ) {
    const config = await prisma.verticalConfig.upsert({
      where: { orgId },
      create: {
        orgId,
        vertical,
        enabledAiTasks: this.getDefaultAiTasks(vertical),
        customFields: {},
        settings: {},
      },
      update: {
        vertical,
        enabledAiTasks: this.getDefaultAiTasks(vertical),
      },
    });

    // Invalidate cache
    await cache.delete(CacheKeys.verticalConfig(orgId));

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'vertical.set',
        entityType: 'verticalConfig',
        entityId: config.id,
        delta: { vertical },
      },
    });

    return config;
  }

  /**
   * Enable AI task for vertical
   */
  async enableAiTask(
    orgId: string,
    userId: string,
    taskId: string
  ) {
    const config = await this.getConfig(orgId);
    const enabledTasks = (config.enabledAiTasks as string[]) || [];

    if (!enabledTasks.includes(taskId)) {
      enabledTasks.push(taskId);
    }

    const updated = await prisma.verticalConfig.update({
      where: { orgId },
      data: { enabledAiTasks: enabledTasks },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'vertical.ai_task.enable',
        entityType: 'verticalConfig',
        entityId: config.id,
        delta: { taskId },
      },
    });

    return updated;
  }

  /**
   * Disable AI task
   */
  async disableAiTask(
    orgId: string,
    userId: string,
    taskId: string
  ) {
    const config = await this.getConfig(orgId);
    const enabledTasks = ((config.enabledAiTasks as string[]) || []).filter(
      t => t !== taskId
    );

    const updated = await prisma.verticalConfig.update({
      where: { orgId },
      data: { enabledAiTasks: enabledTasks },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'vertical.ai_task.disable',
        entityType: 'verticalConfig',
        entityId: config.id,
        delta: { taskId },
      },
    });

    return updated;
  }

  /**
   * Update custom fields
   */
  async updateCustomFields(
    orgId: string,
    userId: string,
    customFields: Record<string, any>
  ) {
    const config = await prisma.verticalConfig.update({
      where: { orgId },
      data: { customFields: customFields as any },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'vertical.custom_fields.update',
        entityType: 'verticalConfig',
        entityId: config.id,
        delta: { customFields },
      },
    });

    return config;
  }

  /**
   * Get default AI tasks for vertical
   */
  private getDefaultAiTasks(vertical: string): string[] {
    const defaults: Record<string, string[]> = {
      [VERTICALS.CLEANING]: [
        'route_optimizer',
        'qa_checklist',
        'recurring_scheduler',
      ],
      [VERTICALS.FENCING]: [
        'bom_calculator',
        'proposal_generator',
        'measurement_estimator',
      ],
      [VERTICALS.CONCRETE]: [
        'void_calculator',
        'sealing_scheduler',
        'weather_advisor',
      ],
      [VERTICALS.WINDOWS_DOORS]: [
        'measurement_estimator',
        'warranty_tracker',
        'install_scheduler',
      ],
      [VERTICALS.ROLLOFF]: [
        'dispatch_optimizer',
        'utilization_forecaster',
        'route_planner',
      ],
      [VERTICALS.PORTAJOHN]: [
        'service_route_builder',
        'event_capacity_planner',
        'maintenance_scheduler',
      ],
      [VERTICALS.TRUCKING]: [
        'load_planner',
        'hos_aware_router',
        'fuel_optimizer',
      ],
      [VERTICALS.HVAC]: [
        'maintenance_planner',
        'energy_analyzer',
        'diagnostic_assistant',
      ],
      [VERTICALS.PLUMBING]: [
        'diagnostic_assistant',
        'parts_recommender',
        'emergency_dispatcher',
      ],
    };

    return defaults[vertical] || [];
  }

  /**
   * Get available AI tasks for vertical
   */
  getAvailableAiTasks(vertical: string) {
    // This would come from the Master_Vertical_AI_Catalog
    // For now, return the defaults
    return this.getDefaultAiTasks(vertical);
  }
}

export const verticalService = new VerticalService();

