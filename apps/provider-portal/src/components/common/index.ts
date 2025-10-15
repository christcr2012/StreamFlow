/**
 * Common Components Index
 *
 * Centralized exports for all reusable components
 *
 * NOTE: Modal, Skeleton, and EmptyState now re-exported from @cortiware/ui
 * to eliminate duplication and use shared components across all apps.
 */

// StatCard components (provider-portal specific)
export { StatCard, StatCardGrid } from './StatCard';
export type { StatCardProps, StatCardGridProps } from './StatCard';

// Modal components - Re-exported from @cortiware/ui
export { Modal, ConfirmModal } from '@cortiware/ui';
export type { ModalProps, ConfirmModalProps } from '@cortiware/ui';

// Skeleton components - Re-exported from @cortiware/ui
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList } from '@cortiware/ui';
export type { SkeletonProps, SkeletonTableProps, SkeletonListProps } from '@cortiware/ui';

// EmptyState components - Re-exported from @cortiware/ui
export { EmptyState, NoResults, NoData, ErrorState } from '@cortiware/ui';
export type { EmptyStateProps, NoResultsProps, NoDataProps, ErrorStateProps } from '@cortiware/ui';

