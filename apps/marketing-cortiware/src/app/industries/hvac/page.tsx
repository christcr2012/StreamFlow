import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function HVACIndustryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-full text-slate-400 text-sm font-bold mb-8">
            ROADMAP
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            HVAC Software <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Coming Soon</span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join the waitlist to be notified when we launch HVAC-specific software.
          </p>
          <Link href="/get-started" className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
            <span className="relative z-10">Join Waitlist</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>
      </main>
    </div>
  );
}
