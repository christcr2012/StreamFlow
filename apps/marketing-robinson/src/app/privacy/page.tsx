import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Robinson AI Systems',
  description: 'Robinson AI Systems privacy policy. Learn how we collect, use, and protect your data.',
  openGraph: {
    title: 'Privacy Policy - Robinson AI Systems',
    description: 'Learn how we collect, use, and protect your data',
    url: 'https://www.robinsonaisystems.com/privacy',
  },
  twitter: {
    title: 'Privacy Policy - Robinson AI Systems',
    description: 'Learn how we collect, use, and protect your data',
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Introduction</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Robinson AI Systems, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Information We Collect</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-4">
              <li>Name, email address, and contact information</li>
              <li>Company name and business information</li>
              <li>Communications with us</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">How We Use Your Information</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Respond to your inquiries and requests</li>
              <li>Send you technical notices and support messages</li>
              <li>Communicate with you about products, services, and events</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Data Security</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Data Retention</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Your Rights</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 mb-4">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your personal information</li>
              <li>Objection to processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Third-Party Services</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We may use third-party service providers to help us operate our business and provide services to you. These providers are contractually obligated to protect your information and use it only for the purposes we specify.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">International Data Transfers</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Changes to This Policy</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">Contact Us</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-text-muted">
              <a href="mailto:privacy@robinsonaisystems.com" className="text-brand-primary hover:text-brand-secondary transition-colors duration-fast">
                privacy@robinsonaisystems.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

