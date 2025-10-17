export default function IndustriesPage() {
  const earlyAccess = [
    { name: 'Cleaning', blurb: 'Production implementation: forms, pricebook, and real estimation logic.' },
    { name: 'Portable Restrooms (Port‑a‑John)', blurb: 'Implemented forms, SKUs, delivery/pickup/service estimation.' },
  ];
  const preview = [
    { name: 'Rolloff (Dumpster Rental)', blurb: 'Functional placeholder with basic pricing; expanding next.' },
    { name: 'Fencing', blurb: 'Functional placeholder with fence type/feet/height.' },
    { name: 'Appliance Rental', blurb: 'Functional placeholder with rental-duration pricing.' },
  ];
  const roadmap = [
    'Roofing','HVAC','Landscaping','Plumbing','Electrical','Painting','Pressure Washing','Pest Control','Snow Removal','Concrete Lifting & Leveling','Auto Detail','Generic Service','Generic Rental','Generic Project'
  ];
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-2">Industries</h1>
      <p className="text-slate-300 mb-8 max-w-3xl">Source of truth: <code>@cortiware/verticals</code>. We focus on service-based clientele. Vertical Expansion Packs provide data models, workflows, AI agents, integrations, and dashboards.</p>

      <section className="mb-10">
        <h2 className="text-white text-xl font-semibold mb-4">Early Access</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earlyAccess.map(v => (
            <div key={v.name} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="inline-block text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5 mb-2">EARLY ACCESS</div>
              <h3 className="text-white font-semibold mb-1">{v.name}</h3>
              <p className="text-slate-400 text-sm">{v.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-white text-xl font-semibold mb-4">Preview (Prototype)</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preview.map(v => (
            <div key={v.name} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="inline-block text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded px-2 py-0.5 mb-2">PREVIEW</div>
              <h3 className="text-white font-semibold mb-1">{v.name}</h3>
              <p className="text-slate-400 text-sm">{v.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-white text-xl font-semibold mb-3">Roadmap</h2>
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-300">
          {roadmap.map(name => (
            <li key={name} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">{name}</li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <a href="/contact" className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold">Request Early Access →</a>
      </div>
    </main>
  );
}

