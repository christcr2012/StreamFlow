/**
 * UI Components Index
 * 
 * Centralized exports for all UI components
 * 
 * NOTE: Button, Card, Input, Modal, and Skeleton now re-exported from @cortiware/ui
 * to eliminate duplication and use shared components across all apps.
 * 
 * Local components (tenant-app specific):
 * - Alert, Badge, DataTable, Pagination, Select, Timeline, Toast
 */

// Core UI components - Re-exported from @cortiware/ui
export { Button } from '@cortiware/ui';
export type { ButtonProps } from '@cortiware/ui';

export { Card, CardHeader, CardBody, CardFooter } from '@cortiware/ui';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from '@cortiware/ui';

export { Input } from '@cortiware/ui';
export type { InputProps } from '@cortiware/ui';

export { Modal, ConfirmModal } from '@cortiware/ui';
export type { ModalProps, ConfirmModalProps } from '@cortiware/ui';

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList } from '@cortiware/ui';
export type { SkeletonProps, SkeletonTableProps, SkeletonListProps } from '@cortiware/ui';

export { EmptyState, NoResults, NoData, ErrorState } from '@cortiware/ui';
export type { EmptyStateProps, NoResultsProps, NoDataProps, ErrorStateProps } from '@cortiware/ui';

// Tenant-app specific components
export { Alert } from './alert';
export { Badge } from './badge';
export { DataTable } from './data-table';
export { Pagination } from './pagination';
export { Select } from './select';
export { Timeline } from './timeline';
export { showToast } from './toast';

