import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why Robinson AI Systems - Robinson AI Systems',
  description: 'Why choose Robinson AI Systems? Enterprise expertise, proven track record, and commitment to delivering AI solutions that drive real business value.',
  openGraph: {
    title: 'Why Robinson AI Systems',
    description: 'Enterprise expertise and proven track record in AI solutions',
    url: 'https://www.robinsonaisystems.com/why',
  },
  twitter: {
    title: 'Why Robinson AI Systems',
    description: 'Enterprise expertise and proven track record in AI solutions',
  },
};

export default function WhyPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-elevated to-bg py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text mb-6">
              Why Choose{' '}
              <span className="gradient-text">Robinson</span>
            </h1>
            <p className="text-xl text-text-muted leading-relaxed">
              We combine deep technical expertise with a relentless focus on delivering business value. Here&apos;s what sets us apart.
            </p>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Enterprise Expertise */}
            <div>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text mb-4">Enterprise Expertise</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                We understand the unique challenges of enterprise AI adoption. From legacy system integration to compliance requirements, we&apos;ve solved the hard problems.
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Proven track record with Fortune 500 companies</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Deep understanding of enterprise architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Experience with complex compliance requirements</span>
                </li>
              </ul>
            </div>

            {/* Business Value Focus */}
            <div>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text mb-4">Business Value First</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                We don&apos;t build AI for AI&apos;s sake. Every solution is designed to deliver measurable business outcomes and ROI.
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Clear KPIs and success metrics from day one</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Iterative approach with rapid value delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Transparent reporting and continuous optimization</span>
                </li>
              </ul>
            </div>

            {/* Technical Excellence */}
            <div>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text mb-4">Technical Excellence</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Our team brings world-class engineering expertise and stays at the forefront of AI innovation.
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Modern cloud-native architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Best-in-class security and compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Scalable, maintainable, production-ready code</span>
                </li>
              </ul>
            </div>

            {/* Partnership Approach */}
            <div>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text mb-4">True Partnership</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                We&apos;re not just vendors—we&apos;re partners invested in your long-term success.
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated team aligned with your goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Transparent communication and collaboration</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ongoing support and continuous improvement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-bg to-bg-elevated">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-text-muted mb-8">
            Let&apos;s discuss how Robinson AI Systems can help you achieve your AI goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
            >
              Contact Us
            </a>
            <a
              href="/services"
              className="px-8 py-4 border border-border hover:border-brand-primary text-text rounded-lg font-semibold transition-all duration-normal"
            >
              Explore Services
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
            '@type': 'WebPage',
            name: 'Why Robinson AI Systems',
            description: 'Enterprise expertise and proven track record in AI solutions',
            url: 'https://www.robinsonaisystems.com/why',
          }),
        }}
      />
    </div>
  );
}

