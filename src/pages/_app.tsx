// src/pages/_app.tsx
import type { AppProps } from "next/app";
import AppNav from "@/components/AppNav";
import "@/styles/theme.css";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      <AppNav />
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
