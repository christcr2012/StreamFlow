'use client';

import { ThemeProvider } from './theme-provider';

export function ClientLayoutWrapper({ children }: { children: any }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

