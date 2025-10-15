/**
 * UI Components Index
 * 
 * Centralized exports for all UI components
 * 
 * NOTE: Button, Card, and Input now re-exported from @cortiware/ui
 * to eliminate duplication and use shared components across all apps.
 */

// Core UI components - Re-exported from @cortiware/ui
export { Button } from '@cortiware/ui';
export type { ButtonProps } from '@cortiware/ui';

export { Card, CardHeader, CardBody, CardFooter } from '@cortiware/ui';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from '@cortiware/ui';

export { Input } from '@cortiware/ui';
export type { InputProps } from '@cortiware/ui';

// Provider-portal specific components
export { MetricCard } from './MetricCard';
export { ThemeToggle } from './ThemeToggle';

