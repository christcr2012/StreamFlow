import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDownIcon, Cog6ToothIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  usageCount: number;
  lastUsed: Date | string;
  category: string;
}

interface ProgressiveNavigationProps {
  userId: string;
  orgId: string;
}

export function ProgressiveNavigation({ userId, orgId }: ProgressiveNavigationProps) {
  const router = useRouter();
  const [activeItems, setActiveItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Load actively used navigation items
  useEffect(() => {
    fetchActiveNavItems();
  }, [orgId]);

  const fetchActiveNavItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/navigation/active-features');
      const data = await response.json();
      
      if (data.success) {
        setActiveItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch active nav items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Essential items that always show (regardless of usage)
  const essentialItems: NavItem[] = [
    {
      key: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      usageCount: 100,
      lastUsed: new Date(),
      category: 'core',
    },
    {
      key: 'leads',
      name: 'Leads',
      href: '/leads',
      usageCount: 50,
      lastUsed: new Date(),
      category: 'core',
    },
    {
      key: 'clients',
      name: 'Clients', 
      href: '/clients',
      usageCount: 30,
      lastUsed: new Date(),
      category: 'core',
    },
  ];

  // Combine essential items with actively used items
  const displayItems = [
    ...essentialItems,
    ...activeItems.filter(item => !essentialItems.some(essential => essential.key === item.key))
  ].slice(0, 8); // Limit to 8 main nav items

  const isCurrentPath = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  // Keyboard shortcut handler for universal search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Open universal search/command palette
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <nav className="space-y-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {/* Main navigation items */}
      {displayItems.map((item) => {
        const isActive = isCurrentPath(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            {item.icon && (
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
              />
            )}
            <span className="truncate">{item.name}</span>
            {/* Usage indicator for non-essential items */}
            {!essentialItems.some(e => e.key === item.key) && (
              <span className="ml-auto text-xs opacity-50">
                {item.usageCount > 10 ? '••' : '•'}
              </span>
            )}
          </Link>
        );
      })}

      {/* Universal Feature Finder */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-600 hover:border-gray-500"
      >
        <MagnifyingGlassIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
        <span className="truncate">Find Feature</span>
        <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded opacity-75">
          ⌘K
        </span>
      </button>

      {/* Discover More Features */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={() => setShowAllFeatures(!showAllFeatures)}
          className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-700 hover:text-gray-300 transition-colors"
        >
          <ChevronDownIcon 
            className={`mr-3 h-4 w-4 transition-transform ${showAllFeatures ? 'rotate-180' : ''}`}
          />
          <span>Discover Features</span>
          <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded">
            AI
          </span>
        </button>
        
        {showAllFeatures && (
          <div className="mt-2 pl-7 space-y-1">
            <Link
              href="/features/recommendations"
              className="block px-2 py-1 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
            >
              AI Recommendations
            </Link>
            <Link
              href="/features/catalog"
              className="block px-2 py-1 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
            >
              Feature Catalog
            </Link>
            <Link
              href="/settings/features"
              className="block px-2 py-1 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
            >
              Manage Features
            </Link>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="pt-4 border-t border-gray-700">
        <Link
          href="/settings"
          className={`
            group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
            ${isCurrentPath('/settings')
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
          `}
        >
          <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
          Settings
        </Link>
      </div>
    </nav>
  );
}