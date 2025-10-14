'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  mobileLabel?: string; // Optional different label for mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${
                  onRowClick
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                    : ''
                } bg-white dark:bg-gray-900`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`${
              onRowClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-800' : ''
            } bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm`}
            style={{ minHeight: '44px' }} // Ensure touch target
          >
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {column.mobileLabel || column.label}:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
                    {column.render(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

