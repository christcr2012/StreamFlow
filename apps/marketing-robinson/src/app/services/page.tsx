import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services - Robinson AI Systems',
  description: 'Enterprise AI consulting, custom development, and delivery services. From strategy to deployment, we build AI solutions that scale.',
  openGraph: {
    title: 'Services - Robinson AI Systems',
    description: 'Enterprise AI consulting, custom development, and delivery services',
    url: 'https://www.robinsonaisystems.com/services',
  },
  twitter: {
    title: 'Services - Robinson AI Systems',
    description: 'Enterprise AI consulting, custom development, and delivery services',
  },
};

export default function ServicesPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-elevated to-bg py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text mb-6">
              Enterprise AI{' '}
              <span className="gradient-text">Services</span>
            </h1>
            <p className="text-xl text-text-muted leading-relaxed">
              From strategy to deployment, we deliver AI solutions that transform your business. Custom platforms, agent systems, and vertical solutions built for scale.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Consulting */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">AI Strategy & Consulting</h3>
              <p className="text-text-muted leading-relaxed">
                Expert guidance on AI adoption, architecture design, and implementation roadmaps tailored to your business objectives.
              </p>
            </div>

            {/* Custom Development */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Custom Platform Development</h3>
              <p className="text-text-muted leading-relaxed">
                End-to-end development of custom AI platforms, agent systems, and vertical solutions built on modern cloud infrastructure.
              </p>
            </div>

            {/* Integration */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">System Integration</h3>
              <p className="text-text-muted leading-relaxed">
                Seamless integration of AI capabilities into your existing systems, workflows, and business processes.
              </p>
            </div>

            {/* Training */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Training & Enablement</h3>
              <p className="text-text-muted leading-relaxed">
                Comprehensive training programs to empower your team to leverage AI tools and platforms effectively.
              </p>
            </div>

            {/* Support */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Ongoing Support</h3>
              <p className="text-text-muted leading-relaxed">
                Dedicated support, maintenance, and continuous improvement to ensure your AI solutions deliver lasting value.
              </p>
            </div>

            {/* Vertical Solutions */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Vertical Solutions</h3>
              <p className="text-text-muted leading-relaxed">
                Industry-specific AI solutions like Cortiware, designed for service businesses with deep domain expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-bg to-bg-elevated">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-text-muted mb-8">
            Let&apos;s discuss how our AI services can help you achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
            >
              Contact Sales
            </a>
            <a
              href="/about"
              className="px-8 py-4 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal"
            >
              Learn More About Us
            </a>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Enterprise AI Services',
            provider: {
              '@type': 'Organization',
              name: 'Robinson AI Systems',
              url: 'https://www.robinsonaisystems.com',
            },
            serviceType: 'AI Consulting and Development',
            areaServed: 'Worldwide',
            description:
              'Enterprise AI consulting, custom development, and delivery services. From strategy to deployment, we build AI solutions that scale.',
          }),
        }}
      />
    </div>
  );
}

