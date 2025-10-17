'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl relative overflow-hidden transition-transform duration-300 group-hover:scale-110" style={{ background: 'var(--vp-gradient)' }}>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Cortiware</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#industries" className="text-slate-300 hover:text-white transition-all duration-200 relative group">
            Industries
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/#ai-features" className="text-slate-300 hover:text-white transition-all duration-200 relative group">
            AI Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/#pricing" className="text-slate-300 hover:text-white transition-all duration-200 relative group">
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/contact" className="text-slate-300 hover:text-white transition-all duration-200 relative group">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/get-started" className="px-6 py-2.5 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
            <span className="relative z-10">Get Started →</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

