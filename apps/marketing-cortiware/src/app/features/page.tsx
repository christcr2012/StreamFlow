export default function FeaturesPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-6">Features</h1>
      <p className="text-slate-300 mb-8">Cortiware provides everything you need to run AI-first operations.</p>
      <ul className="grid md:grid-cols-3 gap-6">
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">Custom branding</li>
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">AI agents</li>
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">Enterprise security</li>
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">Analytics & insights</li>
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">Performance</li>
        <li className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300">API-first</li>
      </ul>
    </main>
  );
}

