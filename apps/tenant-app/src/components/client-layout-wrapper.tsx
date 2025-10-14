'use client';

import { ThemeProvider } from './theme-provider';
import { MobileNav } from './mobile-nav';

export function ClientLayoutWrapper({ children }: { children: any }) {
  return (
    <ThemeProvider>
      <MobileNav />
      {children}
    </ThemeProvider>
  );
}

