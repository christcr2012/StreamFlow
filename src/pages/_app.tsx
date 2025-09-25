// src/pages/_app.tsx (only the layout part shown)
import type { AppProps } from "next/app";
import AppNav from "@/components/AppNav";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
