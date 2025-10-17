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
              Built for Scale
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
      {/* Social proof logos */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
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


      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              🎨
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Custom Branding</h3>
            <p className="text-slate-300 leading-relaxed">
              White-label your platform with custom domains, logos, colors, and themes.
              Each tenant gets their own branded experience.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              🤖
            </div>
            <h3 className="text-xl font-bold text-white mb-4">AI Agents</h3>
            <p className="text-slate-300 leading-relaxed">
              Deploy intelligent AI agents for customer support, data analysis,
              content generation, and more. Powered by the latest LLMs.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              🔒
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Enterprise Security</h3>
            <p className="text-slate-300 leading-relaxed">
              SOC 2 compliant infrastructure with role-based access control,
              audit logging, and data encryption at rest and in transit.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Analytics & Insights</h3>
            <p className="text-slate-300 leading-relaxed">
              Real-time dashboards, usage metrics, and AI-powered insights to
              help you understand your data and make better decisions.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-slate-300 leading-relaxed">
              Built on modern infrastructure with edge caching, optimized queries,
              and real-time updates. Sub-second response times guaranteed.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl">
              🔌
            </div>
            <h3 className="text-xl font-bold text-white mb-4">API-First</h3>
            <p className="text-slate-300 leading-relaxed">
              Comprehensive REST API with webhooks, SDKs, and detailed documentation.
              Integrate with your existing tools and workflows.
            </p>
          </div>
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
          <div className="bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border-2 border-teal-500 rounded-2xl p-8 relative shadow-xl shadow-teal-500/10 hover:shadow-teal-400/20 hover:-translate-y-1 transition-all">
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

      {/* Footer */}
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
