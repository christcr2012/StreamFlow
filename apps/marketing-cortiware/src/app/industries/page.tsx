import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function IndustriesPage() {
  const earlyAccess = [
    { name: 'Cleaning', slug: 'cleaning', blurb: 'Production implementation with full forms, SKUs, and estimation.' },
    { name: 'Portable Restrooms', slug: 'portable-restrooms', blurb: 'Implemented: delivery, pickup, service-frequency pricing.' },
  ];
  const preview = [
    { name: 'Rolloff (Dumpster Rental)', slug: 'rolloff', blurb: 'Functional placeholder; expanding next.' },
    { name: 'Fencing', slug: 'fencing', blurb: 'Functional placeholder with fence type/feet/height.' },
    { name: 'Appliance Rental', slug: 'appliance-rental', blurb: 'Functional placeholder with rental-duration pricing.' },
  ];
  const roadmap = [
    { name: 'Roofing', slug: 'roofing' },
    { name: 'HVAC', slug: 'hvac' },
    { name: 'Landscaping', slug: 'landscaping' },
    { name: 'Plumbing', slug: 'plumbing' },
    { name: 'Electrical', slug: 'electrical' },
    { name: 'Painting', slug: 'painting' },
    { name: 'Pressure Washing', slug: 'pressure-washing' },
    { name: 'Pest Control', slug: 'pest-control' },
    { name: 'Snow Removal', slug: 'snow-removal' },
    { name: 'Concrete Lifting', slug: 'concrete-lifting' },
    { name: 'Auto Detail', slug: 'auto-detail' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-8 backdrop-blur-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            Industry-Specific Solutions
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-none tracking-tight">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Your Industry</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Cortiware provides industry-specific software with workflows, data models, AI agents, and integrations
            tailored to how your business actually operates.
          </p>
        </div>

        {/* Early Access */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-white text-2xl font-bold">Early Access</h2>
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-bold">
              AVAILABLE NOW
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {earlyAccess.map(v => (
              <Link key={v.name} href={`/industries/${v.slug}`} className="group">
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 h-full">
                  <div className="inline-block text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1 mb-4">
                    EARLY ACCESS
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2 group-hover:text-emerald-400 transition-colors">{v.name}</h3>
                  <p className="text-slate-400 mb-4">{v.blurb}</p>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    Learn More
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-white text-2xl font-bold">Preview</h2>
            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 text-xs font-bold">
              PROTOTYPE
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {preview.map(v => (
              <div key={v.name} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300">
                <div className="inline-block text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded px-2 py-1 mb-3">
                  PREVIEW
                </div>
                <h3 className="text-white font-semibold mb-2">{v.name}</h3>
                <p className="text-slate-400 text-sm">{v.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-white text-2xl font-bold">Roadmap</h2>
            <div className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-slate-400 text-xs font-bold">
              COMING SOON
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {roadmap.map(item => (
              <Link key={item.name} href={`/industries/${item.slug}`} className="group">
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl px-4 py-3 hover:border-slate-600 transition-all duration-300 flex items-center justify-between">
                  <span className="text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-2xl mb-3">Don&apos;t See Your Industry?</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            We&apos;re constantly expanding to new industries. Contact us to discuss your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started" className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
              <span className="relative z-10">Join Waitlist</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105">
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}