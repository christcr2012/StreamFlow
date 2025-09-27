import React from 'react';
import { ProgressiveNavigation } from '@/components/navigation/ProgressiveNavigation';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { EventTrackingProvider } from '@/components/tracking/EventTrackingProvider';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    orgId: string;
    name: string;
    email: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <EventTrackingProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-semibold text-white">WorkStream</h1>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <ProgressiveNavigation userId={user.id} orgId={user.orgId} />
              </nav>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top navigation bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Welcome back, {user.name}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                {/* User menu would go here */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </EventTrackingProvider>
  );
}