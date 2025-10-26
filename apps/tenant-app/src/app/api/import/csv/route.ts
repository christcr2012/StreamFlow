/**
 * CSV Import API - Queue-Based Processing
 * 
 * Handles CSV file uploads by:
 * 1. Uploading file to S3
 * 2. Enqueueing background job for processing
 * 3. Processing in chunks to avoid memory issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { enqueue } from '@/lib/queue/enqueue';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for upload

/**
 * POST /api/import/csv
 * 
 * Upload CSV file and enqueue for background processing
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId || !authContext.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string; // 'customers', 'jobs', etc.
    const mappings = formData.get('mappings') as string; // JSON string of field mappings
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType is required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }
    
    // Upload file to S3 (Vercel Blob)
    const filename = `imports/${authContext.orgId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    // Create import job record
    const importJob = await prisma.importJob.create({
      data: {
        orgId: authContext.orgId,
        userId: authContext.userId,
        entityType: entityType as 'CUSTOMERS' | 'JOBS' | 'INVOICES' | 'ESTIMATES' | 'CONTACTS' | 'ADDRESSES' | 'NOTES',
        fileName: file.name,
        fileSize: file.size,
        fileUrl: blob.url,
        status: 'PENDING',
        totalRecords: 0,
        processedRecords: 0,
        successCount: 0,
        errorCount: 0,
        fieldMappings: mappings ? JSON.parse(mappings) : {},
      },
    });
    
    // Enqueue background job for processing
    const jobId = await enqueue(
      'csv-import',
      'process-csv-import',
      {
        importJobId: importJob.id,
        orgId: authContext.orgId,
        fileUrl: blob.url,
        entityType,
        mappings: mappings ? JSON.parse(mappings) : {},
      },
      {
        attempts: 3,
        priority: 5,
      }
    );
    
    return NextResponse.json({
      success: true,
      importJobId: importJob.id,
      jobId,
      message: 'File uploaded successfully. Processing in background.',
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import/csv/:id
 * 
 * Get import job status
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const importJobId = searchParams.get('id');
    
    if (!importJobId) {
      return NextResponse.json(
        { error: 'importJobId is required' },
        { status: 400 }
      );
    }
    
    const importJob = await prisma.importJob.findFirst({
      where: {
        id: importJobId,
        orgId: authContext.orgId,
      },
    });
    
    if (!importJob) {
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      importJob: {
        id: importJob.id,
        status: importJob.status,
        fileName: importJob.fileName,
        totalRecords: importJob.totalRecords,
        processedRecords: importJob.processedRecords,
        successCount: importJob.successCount,
        errorCount: importJob.errorCount,
        errorSummary: importJob.errorSummary,
        createdAt: importJob.createdAt,
        completedAt: importJob.completedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching import job:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

