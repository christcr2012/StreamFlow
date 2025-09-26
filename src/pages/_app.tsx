// src/pages/_app.tsx
import type { AppProps } from "next/app";
import AppNav from "@/components/AppNav";
import "@/styles/theme.css";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      <AppNav />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
