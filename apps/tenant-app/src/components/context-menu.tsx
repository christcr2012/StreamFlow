'use client';

import { ReactNode, useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  className?: string;
}

/**
 * Context Menu Component
 * 
 * Displays a context menu with multiple action items:
 * - Triggered by long-press on mobile
 * - Right-click on desktop
 * - Touch-friendly item sizing (44px minimum)
 * - Smooth animations
 * - Auto-positioning to stay within viewport
 * - Dark mode support
 * - Backdrop click to close
 */
export function ContextMenu({
  items,
  isOpen,
  onClose,
  position,
  className = '',
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-position menu to stay within viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current || !position) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    onClose();
  };

  const getVariantClasses = (variant: ContextMenuItem['variant'] = 'default') => {
    const variants = {
      default: 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
      danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
      success: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
    };
    return variants[variant];
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-25 dark:bg-opacity-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className={`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] animate-scaleIn ${className}`}
        style={position ? { left: position.x, top: position.y } : undefined}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
              getVariantClasses(item.variant)
            } ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
            }`}
            style={{ minHeight: '44px' }}
          >
            {item.icon && (
              <span className="flex-shrink-0 w-5 h-5">
                {item.icon}
              </span>
            )}
            <span className="flex-1 font-medium text-sm">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

