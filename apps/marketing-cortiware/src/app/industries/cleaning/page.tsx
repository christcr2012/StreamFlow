import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function CleaningIndustryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm font-bold mb-8">
            ✓ EARLY ACCESS AVAILABLE
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none tracking-tight">
            Cleaning Business
            <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Management Software
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8">
            Complete business management platform built specifically for commercial and residential cleaning companies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started" className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
              <span className="relative z-10">Start Free Trial →</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105">
              Schedule Demo
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">Everything You Need to Run Your Cleaning Business</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Smart Scheduling',
                description: 'Route optimization, recurring jobs, team assignments, and automated reminders.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                title: 'Instant Estimates',
                description: 'Room-by-room pricing, service packages, and professional quotes in minutes.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Automated Billing',
                description: 'Recurring invoices, payment processing, and automatic payment reminders.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: 'Customer Portal',
                description: 'Self-service booking, payment history, and service requests for your clients.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Quality Assurance',
                description: 'Photo documentation, checklists, and customer feedback tracking.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Business Analytics',
                description: 'Revenue tracking, team performance, customer retention, and growth insights.'
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service Types */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">Built for All Cleaning Services</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Commercial Cleaning',
              'Residential Cleaning',
              'Office Cleaning',
              'Post-Construction',
              'Move-In/Move-Out',
              'Deep Cleaning',
              'Carpet Cleaning',
              'Window Cleaning',
            ].map((service, idx) => (
              <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl px-4 py-3 text-center">
                <span className="text-slate-300">{service}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div className="text-left">
                <div className="text-5xl font-black text-white mb-2">
                  $49<span className="text-2xl text-slate-400 font-normal">/month</span>
                </div>
                <p className="text-slate-400">Per user • Cancel anytime</p>
              </div>
              <Link href="/get-started" className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
                <span className="relative z-10">Start Free Trial →</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Streamline Your Cleaning Business?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join cleaning companies already using Cortiware to save time and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started" className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden group" style={{ background: 'var(--vp-gradient)' }}>
              <span className="relative z-10">Get Started Free →</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105">
              Talk to Sales
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

