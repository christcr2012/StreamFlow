'use client';

import { Button } from '@cortiware/ui';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const pages: (number | string)[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Show pages around current page
  const showRange = 2;
  for (let i = Math.max(2, currentPage - showRange); i <= Math.min(totalPages - 1, currentPage + showRange); i++) {
    if (i > 1 && pages[pages.length - 1] !== i - 1 && pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }
  
  // Always show last page if there's more than one page
  if (totalPages > 1) {
    if (pages[pages.length - 1] !== totalPages - 1 && pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {totalItems !== undefined && itemsPerPage !== undefined && (
          <span>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {pages.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-1 text-gray-400">...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

