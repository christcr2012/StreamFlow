export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-6">About Robinson AI Systems</h1>
      <p className="text-xl text-slate-300 leading-relaxed mb-6">
        Robinson AI Systems designs and delivers enterprise AI platforms. We focus on reliability,
        performance, and developer experience so your teams can ship faster with confidence.
      </p>
      <div className="grid md:grid-cols-3 gap-8 mt-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h3 className="text-white font-semibold mb-2">What we build</h3>
          <p className="text-slate-300">Multi-tenant SaaS infrastructure, AI agents, and custom solutions.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h3 className="text-white font-semibold mb-2">How we work</h3>
          <p className="text-slate-300">Partner-first, transparent roadmaps, pragmatic architecture.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h3 className="text-white font-semibold mb-2">Where we help</h3>
          <p className="text-slate-300">Automation, analytics, CRM augmentation, and intelligent workflows.</p>
        </div>
      </div>
    </main>
  );
}

