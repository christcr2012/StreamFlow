export default function CortiwareHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg" />
            <span className="text-xl font-bold text-white">Cortiware</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="/features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="/industries" className="text-slate-300 hover:text-white transition-colors">Industries</a>
            <a href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white rounded-lg font-medium shadow-sm" style={{ background: 'var(--cortiware-gradient)' }}>
              Launch App →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden max-w-7xl mx-auto px-6 py-28">
        <div className="relative text-center max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl p-8 md:p-12 shadow-lg shadow-teal-500/10">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full blur-3xl opacity-20" style={{ background: 'var(--cortiware-gradient)' }} />
        </div>

          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="inline-block px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-sm font-semibold">
              Multi-Tenant AI Platform
            </div>
            <div className="inline-block px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-full text-slate-300 text-xs">
              A Robinson AI Systems product
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            The AI Platform
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Built to Scale
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Cortiware is a multi-tenant SaaS platform that brings enterprise-grade AI
            capabilities to your business. Custom branding, advanced security, and
            powerful AI agents—all in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors font-semibold text-lg">
              Get Started Free
            </a>
            <a href="#features" className="px-8 py-4 border-2 border-slate-700 hover:border-teal-500 text-white rounded-lg transition-colors font-semibold text-lg">
              See Features
            </a>
          </div>
        </div>
      </section>
      {/* Product preview (distinct from Robinson) */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-teal-500/10">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
            <div className="ml-auto text-slate-400 text-xs">Product Preview</div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="h-20 rounded-lg bg-slate-800/80 border border-slate-700/70" />
            <div className="h-20 rounded-lg bg-slate-800/80 border border-slate-700/70" />
            <div className="h-20 rounded-lg bg-slate-800/80 border border-slate-700/70" />
          </div>
        </div>
      </section>
      {/* Performance Metrics */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          {[{k:'Avg setup time',v:'< 1 day'},{k:'Median response',v:'< 250ms'},{k:'Uptime target',v:'99.9%'}].map((m) => (
            <div key={m.k} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
              <div className="text-3xl font-extrabold text-white mb-1">{m.v}</div>
              <div className="text-slate-400 text-sm">{m.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Built on a modern stack (truthful, no placeholders) */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-200">
          {['Next.js','Vercel','Prisma','PostgreSQL','Tailwind CSS','Turborepo'].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm">
              {t}
            </span>
          ))}
        </div>
      </section>
      {/* Who it's for */}
      <section className="max-w-7xl mx-auto px-6 pt-2 pb-12">
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-200">
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm">Startups</span>
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm">Growing teams</span>
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm">Agencies/MSPs</span>
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm">Multi-location enterprise</span>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Popular Use Cases</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">

            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
            <h3 className="text-xl font-semibold text-white mb-2">Client Portals</h3>
            <p className="text-slate-300">Offer your clients branded access with permissions, workflows, and real-time insights.</p>
          </div>
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
            <h3 className="text-xl font-semibold text-white mb-2">Agency Workspaces</h3>
            <p className="text-slate-300">Multi-tenant management for agencies/MSPs with templated setups and analytics.</p>
          </div>
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise Divisions</h3>
            <p className="text-slate-300">Segmented tenants per location/division with centralized governance and RBAC.</p>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                <circle cx="9" cy="10" r="1.2" fill="white"/>
                <circle cx="12" cy="8" r="1.2" fill="white"/>
                <circle cx="15" cy="11" r="1.2" fill="white"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Custom Branding</h3>
            <p className="text-slate-300 leading-relaxed">
              White-label your platform with custom domains, logos, colors, and themes.
              Each tenant gets their own branded experience.
            </p>

          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="7" width="14" height="10" rx="2" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                <circle cx="9" cy="12" r="1" fill="white"/>
                <circle cx="15" cy="12" r="1" fill="white"/>
                <rect x="9" y="4" width="6" height="2" rx="1" fill="white"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">AI Agents</h3>
            <p className="text-slate-300 leading-relaxed">
              Deploy intelligent AI agents for customer support, data analysis,
              content generation, and more. Powered by the latest LLMs.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="14" height="9" rx="2" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                <path d="M8 10V8a4 4 0 118 0v2" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Enterprise Security</h3>
            <p className="text-slate-300 leading-relaxed">
              SOC 2 compliant infrastructure with role-based access control,
              audit logging, and data encryption at rest and in transit.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="12" width="3" height="6" rx="1" fill="white"/>
                <rect x="10.5" y="9" width="3" height="9" rx="1" fill="white"/>
                <rect x="16" y="6" width="3" height="12" rx="1" fill="white"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Analytics & Insights</h3>
            <p className="text-slate-300 leading-relaxed">
              Real-time dashboards, usage metrics, and AI-powered insights to
              help you understand your data and make better decisions.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-slate-300 leading-relaxed">
              Built on modern infrastructure with edge caching, optimized queries,
              and real-time updates. Sub-second response times guaranteed.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8v4M17 8v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <rect x="4" y="12" width="16" height="6" rx="2" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">API-First</h3>
            <p className="text-slate-300 leading-relaxed">
              Comprehensive REST API with webhooks, SDKs, and detailed documentation.
              Integrate with your existing tools and workflows.
            </p>
          </div>
        </div>
      </section>


      {/* Product Demo */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative aspect-video rounded-2xl border border-slate-800/80 overflow-hidden bg-slate-900/60">
          <div className="absolute inset-0 grid place-items-center">
            <button aria-label="Play demo" className="h-16 w-16 rounded-full bg-teal-500 hover:bg-teal-400 text-white grid place-items-center shadow-lg shadow-teal-500/20 transition-colors">
              ▶
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-slate-300 text-sm bg-gradient-to-t from-slate-900/80 to-transparent">2-min product overview</div>
        </div>
      </section>

      {/* Product Tour */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Product Tour</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[{
            title: 'Onboard in Minutes',
            desc: 'Create your org, invite teammates, and pick a branded theme. No code required to get started.'
          },{
            title: 'Launch AI Agents',
            desc: 'Enable prebuilt agents for support, analytics, and content—or bring your own prompts.'
          },{
            title: 'Scale with Governance',
            desc: 'Add tenants as you grow. Centralized policies, audit trails, and per-tenant branding.'
          }].map((s) => (
            <div key={s.title} className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
              <h3 className="text-2xl font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Why Teams Pick Cortiware</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <table className="min-w-full text-left">
            <thead className="text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Capability</th>
                <th className="px-6 py-4 font-semibold">Cortiware</th>
                <th className="px-6 py-4 font-semibold">DIY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {[
                ['Multi-tenant RBAC','Built-in','Custom & brittle'],
                ['Audit logging','Built-in, exportable','Custom, partial'],
                ['Per-tenant config','UI + API','Manual env juggling'],
                ['Usage & billing','Native hooks','Hard to model'],
                ['Theming/white-label','Instant','Rebuild for each client'],
              ].map((row)=> (
                <tr key={row[0]} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{row[0]}</td>
                  <td className="px-6 py-4"><span className="text-teal-400">{row[1]}</span></td>
                  <td className="px-6 py-4 text-slate-400">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <div className="text-4xl font-bold text-white mb-6">
              $49<span className="text-lg text-slate-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Up to 5 users
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> 10GB storage
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Basic AI agents
              </li>
              <li className="text-slate-300 flex items-center gap-2">

                <span className="text-teal-400">✓</span> Email support
              </li>
            </ul>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="block w-full px-6 py-3 border-2 border-slate-700 hover:border-teal-500 text-white rounded-lg transition-colors font-semibold text-center">
              Start Free Trial
            </a>
          </div>

          {/* Professional */}
          <div className="bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border-2 border-teal-500 rounded-2xl p-8 relative shadow-xl shadow-teal-500/10 hover:shadow-teal-400/20 hover:-translate-y-1 transition-all duration-300 hover:scale-[1.01] ring-1 ring-teal-500/30 hover:ring-teal-400/40">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-500 text-white text-sm font-semibold rounded-full">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
            <div className="text-4xl font-bold text-white mb-6">
              $199<span className="text-lg text-slate-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Up to 50 users
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> 100GB storage
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Advanced AI agents
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Custom branding
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Priority support
              </li>
            </ul>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="block w-full px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors font-semibold text-center">
              Start Free Trial
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-bold text-white mb-6">
              Custom
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Unlimited users
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Unlimited storage
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> Custom AI models
              </li>
              <li className="text-slate-300 flex items-center gap-2">

                <span className="text-teal-400">✓</span> Dedicated support
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-teal-400">✓</span> SLA guarantee
              </li>
            </ul>
            <a href="mailto:sales@cortiware.com" className="block w-full px-6 py-3 border-2 border-slate-700 hover:border-teal-500 text-white rounded-lg transition-colors font-semibold text-center">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Cortiware to power their AI operations.
            Start your free trial today—no credit card required.
          </p>
          <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors font-semibold text-lg inline-block">
            Start Free Trial →
          </a>
        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[{
            q: 'How fast can we get started?',
            a: 'Most teams are live within a day. Create your org, pick a theme, invite teammates, and you can start launching tenants immediately.'
          },{
            q: 'Can we bring our own AI models?',
            a: 'Yes. Cortiware supports hosted providers and custom endpoints, with per-tenant configuration and usage policies.'
          },{
            q: 'How do you handle multi-tenant security?',
            a: 'Isolated schemas, strong RBAC, audit logs, and optional SSO. Each tenant has separated data boundaries by design.'
          },{
            q: 'What does pricing look like as we scale?',
            a: 'Start simple and grow. Plans scale by seats and tenants; enterprise agreements are available for larger deployments.'
          }].map((f) => (
            <div key={f.q} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">{f.q}</h3>
              <p className="text-slate-300">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Integrations</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {['Stripe','PostgreSQL','SendGrid','Webhooks','S3-Compatible Storage','Zapier','Slack','REST APIs'].map((i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg shadow-teal-500/5">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500" />
              <div className="text-white font-semibold">{i}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Developer-first */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Developer-First</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8">

            <h3 className="text-xl font-semibold text-white mb-2">API-First</h3>
            <p className="text-slate-300">Comprehensive REST APIs with webhooks and future SDKs for popular stacks.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Tenant Tooling</h3>
            <p className="text-slate-300">Tenant-aware auth, audit, feature flags, and usage metrics out of the box.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Observability</h3>
            <p className="text-slate-300">Structured logs and traces designed for scalable incident response.</p>
          </div>
        </div>
      </section>

      {/* Enterprise Ready microband */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['RBAC','SLA Options','SAML/SSO (roadmap)','Data Residency (roadmap)','Audit Trails'].map((b) => (
            <span key={b} className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm text-slate-200">{b}</span>
          ))}
        </div>
      </section>



      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">What Teams Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{
            q:'“We launched multi-tenant in a weekend.”',a:'Head of Product, B2B SaaS'
          },{
            q:'“Security reviews were a breeze with Cortiware.”',a:'CTO, Fintech'
          },{
            q:'“Finally, AI ops we can standardize across clients.”',a:'Director, Agency'
          }].map(t => (
            <div key={t.q} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
              <p className="text-white text-lg mb-4">{t.q}</p>
              <div className="text-slate-400 text-sm">{t.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 md:p-10 text-center">
          <h3 className="text-2xl font-semibold text-white mb-3">Get product updates</h3>
          <p className="text-slate-300 mb-6">No spam. Only meaningful releases and guides.</p>
          <form action="#" onSubmit={(e)=>e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input type="email" required placeholder="you@company.com" className="flex-1 px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700/70 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold transition-colors">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}

      {/* Case Studies (anonymized) */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Case Studies</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
            <h3 className="text-2xl font-semibold text-white mb-2">Scaling B2B Agency Ops</h3>
            <p className="text-slate-300 mb-4">Onboarded 40+ client tenants with branded portals, RBAC, and audit trails—no code.</p>
            <a href="#contact" className="text-teal-400 hover:text-teal-300 font-semibold">Request full story →</a>
          </div>
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all" />
            <h3 className="text-2xl font-semibold text-white mb-2">Tenant Analytics at Scale</h3>
            <p className="text-slate-300 mb-4">Delivered real-time usage metrics and dashboards across divisions with &lt;200ms med. latency.</p>
            <a href="#contact" className="text-teal-400 hover:text-teal-300 font-semibold">Learn how →</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded" />
                <span className="font-bold text-white">Cortiware</span>
              </div>
              <p className="text-slate-400 text-sm">
                Enterprise AI platform built for scale.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</a></li>




                <li><a href="#docs" className="text-slate-400 hover:text-white transition-colors text-sm">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="https://robinsonaisystems.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">About</a></li>
                <li><a href="mailto:contact@cortiware.com" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</a></li>
                <li><a href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2025 Cortiware. A Robinson AI Systems product.</p>
            <div className="flex gap-6">
              <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">Launch App</a>
              <a href="https://robinsonaisystems.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">Robinson AI Systems</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
