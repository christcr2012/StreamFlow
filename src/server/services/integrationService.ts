import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schemas for integration configs
const PaylocityConfigSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  company_id: z.string().min(1),
});

const GeotabConfigSchema = z.object({
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

const HolmanConfigSchema = z.object({
  api_key: z.string().min(1),
  account_id: z.string().min(1),
});

export class IntegrationService {
  /**
   * Connect Paylocity integration
   */
  async connectPaylocity(
    orgId: string,
    userId: string,
    config: z.infer<typeof PaylocityConfigSchema>
  ) {
    const validated = PaylocityConfigSchema.parse(config);

    // Check if integration already exists
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type: 'paylocity',
      },
    });

    let integration;
    if (existing) {
      // Update existing
      integration = await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          config: validated as any,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      integration = await prisma.integrationConfig.create({
        data: {
          orgId,
          type: 'paylocity',
          status: 'connected',
          config: validated as any,
        },
      });
    }

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: existing ? 'update' : 'create',
        resource: `integration:paylocity:${integration.id}`,
        meta: {
          type: 'paylocity',
          status: 'connected',
        },
      },
    });

    return integration;
  }

  /**
   * Connect Geotab integration
   */
  async connectGeotab(
    orgId: string,
    userId: string,
    config: z.infer<typeof GeotabConfigSchema>
  ) {
    const validated = GeotabConfigSchema.parse(config);

    // Check if integration already exists
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type: 'geotab',
      },
    });

    let integration;
    if (existing) {
      // Update existing
      integration = await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          config: validated as any,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      integration = await prisma.integrationConfig.create({
        data: {
          orgId,
          type: 'geotab',
          status: 'connected',
          config: validated as any,
        },
      });
    }

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: existing ? 'update' : 'create',
        resource: `integration:geotab:${integration.id}`,
        meta: {
          type: 'geotab',
          status: 'connected',
        },
      },
    });

    return integration;
  }

  /**
   * Connect Holman integration (optional)
   */
  async connectHolman(
    orgId: string,
    userId: string,
    config: z.infer<typeof HolmanConfigSchema>
  ) {
    const validated = HolmanConfigSchema.parse(config);

    // Check if integration already exists
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type: 'holman',
      },
    });

    let integration;
    if (existing) {
      // Update existing
      integration = await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          config: validated as any,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      integration = await prisma.integrationConfig.create({
        data: {
          orgId,
          type: 'holman',
          status: 'connected',
          config: validated as any,
        },
      });
    }

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: existing ? 'update' : 'create',
        resource: `integration:holman:${integration.id}`,
        meta: {
          type: 'holman',
          status: 'connected',
        },
      },
    });

    return integration;
  }

  /**
   * Disconnect integration
   */
  async disconnect(orgId: string, userId: string, type: string) {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type,
      },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const updated = await prisma.integrationConfig.update({
      where: { id: integration.id },
      data: {
        status: 'disconnected',
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'disconnect',
        resource: `integration:${type}:${integration.id}`,
        meta: {
          type,
          status: 'disconnected',
        },
      },
    });

    return updated;
  }

  /**
   * Get integration status
   */
  async getStatus(orgId: string, type: string) {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type,
      },
    });

    if (!integration) {
      return {
        type,
        status: 'disconnected',
        connected: false,
      };
    }

    return {
      type,
      status: integration.status,
      connected: integration.status === 'connected',
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  /**
   * List all integrations for org
   */
  async listIntegrations(orgId: string) {
    const integrations = await prisma.integrationConfig.findMany({
      where: { orgId },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return integrations;
  }

  /**
   * Process Geotab DVIR log and create maintenance ticket if needed
   */
  async processGeotabDvir(orgId: string, dvirData: any) {
    // Create DVIR log entry
    const dvir = await prisma.geotabDvirLog.create({
      data: {
        orgId,
        deviceId: dvirData.device_id,
        driverId: dvirData.driver_id,
        defects: dvirData.defects as any,
        certifiedAt: new Date(dvirData.certified_at),
        status: 'new',
        raw: dvirData as any,
      },
    });

    // If there are defects, create maintenance ticket
    if (dvirData.defects && Array.isArray(dvirData.defects) && dvirData.defects.length > 0) {
      // Find vehicle by device_id
      const vehicle = await prisma.fleetVehicle.findFirst({
        where: {
          orgId,
          metadata: {
            path: ['geotab_device_id'],
            equals: dvirData.device_id,
          },
        },
      });

      if (vehicle) {
        await prisma.fleetMaintenanceTicket.create({
          data: {
            orgId,
            vehicleId: vehicle.id,
            title: `DVIR Defects - ${vehicle.assetTag || vehicle.plate}`,
            description: `Defects found during DVIR inspection:\n${dvirData.defects.map((d: any) => `- ${d.description}`).join('\n')}`,
            severity: 'high',
            status: 'open',
            dvirRef: dvir.id,
            openedAt: new Date(),
          },
        });

        // Update DVIR status
        await prisma.geotabDvirLog.update({
          where: { id: dvir.id },
          data: { status: 'processed' },
        });
      }
    }

    return dvir;
  }
}

export const integrationService = new IntegrationService();

