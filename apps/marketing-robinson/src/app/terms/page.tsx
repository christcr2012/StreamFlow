import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Robinson AI Systems',
  description: 'Robinson AI Systems terms of service. Read our terms and conditions for using our services.',
  openGraph: {
    title: 'Terms of Service - Robinson AI Systems',
    description: 'Read our terms and conditions for using our services',
    url: 'https://www.robinsonaisystems.com/terms',
  },
  twitter: {
    title: 'Terms of Service - Robinson AI Systems',
    description: 'Read our terms and conditions for using our services',
  },
};

export default function TermsPage() {
  return (
    <div className="bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Agreement to Terms</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              By accessing or using the services provided by Robinson AI Systems, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Services</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Robinson AI Systems provides enterprise AI consulting, custom development, and related services. The specific terms of service delivery will be outlined in individual service agreements or statements of work.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">User Responsibilities</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use our services in compliance with applicable laws and regulations</li>
              <li>Not use our services for any unlawful or prohibited purpose</li>
              <li>Not interfere with or disrupt our services or servers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Intellectual Property</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              All content, features, and functionality of our services are owned by Robinson AI Systems and are protected by copyright, trademark, and other intellectual property laws. Custom work product ownership will be specified in individual service agreements.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Confidentiality</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We maintain strict confidentiality of client information and proprietary data. Specific confidentiality terms will be outlined in non-disclosure agreements and service contracts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Limitation of Liability</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              To the maximum extent permitted by law, Robinson AI Systems shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Warranties</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Our services are provided &quot;as is&quot; without warranties of any kind, either express or implied. Specific service level agreements and warranties will be outlined in individual service contracts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Termination</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We reserve the right to terminate or suspend access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Governing Law</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Changes to Terms</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Contact Information</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-text-muted">
              <a href="mailto:legal@robinsonaisystems.com" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                legal@robinsonaisystems.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

