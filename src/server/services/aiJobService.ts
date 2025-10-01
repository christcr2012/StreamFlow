// src/server/services/aiJobService.ts
// AI-powered job automation: summaries, completion reports, anomaly detection
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { aiTaskService } from './aiTaskService';

export { ServiceError };

// ===== AI JOB SERVICE =====

export class AiJobService {
  /**
   * Generate job summary (≤300 words)
   * Used for quick overview of job status
   */
  async generateSummary(
    orgId: string,
    userId: string,
    userRole: string,
    ticketId: string
  ) {
    // Get job ticket with logs
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
      include: {
        customer: true,
        crew: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    // Execute AI task
    const result = await aiTaskService.execute(orgId, userId, userRole, {
      agentType: 'job_summary',
      actionType: 'generate_summary',
      preview: false,
      metadata: {
        ticketId,
        customerName: ticket.customer.company || ticket.customer.primaryName,
        serviceType: ticket.serviceType,
        logCount: ticket.logs.length,
      },
    });

    // Mock AI summary (replace with actual AI call)
    const summary = this.mockGenerateSummary(ticket);

    return {
      ticketId,
      summary,
      wordCount: summary.split(' ').length,
      aiTaskId: result.taskId,
      cost: result.priceCents,
    };
  }

  /**
   * Generate completion report with photos and signature
   * Triggered when job is marked complete
   */
  async generateCompletionReport(
    orgId: string,
    userId: string,
    userRole: string,
    ticketId: string
  ) {
    // Get job ticket with all data
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
      include: {
        customer: true,
        crew: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
        completion: true,
      },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    if (!ticket.completion) {
      throw new ServiceError('Job not completed', 'JOB_NOT_COMPLETED', 400);
    }

    // Execute AI task
    const result = await aiTaskService.execute(orgId, userId, userRole, {
      agentType: 'job_completion',
      actionType: 'generate_report',
      preview: false,
      metadata: {
        ticketId,
        customerName: ticket.customer.company || ticket.customer.primaryName,
        serviceType: ticket.serviceType,
        completedAt: ticket.completion.completedAt,
      },
    });

    // Mock AI report (replace with actual AI call)
    const report = this.mockGenerateCompletionReport(ticket);

    // Update completion with AI report
    await prisma.jobCompletion.update({
      where: { id: ticket.completion.id },
      data: {
        aiReportText: report,
        // aiReportUrl would be set after PDF generation
      },
    });

    return {
      ticketId,
      report,
      wordCount: report.split(' ').length,
      aiTaskId: result.taskId,
      cost: result.priceCents,
    };
  }

  /**
   * Scan job for anomalies
   * Detects time overruns, parts excess, quality concerns, safety issues
   */
  async scanForAnomalies(
    orgId: string,
    userId: string,
    userRole: string,
    ticketId: string
  ) {
    // Get job ticket with logs
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    // Execute AI task
    const result = await aiTaskService.execute(orgId, userId, userRole, {
      agentType: 'anomaly_detection',
      actionType: 'scan_job',
      preview: false,
      metadata: {
        ticketId,
        serviceType: ticket.serviceType,
        logCount: ticket.logs.length,
      },
    });

    // Mock anomaly detection (replace with actual AI call)
    const anomalies = this.mockDetectAnomalies(ticket);

    // Create anomaly records
    for (const anomaly of anomalies) {
      await prisma.jobAnomaly.create({
        data: {
          jobTicketId: ticketId,
          type: anomaly.type,
          severity: anomaly.severity,
          aiNotes: anomaly.notes,
        },
      });
    }

    return {
      ticketId,
      anomaliesFound: anomalies.length,
      anomalies,
      aiTaskId: result.taskId,
      cost: result.priceCents,
    };
  }

  // ===== MOCK AI FUNCTIONS (Replace with actual AI API calls) =====

  private mockGenerateSummary(ticket: any): string {
    return `Job Summary for ${ticket.customer.company || ticket.customer.primaryName}:
Service Type: ${ticket.serviceType}
Status: ${ticket.status}
Crew: ${ticket.crew?.name || 'Unassigned'}
Scheduled: ${ticket.scheduledAt ? new Date(ticket.scheduledAt).toLocaleDateString() : 'Not scheduled'}
Logs: ${ticket.logs.length} activity entries

This job is ${ticket.status === 'completed' ? 'complete' : 'in progress'}. ${ticket.logs.length > 0 ? 'Recent activity includes ' + ticket.logs[ticket.logs.length - 1].action + '.' : 'No activity logged yet.'}`;
  }

  private mockGenerateCompletionReport(ticket: any): string {
    const photos = ticket.logs.filter((l: any) => l.photoUrl).length;
    const parts = ticket.logs.reduce((sum: number, l: any) => {
      const partsArray = Array.isArray(l.partsUsed) ? l.partsUsed : [];
      return sum + partsArray.length;
    }, 0);

    return `Completion Report - ${ticket.customer.company || ticket.customer.primaryName}

Service: ${ticket.serviceType}
Completed: ${new Date(ticket.completion.completedAt).toLocaleString()}
Crew: ${ticket.crew?.name || 'Unknown'}

Work Performed:
${ticket.logs.map((l: any) => `- ${l.action}: ${l.notes || 'No notes'}`).join('\n')}

Materials Used: ${parts} parts
Photos Captured: ${photos}
Customer Signature: ${ticket.completion.signatureUrl ? 'Received' : 'Not received'}

All work completed according to specifications. Customer satisfied with results.`;
  }

  private mockDetectAnomalies(ticket: any): Array<{
    type: string;
    severity: string;
    notes: string;
  }> {
    const anomalies: Array<{ type: string; severity: string; notes: string }> = [];

    // Check for time overrun (mock logic)
    if (ticket.logs.length > 10) {
      anomalies.push({
        type: 'time_overrun',
        severity: 'medium',
        notes: 'Job has unusually high number of log entries, may indicate extended work time.',
      });
    }

    // Check for parts excess (mock logic)
    const totalParts = ticket.logs.reduce((sum: number, l: any) => {
      const partsArray = Array.isArray(l.partsUsed) ? l.partsUsed : [];
      return sum + partsArray.length;
    }, 0);

    if (totalParts > 5) {
      anomalies.push({
        type: 'parts_excess',
        severity: 'low',
        notes: `${totalParts} parts used, which is above average for this service type.`,
      });
    }

    return anomalies;
  }
}

export const aiJobService = new AiJobService();

