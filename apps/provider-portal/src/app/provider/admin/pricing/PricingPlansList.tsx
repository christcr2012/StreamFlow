'use client';

/**
 * Pricing Plans List Component
 * 
 * Displays all pricing plans with actions to edit, publish, or delete
 */

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@cortiware/ui';

type PricingPlan = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  currency: string;
  description: string;
  cta: string;
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  features: Array<{
    id: string;
    text: string;
    sortOrder: number;
  }>;
  _count: {
    history: number;
  };
};

type Props = {
  plans: PricingPlan[];
};

export default function PricingPlansList({ plans }: Props) {
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handlePublish = async (planId: string) => {
    if (!confirm('Are you sure you want to publish this pricing plan? It will be visible on the marketing site within 60 seconds.')) {
      return;
    }

    setIsPublishing(planId);
    try {
      const response = await fetch(`/api/admin/pricing/plans/${planId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to publish plan');
      }

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error publishing plan:', error);
      alert('Failed to publish plan. Please try again.');
    } finally {
      setIsPublishing(null);
    }
  };

  const handleUnpublish = async (planId: string) => {
    if (!confirm('Are you sure you want to unpublish this pricing plan? It will be removed from the marketing site within 60 seconds.')) {
      return;
    }

    setIsPublishing(planId);
    try {
      const response = await fetch(`/api/admin/pricing/plans/${planId}/unpublish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish plan');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error unpublishing plan:', error);
      alert('Failed to unpublish plan. Please try again.');
    } finally {
      setIsPublishing(null);
    }
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(planId);
    try {
      const response = await fetch(`/api/admin/pricing/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Published
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending Review
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Custom';
    return `$${(price / 100).toFixed(0)}/${currency === 'USD' ? 'mo' : currency}`;
  };

  if (plans.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No pricing plans yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Get started by creating your first pricing plan
        </p>
        <Link href="/provider/admin/pricing/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Create First Plan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                {getStatusBadge(plan.status)}
                {plan.highlighted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    ⭐ Highlighted
                  </span>
                )}
                {!plan.active && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Inactive
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Price:</span>{' '}
                  {formatPrice(plan.price, plan.currency)}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Features:</span>{' '}
                  {plan.features.length}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">CTA:</span>{' '}
                  {plan.cta}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">History:</span>{' '}
                  {plan._count.history} changes
                </div>
              </div>

              {/* Features Preview */}
              <div className="flex flex-wrap gap-2">
                {plan.features.slice(0, 5).map((feature) => (
                  <span
                    key={feature.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    ✓ {feature.text}
                  </span>
                ))}
                {plan.features.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
                    +{plan.features.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 ml-4">
              <Link href={`/provider/admin/pricing/${plan.id}/edit`}>
                <Button variant="outline" size="sm" className="w-full">
                  Edit
                </Button>
              </Link>
              
              {plan.status === 'PUBLISHED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnpublish(plan.id)}
                  disabled={isPublishing === plan.id}
                  className="w-full"
                >
                  {isPublishing === plan.id ? 'Unpublishing...' : 'Unpublish'}
                </Button>
              ) : (
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() => handlePublish(plan.id)}
                  disabled={isPublishing === plan.id}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isPublishing === plan.id ? 'Publishing...' : 'Publish'}
                </Button>
              )}
              
              <Link href={`/provider/admin/pricing/${plan.id}/history`}>
                <Button variant="ghost" size="sm" className="w-full">
                  History
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(plan.id, plan.name)}
                disabled={isDeleting === plan.id}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isDeleting === plan.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

