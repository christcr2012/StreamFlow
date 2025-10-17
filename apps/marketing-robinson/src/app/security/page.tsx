import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & Compliance - Robinson AI Systems',
  description: 'Enterprise-grade security, compliance, and data protection. SOC 2, GDPR, HIPAA-ready infrastructure with end-to-end encryption.',
  openGraph: {
    title: 'Security & Compliance - Robinson AI Systems',
    description: 'Enterprise-grade security and compliance for AI solutions',
    url: 'https://www.robinsonaisystems.com/security',
  },
  twitter: {
    title: 'Security & Compliance - Robinson AI Systems',
    description: 'Enterprise-grade security and compliance for AI solutions',
  },
};

export default function SecurityPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-elevated to-bg py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text mb-6">
              Enterprise-Grade{' '}
              <span className="gradient-text">Security</span>
            </h1>
            <p className="text-xl text-text-muted leading-relaxed">
              Your data security and compliance are our top priorities. We build AI solutions on a foundation of trust, transparency, and industry-leading security practices.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Encryption */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">End-to-End Encryption</h3>
              <p className="text-text-muted leading-relaxed">
                All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your sensitive information is protected at every layer.
              </p>
            </div>

            {/* Access Control */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Role-Based Access Control</h3>
              <p className="text-text-muted leading-relaxed">
                Granular permissions and multi-factor authentication ensure only authorized users access your systems.
              </p>
            </div>

            {/* Compliance */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">Compliance Ready</h3>
              <p className="text-text-muted leading-relaxed">
                SOC 2 Type II, GDPR, CCPA, and HIPAA-ready infrastructure. We help you meet your regulatory requirements.
              </p>
            </div>

            {/* Monitoring */}
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">24/7 Monitoring</h3>
              <p className="text-text-muted leading-relaxed">
                Continuous security monitoring, threat detection, and incident response to protect your systems around the clock.
              </p>
            </div>
          </div>

          {/* Certifications */}
          <div className="enterprise-card p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-8 text-center">
              Security Standards & Certifications
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">SOC 2</div>
                <p className="text-text-muted">Type II Certified</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">GDPR</div>
                <p className="text-text-muted">Compliant</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">HIPAA</div>
                <p className="text-text-muted">Ready</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">CCPA</div>
                <p className="text-text-muted">Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 bg-gradient-to-b from-bg to-bg-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-12 text-center">
            Our Security Practices
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-text mb-3">Regular Audits</h3>
              <p className="text-text-muted">
                Independent third-party security audits and penetration testing on a regular schedule.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-text mb-3">Data Residency</h3>
              <p className="text-text-muted">
                Choose where your data is stored with multi-region support and data sovereignty options.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-text mb-3">Incident Response</h3>
              <p className="text-text-muted">
                Documented incident response procedures with 24/7 security team availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">
            Questions About Security?
          </h2>
          <p className="text-xl text-text-muted mb-8">
            Our security team is here to answer your questions and discuss your specific requirements.
          </p>
          <a
            href="mailto:security@robinsonaisystems.com"
            className="inline-block px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-text-on-brand rounded-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-normal hover:scale-105"
          >
            Contact Security Team
          </a>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Security & Compliance',
            description: 'Enterprise-grade security, compliance, and data protection',
            url: 'https://www.robinsonaisystems.com/security',
          }),
        }}
      />
    </div>
  );
}

