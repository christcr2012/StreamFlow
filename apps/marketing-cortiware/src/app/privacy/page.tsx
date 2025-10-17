import Navigation from '@/components/Navigation';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: October 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              Cortiware (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;Company&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <p className="text-slate-300 leading-relaxed mb-4">We collect information in the following ways:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span><strong>Account Information:</strong> Name, email, company name, phone number</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span><strong>Usage Data:</strong> Pages visited, time spent, features used, device information</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span><strong>Business Data:</strong> Customer information you input into the platform</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span><strong>Communication:</strong> Messages, support tickets, feedback</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed mb-4">We use collected information to:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Provide, maintain, and improve our services</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Process transactions and send related information</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Send promotional communications (with your consent)</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Respond to your inquiries and provide customer support</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Monitor and analyze trends and usage</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-slate-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest using industry-standard protocols.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed mb-4">You have the right to:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Access your personal information</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Correct inaccurate data</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Request deletion of your data</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Opt-out of marketing communications</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@cortiware.com" className="text-emerald-400 hover:text-emerald-300">privacy@cortiware.com</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

