import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Robinson AI Systems - Enterprise AI Solutions',
  description: 'Enterprise AI consulting and delivery partner. Custom platforms, agent systems, and vertical solutions built for scale.',
};

export default function RobinsonHomePage() {
  return (
    <div className="bg-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-elevated to-bg py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy column */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text mb-6 leading-tight">
                Enterprise AI Solutions{' '}
                <span className="gradient-text">Built for Scale</span>
              </h1>
              <p className="text-xl text-text-muted mb-8 leading-relaxed">
                Robinson AI Systems delivers cutting-edge artificial intelligence platforms that power the next generation of business applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/services"
                  className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105 text-center"
                >
                  Explore Services
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal text-center"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

            {/* Visual column */}
            <div className="relative">
              <div className="enterprise-card p-8">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="ml-auto text-text-muted text-xs">AI Platform</div>
                </div>
                <div className="space-y-3">
                  <div className="h-12 rounded-lg bg-bg-elevated border border-border" />
                  <div className="h-12 rounded-lg bg-bg-elevated border border-border" />
                  <div className="h-12 rounded-lg bg-bg-elevated border border-border" />
                  <div className="h-8 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 bg-bg-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-text-muted text-sm mb-6">Built on proven infrastructure</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Next.js', 'Vercel', 'Prisma', 'PostgreSQL', 'Tailwind CSS', 'Turborepo'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-surface border border-border text-text-muted text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-12 text-center">Our Products</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Cortiware Card */}
            <div className="enterprise-card p-8 hover:-translate-y-1 transition-transform duration-normal">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-6" />
              <h3 className="text-2xl font-bold text-text mb-4">Cortiware</h3>
              <p className="text-text-muted mb-6 leading-relaxed">
                AI-powered business management platform for service industries. Multi-tenant SaaS with advanced AI capabilities, custom branding, and enterprise-grade security.
              </p>
              <a
                href="https://www.cortiware.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary font-semibold inline-flex items-center gap-2 transition-colors duration-fast"
              >
                Learn More →
              </a>
            </div>

            {/* Custom Solutions Card */}
            <div className="enterprise-card p-8 hover:-translate-y-1 transition-transform duration-normal">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mb-6" />
              <h3 className="text-2xl font-bold text-text mb-4">Custom AI Solutions</h3>
              <p className="text-text-muted mb-6 leading-relaxed">
                Tailored AI systems designed for your specific business needs. From intelligent automation to predictive analytics, we build solutions that drive real business value.
              </p>
              <Link
                href="/contact"
                className="text-brand-primary hover:text-brand-secondary font-semibold inline-flex items-center gap-2 transition-colors duration-fast"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-gradient-to-b from-bg to-bg-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-12 text-center">What We Do Best</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-brand-primary/20 mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Product Engineering</h3>
              <p className="text-text-muted">Designing and building AI products and platforms with robust data models, clean APIs, and modern UX.</p>
            </div>
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-brand-primary/20 mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Applied AI & Agents</h3>
              <p className="text-text-muted">LLM-driven agents, retrieval pipelines, prompt tooling, and evaluation loops tuned for business results.</p>
            </div>
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-brand-primary/20 mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Reliability & Scale</h3>
              <p className="text-text-muted">Multi-tenant architectures, observability, governance, and rollout strategies from startup to enterprise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">
            Ready to Transform Your Business with AI?
          </h2>
          <p className="text-xl text-text-muted mb-8">
            Let&apos;s discuss how Robinson AI Systems can help you achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
            >
              Contact Sales
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Robinson AI Systems - Enterprise AI Solutions',
            description: 'Enterprise AI consulting and delivery partner. Custom platforms, agent systems, and vertical solutions built for scale.',
            url: 'https://www.robinsonaisystems.com',
          }),
        }}
      />
    </div>
  );
}
