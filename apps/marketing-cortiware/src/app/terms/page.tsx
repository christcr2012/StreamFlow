import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function TermsPage() {
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
          <h1 className="text-5xl font-black text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400">Last updated: October 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing and using Cortiware, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on Cortiware for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Modifying or copying the materials</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Using the materials for any commercial purpose or for any public display</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Attempting to decompile or reverse engineer any software contained on Cortiware</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Removing any copyright or other proprietary notations from the materials</span></li>
              <li className="flex gap-3"><span className="text-emerald-400">•</span> <span>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
            <p className="text-slate-300 leading-relaxed">
              The materials on Cortiware are provided on an &apos;as is&apos; basis. Cortiware makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
            <p className="text-slate-300 leading-relaxed">
              In no event shall Cortiware or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Cortiware, even if Cortiware or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Accuracy of Materials</h2>
            <p className="text-slate-300 leading-relaxed">
              The materials appearing on Cortiware could include technical, typographical, or photographic errors. Cortiware does not warrant that any of the materials on its website are accurate, complete, or current. Cortiware may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Links</h2>
            <p className="text-slate-300 leading-relaxed">
              Cortiware has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Cortiware of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Modifications</h2>
            <p className="text-slate-300 leading-relaxed">
              Cortiware may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
            <p className="text-slate-300 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Enterprise Agreements</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              For enterprise customers, custom terms and service level agreements are available.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-semibold transition-all duration-300">
              Contact Sales
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

