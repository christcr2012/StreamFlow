import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Knowledge Base Management
const CreateKnowledgeArticleSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    title: z.string(),
    content: z.string(),
    summary: z.string().optional(),
    category: z.string(),
    subcategory: z.string().optional(),
    article_type: z.enum(['how_to', 'troubleshooting', 'faq', 'policy', 'procedure', 'best_practice', 'reference']),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    target_audience: z.array(z.enum(['customers', 'employees', 'technicians', 'managers', 'vendors', 'all'])),
    tags: z.array(z.string()).default([]),
    related_articles: z.array(z.string()).default([]),
    attachments: z.array(z.object({
      type: z.enum(['image', 'video', 'document', 'link']),
      title: z.string(),
      url: z.string(),
      description: z.string().optional(),
    })).default([]),
    seo: z.object({
      meta_title: z.string().optional(),
      meta_description: z.string().optional(),
      keywords: z.array(z.string()).default([]),
    }).optional(),
    access_level: z.enum(['public', 'internal', 'restricted']).default('internal'),
    review_cycle: z.object({
      frequency_months: z.number().positive().default(12),
      next_review_date: z.string().optional(),
      reviewer_id: z.string().optional(),
    }).optional(),
    feedback_enabled: z.boolean().default(true),
    version_notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateKnowledgeArticleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    // Validate content length
    if (payload.content.length < 50) {
      return res.status(400).json({
        error: 'CONTENT_TOO_SHORT',
        message: 'Article content must be at least 50 characters',
      });
    }

    // Validate reviewer if specified
    if (payload.review_cycle?.reviewer_id) {
      const reviewer = await prisma.user.findFirst({
        where: { id: payload.review_cycle.reviewer_id, orgId, role: { in: ['MANAGER', 'OWNER'] } },
      });

      if (!reviewer) {
        return res.status(404).json({
          error: 'REVIEWER_NOT_FOUND',
          message: 'Reviewer not found or insufficient permissions',
        });
      }
    }

    // Validate related articles if specified
    if (payload.related_articles.length > 0) {
      const relatedArticles = await prisma.note.findMany({
        where: { 
          id: { in: payload.related_articles }, 
          orgId,
          entityType: 'knowledge_article' 
        },
      });

      if (relatedArticles.length !== payload.related_articles.length) {
        return res.status(404).json({
          error: 'RELATED_ARTICLES_NOT_FOUND',
          message: 'One or more related articles not found',
        });
      }
    }

    const articleId = `KB-${Date.now()}`;

    const knowledgeArticle = await prisma.note.create({
      data: {
        orgId,
        entityType: 'knowledge_article',
        entityId: articleId,
        userId: actor.user_id,
        body: `KNOWLEDGE ARTICLE: ${payload.title} - ${payload.summary} (${payload.article_type}, ${payload.category})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.knowledge.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_knowledge_article',
        resource: `knowledge_article:${knowledgeArticle.id}`,
        meta: { 
          title: payload.title,
          category: payload.category,
          article_type: payload.article_type,
          difficulty_level: payload.difficulty_level,
          target_audience: payload.target_audience,
          access_level: payload.access_level,
          content_length: payload.content.length 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `KB-${knowledgeArticle.id.substring(0, 6)}`,
        version: 1,
      },
      knowledge_article: {
        id: knowledgeArticle.id,
        article_id: articleId,
        title: payload.title,
        content: payload.content,
        summary: payload.summary,
        category: payload.category,
        subcategory: payload.subcategory,
        article_type: payload.article_type,
        difficulty_level: payload.difficulty_level,
        target_audience: payload.target_audience,
        tags: payload.tags,
        related_articles: payload.related_articles,
        attachments: payload.attachments,
        seo: payload.seo,
        access_level: payload.access_level,
        review_cycle: payload.review_cycle,
        feedback_enabled: payload.feedback_enabled,
        version_notes: payload.version_notes,
        status: 'draft',
        version: '1.0',
        views_count: 0,
        helpful_votes: 0,
        unhelpful_votes: 0,
        author_id: actor.user_id,
        created_at: knowledgeArticle.createdAt.toISOString(),
        updated_at: knowledgeArticle.updatedAt.toISOString(),
      },
      audit_id: `AUD-KB-${knowledgeArticle.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create knowledge article',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
