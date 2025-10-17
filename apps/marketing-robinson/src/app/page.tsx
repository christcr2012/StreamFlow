export default function RobinsonHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg" />
            <span className="text-xl font-bold text-white">Robinson AI Systems</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="/products" className="text-slate-300 hover:text-white transition-colors">Products</a>
            <a href="/industries" className="text-slate-300 hover:text-white transition-colors">Industries</a>
            <a href="/about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <a href="https://provider.robinsonaisystems.com/login" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white rounded-lg font-medium shadow-sm" style={{ background: 'var(--cortiware-gradient)' }}>
              Provider Sign-in →
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

          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Enterprise AI Solutions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Built for Scale
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Robinson AI Systems delivers cutting-edge artificial intelligence platforms
            that power the next generation of business applications. From multi-tenant
            SaaS to custom AI agents, we build the infrastructure that scales.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/products" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors font-semibold text-lg">
              Explore Products
            </a>
            <a href="/contact" className="px-8 py-4 border-2 border-slate-700 hover:border-teal-500 text-white rounded-lg transition-colors font-semibold text-lg">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Social proof logos */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 pb-12">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
          <div className="h-8 w-28 rounded-md bg-slate-800/80 border border-slate-700" />
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Our Products</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cortiware Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Cortiware</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Multi-tenant SaaS platform with advanced AI capabilities, custom branding,

              and enterprise-grade security. Built for businesses that need to scale
              their AI operations across multiple clients.
            </p>
            <a href="https://cortiware.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-2">
              Learn More →
            </a>
          </div>

          {/* Custom Solutions Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5 hover:shadow-teal-400/10 hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Custom AI Solutions</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Tailored AI systems designed for your specific business needs. From
              intelligent automation to predictive analytics, we build solutions
              that drive real business value.
            </p>
            <a href="/contact" className="text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-2">
              Get Started →
            </a>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">What We Do Best</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center text-[10px] font-bold tracking-wide uppercase" style={{ background: 'linear-gradient(135deg,#00B67A33,#00E3C233)' }}>ENG</div>
            <h3 className="text-xl font-bold text-white mb-3">Product Engineering</h3>
            <p className="text-slate-300">Designing and building AI products and platforms with robust data models, clean APIs, and modern UX.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center text-[10px] font-bold tracking-wide uppercase" style={{ background: 'linear-gradient(135deg,#00B67A33,#00E3C233)' }}>AI</div>
            <h3 className="text-xl font-bold text-white mb-3">Applied AI & Agents</h3>
            <p className="text-slate-300">LLM-driven agents, retrieval pipelines, prompt tooling, and evaluation loops tuned for business results.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center text-[10px] font-bold tracking-wide uppercase" style={{ background: 'linear-gradient(135deg,#00B67A33,#00E3C233)' }}>SCALE</div>
            <h3 className="text-xl font-bold text-white mb-3">Reliability & Scale</h3>
            <p className="text-slate-300">Multi-tenant architectures, observability, governance, and rollout strategies from startup to enterprise.</p>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">What We Deliver</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="text-2xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Strategy & Architecture</h3>
            <p className="text-slate-300">From discovery to system design, we blueprint AI platforms that scale from your first customer to enterprise.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="text-2xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Product Engineering</h3>
            <p className="text-slate-300">Multi-tenant SaaS, agent workflows, analytics, and secure integrations delivered with enterprise rigor.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-teal-500/5">
            <div className="text-2xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Reliability & Security</h3>
            <p className="text-slate-300">Operational excellence: observability, incident response, access control, and compliance-minded practices.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-white mb-6">About Robinson AI Systems</h2>
          <p className="text-xl text-slate-300 leading-relaxed mb-6">
            Founded on the principle that AI should be accessible, scalable, and
            enterprise-ready, Robinson AI Systems builds the infrastructure that
            powers modern AI applications.
          </p>
          <p className="text-lg text-slate-400 leading-relaxed">
            Our team combines deep expertise in distributed systems, machine learning,
            and enterprise software to deliver solutions that scale from startup to
            enterprise. We believe in building platforms that grow with your business.
          </p>
        </div>
      </section>
      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10">
          <blockquote className="text-xl text-slate-200 leading-relaxed mb-4">“Robinson delivered a production-ready AI platform that we scaled from our first cohort to hundreds of customers without a rewrite.”</blockquote>
          <div className="text-slate-400">Head of Engineering, Growth-stage SaaS</div>
        </div>
      </section>


      {/* Contact Section */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">Get in Touch</h2>
          <p className="text-xl text-slate-300 mb-8">
            Ready to transform your business with AI? Let&apos;s talk about how we can help.
          </p>
          <a href="mailto:contact@robinsonaisystems.com" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors font-semibold text-lg inline-block">
            contact@robinsonaisystems.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded" />
                <span className="font-semibold text-white">Robinson AI Systems</span>
              </div>
              <p className="text-slate-400 text-sm">High-end, trustworthy AI platforms and services.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/products" className="text-slate-400 hover:text-white transition-colors">Overview</a></li>
                <li><a href="https://cortiware.com" className="text-slate-400 hover:text-white transition-colors">Cortiware</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Access</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://provider.robinsonaisystems.com/login" className="text-slate-400 hover:text-white transition-colors">Provider Sign-in</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-slate-400 text-sm">© 2025 Robinson AI Systems</span>
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

