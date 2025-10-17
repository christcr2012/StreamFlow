export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-6">Contact</h1>
      <p className="text-slate-300 mb-8">Reach us at <a className="text-teal-400" href="mailto:contact@robinsonaisystems.com">contact@robinsonaisystems.com</a>.</p>
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-white font-semibold mb-4">Project Inquiry</h2>
        <p className="text-slate-400 text-sm">For detailed proposals, include your goals, timeline, and constraints.</p>
      </div>
    </main>
  );
}

