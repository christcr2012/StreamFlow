/**
 * ComparisonTable Component
 * Feature comparison table for product tiers or vs competitors
 */

import { ReactNode } from 'react';

export interface ComparisonColumn {
  name: string;
  featured?: boolean;
}

export interface ComparisonRow {
  feature: string;
  values: Array<boolean | string | ReactNode>;
}

export interface ComparisonTableProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  className?: string;
}

export function ComparisonTable({
  columns,
  rows,
  className = '',
}: ComparisonTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
              Feature
            </th>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`p-4 text-center text-sm font-semibold border-b ${
                  column.featured
                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]'
                    : 'text-[var(--text-tertiary)] border-[var(--border-primary)]'
                }`}
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-[var(--border-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <td className="p-4 text-[var(--text-secondary)] font-medium">
                {row.feature}
              </td>
              {row.values.map((value, colIndex) => (
                <td
                  key={colIndex}
                  className={`p-4 text-center ${
                    columns[colIndex]?.featured
                      ? 'bg-[var(--brand-primary)]/5'
                      : ''
                  }`}
                >
                  {typeof value === 'boolean' ? (
                    value ? (
                      <svg
                        className="w-5 h-5 text-[var(--accent-success)] mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-[var(--text-muted)] mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )
                  ) : (
                    <span className="text-[var(--text-secondary)]">{value}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

