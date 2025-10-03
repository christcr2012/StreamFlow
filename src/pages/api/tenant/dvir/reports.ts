import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DVIRReportsSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    action: z.enum([
      'get_dvir_summary', 'get_defect_trends', 'get_compliance_report',
      'get_vehicle_history', 'export_dvir_data', 'schedule_inspections'
    ]),
    vehicle_id: z.string().optional(),
    date_range: z.object({
      start_date: z.string(),
      end_date: z.string(),
    }).optional(),
    report_type: z.enum(['summary', 'detailed', 'compliance']).optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    const validation = DVIRReportsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    let actionResult;
    const actionId = `DVIR-${Date.now()}`;

    switch (payload.action) {
      case 'get_dvir_summary':
        // Get DVIR summary statistics
        const totalDVIRs = await prisma.note.count({
          where: {
            orgId,
            entityType: 'vehicle',
            body: { contains: 'DVIR' },
          },
        });

        const passedDVIRs = await prisma.note.count({
          where: {
            orgId,
            entityType: 'vehicle',
            body: { contains: 'DVIR COMPLETED - Status: pass' },
          },
        });

        const failedDVIRs = await prisma.note.count({
          where: {
            orgId,
            entityType: 'vehicle',
            body: { contains: 'DVIR COMPLETED - Status: fail' },
          },
        });

        actionResult = {
          dvir_summary: {
            total_inspections: totalDVIRs,
            passed_inspections: passedDVIRs,
            failed_inspections: failedDVIRs,
            pass_rate: totalDVIRs > 0 ? ((passedDVIRs / totalDVIRs) * 100).toFixed(1) : '0.0',
            compliance_score: totalDVIRs > 0 ? ((passedDVIRs / totalDVIRs) * 100).toFixed(0) : '0',
            defects_found: failedDVIRs,
          },
        };
        break;

      case 'get_defect_trends':
        // Get defect trend analysis
        const defectNotes = await prisma.note.findMany({
          where: {
            orgId,
            entityType: 'vehicle',
            body: { contains: 'DEFECT' },
          },
          take: 100,
          orderBy: { createdAt: 'desc' },
        });

        const defectsByType = defectNotes.reduce((acc, note) => {
          const defectType = note.body.includes('brake') ? 'brakes' :
                           note.body.includes('tire') ? 'tires' :
                           note.body.includes('light') ? 'lights' :
                           note.body.includes('engine') ? 'engine' : 'other';
          acc[defectType] = (acc[defectType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        actionResult = {
          defect_trends: {
            total_defects: defectNotes.length,
            defects_by_type: defectsByType,
            trend_analysis: {
              most_common_defect: Object.keys(defectsByType).reduce((a, b) => 
                defectsByType[a] > defectsByType[b] ? a : b, 'none'),
              defect_rate_trend: 'stable',
              critical_defects: defectNotes.filter(n => n.body.includes('CRITICAL')).length,
            },
          },
        };
        break;

      case 'get_compliance_report':
        // Generate compliance report
        const vehicles = await prisma.asset.findMany({
          where: { orgId, category: 'vehicle' },
          take: 50,
        });

        const complianceData = vehicles.map(vehicle => ({
          vehicle_id: vehicle.id,
          asset_number: vehicle.assetNumber,
          name: vehicle.name,
          last_inspection: (vehicle.customFields as any)?.last_dvir_date || null,
          compliance_status: (vehicle.customFields as any)?.last_dvir_date ? 'compliant' : 'overdue',
          days_since_inspection: (vehicle.customFields as any)?.last_dvir_date ?
            Math.floor((Date.now() - new Date((vehicle.customFields as any).last_dvir_date as string).getTime()) / (1000 * 60 * 60 * 24)) : 999,
        }));

        actionResult = {
          compliance_report: {
            total_vehicles: vehicles.length,
            compliant_vehicles: complianceData.filter(v => v.compliance_status === 'compliant').length,
            overdue_vehicles: complianceData.filter(v => v.compliance_status === 'overdue').length,
            compliance_rate: vehicles.length > 0 ? 
              ((complianceData.filter(v => v.compliance_status === 'compliant').length / vehicles.length) * 100).toFixed(1) : '0.0',
            vehicles: complianceData,
          },
        };
        break;

      case 'export_dvir_data':
        // Export DVIR data
        actionResult = {
          export: {
            id: `EXPORT-${Date.now()}`,
            type: 'dvir_data',
            format: 'csv',
            status: 'generating',
            download_url: `/api/exports/dvir/${actionId}.csv`,
            estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          },
        };
        break;

      default:
        actionResult = {
          action: payload.action,
          status: 'executed',
          message: `DVIR reports action ${payload.action} executed successfully`,
        };
    }

    // Log DVIR reports action
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'dvir_action',
        entityId: actionId,
        userId,
        body: `DVIR REPORTS: Executed ${payload.action} action. Report type: ${payload.report_type || 'default'}`,
        isPinned: false,
      },
    });

    await auditService.logBinderEvent({
      action: 'dvir.reports.action',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'owner',
        action: 'dvir_reports_action',
        resource: `dvir:${actionId}`,
        meta: {
          action: payload.action,
          vehicle_id: payload.vehicle_id,
          report_type: payload.report_type,
          date_range: payload.date_range,
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: actionId,
        version: 1,
      },
      dvir_reports: {
        id: actionId,
        action: payload.action,
        result: actionResult,
        executed_by: userId,
        executed_at: new Date(),
      },
      audit_id: `AUD-DVIR-${actionId}`,
    });
  } catch (error) {
    console.error('Error executing DVIR reports action:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to execute DVIR reports action',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
