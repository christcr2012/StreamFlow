export default function ProductsPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-6">Products</h1>
      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Cortiware</h2>
          <p className="text-slate-300 mb-4">Multi-tenant AI platform with branding, security, and agentic workflows.</p>
          <a href="https://cortiware.com" className="text-teal-400 hover:text-teal-300 font-semibold">Visit cortiware.com →</a>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Custom AI Solutions</h2>
          <p className="text-slate-300 mb-4">Tailored systems for your domain—automation, analytics, agents.</p>
          <a href="/contact" className="text-teal-400 hover:text-teal-300 font-semibold">Talk to us →</a>
        </div>
      </div>
    </main>
  );
}

