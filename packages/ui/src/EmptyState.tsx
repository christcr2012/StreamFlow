/**
 * EmptyState Component
 * 
 * Displays when there's no data to show
 * Provides helpful messaging and optional actions
 */

import React from 'react';
import { FileQuestion, Search, Database, AlertCircle, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  
  /** Title text */
  title: string;
  
  /** Description text */
  description?: string;
  
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /** Preset icon type */
  iconType?: 'search' | 'database' | 'error' | 'inbox' | 'question';
  
  /** Custom className */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  iconType,
  className = '',
}: EmptyStateProps) {
  const getPresetIcon = () => {
    const iconProps = { size: 48, strokeWidth: 1.5, style: { color: 'var(--text-tertiary)' } };
    
    switch (iconType) {
      case 'search':
        return <Search {...iconProps} />;
      case 'database':
        return <Database {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'inbox':
        return <Inbox {...iconProps} />;
      case 'question':
        return <FileQuestion {...iconProps} />;
      default:
        return null;
    }
  };

  const displayIcon = icon || getPresetIcon();

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
      style={{ minHeight: '300px' }}
    >
      {/* Icon */}
      {displayIcon && (
        <div className="mb-4">
          {displayIcon}
        </div>
      )}

      {/* Title */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="text-sm max-w-md mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="btn-primary"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn-secondary"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * NoResults Component
 * 
 * Pre-configured empty state for search/filter results
 */
export interface NoResultsProps {
  searchTerm?: string;
  onClearFilters?: () => void;
}

export function NoResults({ searchTerm, onClearFilters }: NoResultsProps) {
  return (
    <EmptyState
      iconType="search"
      title="No results found"
      description={
        searchTerm
          ? `No results match "${searchTerm}". Try adjusting your search or filters.`
          : 'No results match your current filters. Try adjusting your criteria.'
      }
      action={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  );
}

/**
 * NoData Component
 * 
 * Pre-configured empty state for when there's no data at all
 */
export interface NoDataProps {
  entityName: string;
  onCreateNew?: () => void;
}

export function NoData({ entityName, onCreateNew }: NoDataProps) {
  return (
    <EmptyState
      iconType="database"
      title={`No ${entityName} yet`}
      description={`Get started by creating your first ${entityName.toLowerCase()}.`}
      action={
        onCreateNew
          ? {
              label: `Create ${entityName}`,
              onClick: onCreateNew,
            }
          : undefined
      }
    />
  );
}

/**
 * ErrorState Component
 * 
 * Pre-configured empty state for errors
 */
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      iconType="error"
      title={title}
      description={message}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

