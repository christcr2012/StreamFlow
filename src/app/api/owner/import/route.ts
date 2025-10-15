import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertOwnerOr403 } from '@/lib/auth-owner';
import { checkAiBudget } from '@/lib/aiMeter';
import { prisma } from '@/lib/prisma';
import { suggestMappings, classifyTier, calculateAICosts, getRetailPricing } from '@/lib/import/ai-mapping-assistant';
import { parseSample, validateFile, parseFile } from '@/lib/import/file-parser';
import { processImport } from '@/lib/import/batch-processor';
import { ImportStatus, ImportEntityType } from '@prisma/client';

/**
 * Import Wizard API - Single consolidated endpoint
 *
 * Actions:
 * - analyze: AI-powered field mapping with cost estimation
 * - map: Save field mappings and transformations
 * - execute: Batch import with progress tracking
 * - status: Get import job status and progress
 * - errors: Download error report (JSON or CSV)
 * - cancel: Cancel running import job
 * - templates: List import templates for entity type
 * - save-template: Save current mappings as reusable template
 */

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'action_required' },
        { status: 400 }
      );
    }

    // Authentication
    const jar = await cookies();
    const userIdent = jar.get('rs_user')?.value || jar.get('mv_user')?.value;
    const guard = await assertOwnerOr403(userIdent, body?.orgId as string | undefined);
    
    if (!guard.ok) {
      return NextResponse.json(
        { ok: false, error: guard.error },
        { status: guard.status }
      );
    }

    const { userId, orgId } = guard;

    // Route to appropriate action handler
    switch (action) {
      case 'analyze':
        return await handleAnalyze(body, userId, orgId);
      case 'map':
        return await handleMap(body, userId, orgId);
      case 'execute':
        return await handleExecute(body, userId, orgId);
      case 'status':
        return await handleStatus(body, userId, orgId);
      case 'errors':
        return await handleErrors(body, userId, orgId);
      case 'cancel':
        return await handleCancel(body, userId, orgId);
      case 'templates':
        return await handleTemplates(body, userId, orgId);
      case 'save-template':
        return await handleSaveTemplate(body, userId, orgId);
      default:
        return NextResponse.json(
          { ok: false, error: 'unsupported_action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Import API error:', error);
    // Return production-safe error message
    return NextResponse.json(
      {
        ok: false,
        error: 'internal_error',
        message: 'An unexpected error occurred. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}

/**
 * Action: analyze
 * AI-powered field mapping with cost estimation and budget guard
 */
async function handleAnalyze(body: any, userId: string, orgId: string) {
  const {
    aiAssist = false,
    entityType,
    fileName,
    fileContent, // base64 encoded sample
    fileSize,
  } = body;

  if (!entityType || !fileName || !fileContent) {
    return NextResponse.json(
      { ok: false, error: 'missing_required_fields' },
      { status: 400 }
    );
  }

  // Validate file
  const validation = validateFile(fileName, fileSize || 0);
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  // Parse sample data using file parser
  let parsed;
  try {
    parsed = parseSample(fileName, fileContent, 10);
  } catch (error: any) {
    console.error('File parsing error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'file_parsing_failed',
        message: 'Unable to parse file. Please check the file format and try again.'
      },
      { status: 400 }
    );
  }

  const { columns: headers, rows: sampleRows, format } = parsed;

  // Create import job
  const importJob = await prisma.importJob.create({
    data: {
      orgId,
      userId,
      entityType: entityType as ImportEntityType,
      status: aiAssist ? ImportStatus.ANALYZING : ImportStatus.PENDING,
      fileName,
      fileSize: fileSize || 0,
      totalRecords: 0,
      sampleData: sampleRows,
    },
  });

  // If AI assist is disabled, return basic analysis
  if (!aiAssist) {
    return NextResponse.json({
      ok: true,
      importJobId: importJob.id,
      detected: {
        format,
        columns: headers,
        sampleRows: sampleRows.slice(0, 3),
      },
    });
  }

  // AI-powered analysis
  try {
    // Classify tier and estimate costs
    const tierInfo = classifyTier(headers.length, sampleRows.length);
    const costs = calculateAICosts(tierInfo.estimatedTokensIn, tierInfo.estimatedTokensOut);
    const retailPriceCents = await getRetailPricing(tierInfo.tier);

    // Convert retail price to credits (1 credit = $0.05 = 5 cents)
    const estimatedCredits = Math.ceil(retailPriceCents / 5);

    // Budget guard
    const budgetCheck = await checkAiBudget(orgId, 'ai.import_assistant', estimatedCredits);
    
    if (!budgetCheck.allowed) {
      const missingCredits = Math.max(0, estimatedCredits - (budgetCheck.creditsRemaining || 0));
      const required_prepay_cents = missingCredits * 5;
      
      return NextResponse.json(
        {
          error: 'PAYMENT_REQUIRED',
          feature: 'ai.import_assistant',
          required_prepay_cents,
          enable_path: `/owner/wallet/prepay?feature=ai.import_assistant&amount_cents=${required_prepay_cents}`,
        },
        { status: 402 }
      );
    }

    // Call AI for mapping suggestions
    const suggestions = await suggestMappings(entityType, sampleRows, headers);

    // Update import job with AI suggestions
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: ImportStatus.MAPPING,
        fieldMappings: suggestions.mappings,
        transformRules: suggestions.transforms,
        validationRules: suggestions.validations,
      },
    });

    return NextResponse.json({
      ok: true,
      importJobId: importJob.id,
      suggestions: {
        mappings: suggestions.mappings,
        transforms: suggestions.transforms,
        validations: suggestions.validations,
        dedupe: suggestions.dedupe,
      },
      tier: tierInfo.tier,
      estimateCents: costs.totalCents,
      retailPriceCents,
      confidenceOverall: suggestions.confidenceOverall,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);

    // Update job status to failed
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: ImportStatus.FAILED,
        errorSummary: error.message || 'AI analysis failed',
      },
    });

    // Return production-safe error message (don't expose internal details)
    return NextResponse.json(
      {
        ok: false,
        error: 'ai_analysis_failed',
        message: 'AI analysis could not be completed. Please try again or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}

/**
 * Action: map
 * Save field mappings and transformations to ImportJob/ImportMapping
 */
async function handleMap(body: any, userId: string, orgId: string) {
  const {
    importJobId,
    mappings,
    transforms,
    validations,
    dedupe,
    saveAsTemplate = false,
    templateName,
  } = body;

  if (!importJobId) {
    return NextResponse.json(
      { ok: false, error: 'importJobId_required' },
      { status: 400 }
    );
  }

  // Verify job ownership
  const job = await prisma.importJob.findFirst({
    where: { id: importJobId, orgId },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'job_not_found' },
      { status: 404 }
    );
  }

  // Update import job with mappings
  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: ImportStatus.MAPPING,
      fieldMappings: mappings || job.fieldMappings,
      transformRules: transforms || job.transformRules,
      validationRules: validations || job.validationRules,
    },
  });

  // Save as template if requested
  let mappingId: string | undefined;
  if (saveAsTemplate && templateName) {
    const mapping = await prisma.importMapping.create({
      data: {
        orgId,
        name: templateName,
        entityType: job.entityType,
        sourceFormat: 'csv', // TODO: detect from job
        fieldMappings: mappings || job.fieldMappings || {},
        transformRules: transforms || job.transformRules || {},
        validationRules: validations || job.validationRules || {},
        isTemplate: true,
      },
    });
    mappingId = mapping.id;

    // Link mapping to job
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { mappingId },
    });
  }

  return NextResponse.json({
    ok: true,
    importJobId,
    mappingId,
  });
}

/**
 * Action: execute
 * Batch import with progress tracking
 */
async function handleExecute(body: any, userId: string, orgId: string) {
  const { importJobId, fileContent, fileName, batchSize = 100 } = body;

  if (!importJobId) {
    return NextResponse.json(
      { ok: false, error: 'importJobId_required' },
      { status: 400 }
    );
  }

  if (!fileContent) {
    return NextResponse.json(
      { ok: false, error: 'fileContent_required' },
      { status: 400 }
    );
  }

  // Verify job ownership
  const job = await prisma.importJob.findFirst({
    where: { id: importJobId, orgId },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'job_not_found' },
      { status: 404 }
    );
  }

  // Parse full file
  let parsed;
  try {
    parsed = parseFile(fileName || job.fileName, fileContent);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'file_parsing_failed', details: error.message },
      { status: 400 }
    );
  }

  // Start batch processing asynchronously
  // Note: In production, this should be moved to a background job queue
  processImport({
    importJobId,
    orgId,
    entityType: job.entityType,
    records: parsed.rows,
    fieldMappings: (job.fieldMappings as any[]) || [],
    transformRules: (job.transformRules as any[]) || [],
    validationRules: (job.validationRules as any[]) || [],
    dedupeFields: [], // TODO: Extract from job configuration
    batchSize,
  }).catch(error => {
    console.error('Batch processing error:', error);
    // Update job status to failed
    prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: ImportStatus.FAILED,
        errorSummary: error.message || 'Batch processing failed',
        completedAt: new Date(),
      },
    }).catch(console.error);
  });

  return NextResponse.json({
    ok: true,
    importJobId,
    status: 'PROCESSING',
    totalRecords: parsed.rows.length,
    estimatedDuration: `${Math.ceil(parsed.rows.length / batchSize)} minutes`,
  });
}

/**
 * Action: status
 * Return current import job status and progress
 */
async function handleStatus(body: any, userId: string, orgId: string) {
  const { importJobId } = body;

  if (!importJobId) {
    return NextResponse.json(
      { ok: false, error: 'importJobId_required' },
      { status: 400 }
    );
  }

  const job = await prisma.importJob.findFirst({
    where: { id: importJobId, orgId },
    include: {
      errors: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'job_not_found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    job: {
      id: job.id,
      status: job.status,
      entityType: job.entityType,
      fileName: job.fileName,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      successCount: job.successCount,
      errorCount: job.errorCount,
      skipCount: job.skipCount,
      progressPercent: job.progressPercent,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorSummary: job.errorSummary,
      recentErrors: job.errors.map(e => ({
        rowNumber: e.rowNumber,
        fieldName: e.fieldName,
        errorType: e.errorType,
        errorMessage: e.errorMessage,
      })),
    },
  });
}

/**
 * Action: errors
 * Return error report (JSON or CSV download)
 */
async function handleErrors(body: any, userId: string, orgId: string) {
  const { importJobId, format = 'json' } = body;

  if (!importJobId) {
    return NextResponse.json(
      { ok: false, error: 'importJobId_required' },
      { status: 400 }
    );
  }

  const errors = await prisma.importError.findMany({
    where: {
      importJob: {
        id: importJobId,
        orgId,
      },
    },
    orderBy: { rowNumber: 'asc' },
  });

  if (format === 'csv') {
    const csv = [
      'Row,Field,Type,Message',
      ...errors.map(e => 
        `${e.rowNumber},"${e.fieldName || ''}","${e.errorType}","${e.errorMessage.replace(/"/g, '""')}"`
      ),
    ].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="import-errors-${importJobId}.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    errors: errors.map(e => ({
      rowNumber: e.rowNumber,
      fieldName: e.fieldName,
      errorType: e.errorType,
      errorMessage: e.errorMessage,
      rawData: e.rawData,
    })),
  });
}

/**
 * Action: cancel
 * Cancel running import job
 */
async function handleCancel(body: any, userId: string, orgId: string) {
  const { importJobId } = body;

  if (!importJobId) {
    return NextResponse.json(
      { ok: false, error: 'importJobId_required' },
      { status: 400 }
    );
  }

  const job = await prisma.importJob.findFirst({
    where: { id: importJobId, orgId },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'job_not_found' },
      { status: 404 }
    );
  }

  // Only allow canceling jobs that are in progress
  if (job.status !== ImportStatus.PROCESSING && job.status !== ImportStatus.ANALYZING) {
    return NextResponse.json(
      { ok: false, error: 'cannot_cancel_job_in_current_status' },
      { status: 400 }
    );
  }

  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: ImportStatus.CANCELLED,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    importJobId,
    status: 'CANCELLED',
  });
}

/**
 * Action: templates
 * List import templates for entity type
 */
async function handleTemplates(body: any, userId: string, orgId: string) {
  const { entityType } = body;

  const where: any = { orgId };
  if (entityType) {
    where.entityType = entityType as ImportEntityType;
  }

  const templates = await prisma.importMapping.findMany({
    where,
    orderBy: [
      { useCount: 'desc' },
      { lastUsedAt: 'desc' },
    ],
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      entityType: t.entityType,
      sourceFormat: t.sourceFormat,
      fieldMappings: t.fieldMappings,
      transformRules: t.transformRules,
      validationRules: t.validationRules,
      useCount: t.useCount,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
    })),
  });
}

/**
 * Action: save-template
 * Save current mappings as reusable template
 */
async function handleSaveTemplate(body: any, userId: string, orgId: string) {
  const {
    name,
    entityType,
    sourceFormat,
    fieldMappings,
    transformRules,
    validationRules,
  } = body;

  if (!name || !entityType || !sourceFormat || !fieldMappings) {
    return NextResponse.json(
      { ok: false, error: 'missing_required_fields' },
      { status: 400 }
    );
  }

  const template = await prisma.importMapping.create({
    data: {
      orgId,
      name,
      entityType: entityType as ImportEntityType,
      sourceFormat,
      fieldMappings,
      transformRules: transformRules || [],
      validationRules: validationRules || [],
      isTemplate: true,
      useCount: 0,
    },
  });

  return NextResponse.json({
    ok: true,
    template: {
      id: template.id,
      name: template.name,
      entityType: template.entityType,
      sourceFormat: template.sourceFormat,
    },
  });
}

