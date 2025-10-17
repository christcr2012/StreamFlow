export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-6">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-slate-300">Starter — $49/mo</div>
        <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-2 border-teal-500 rounded-2xl p-8 text-slate-300">Professional — $199/mo</div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-slate-300">Enterprise — Custom</div>
      </div>
    </main>
  );
}

