'use client';

import Link from 'next/link';

export default function HVACPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="fixed inset-0 -z-10 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
              HVAC Industry
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              AI-Powered Software for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">HVAC Businesses</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
              Automate scheduling, dispatch, customer communication, and invoicing. Built specifically for HVAC contractors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#pricing" className="group/btn inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-xl transition-all font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 relative overflow-hidden" style={{ background: 'var(--vp-gradient)' }}>
                <span className="relative z-10">Start Free Trial</span>
                <svg className="relative z-10 w-6 h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </Link>
              <a href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/50 border-2 border-slate-700 hover:border-emerald-500 text-white rounded-xl transition-all font-bold text-lg">
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HVAC-Specific Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">HVAC Contractors</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title: 'Smart Scheduling & Dispatch',
              desc: 'AI automatically schedules service calls, optimizes routes, and dispatches the right technician based on skills and location.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              title: 'Equipment & Maintenance Tracking',
              desc: 'Track equipment history, maintenance schedules, and warranty information. AI reminds customers when service is due.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            },
            {
              title: 'Instant Quotes & Estimates',
              desc: 'Generate professional quotes on-site with pricing for installations, repairs, and maintenance plans.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              title: 'Customer Portal',
              desc: 'Customers can book service, view equipment history, pay invoices, and communicate with your team 24/7.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )
            },
            {
              title: 'Seasonal Campaigns',
              desc: 'AI automatically sends seasonal reminders for AC tune-ups in spring and furnace checks in fall.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              title: 'Mobile-First for Technicians',
              desc: 'Technicians access job details, customer history, and parts inventory from their phone in the field.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )
            }
          ].map((feature, i) => (
            <div key={feature.title} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl text-emerald-400 mb-4 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{feature.desc}</p>
              </div>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ROI Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
              Real Results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">HVAC Companies</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { metric: '40%', label: 'Faster Response Time', desc: 'AI handles inquiries instantly' },
              { metric: '3x', label: 'More Bookings', desc: 'Never miss a lead again' },
              { metric: '60%', label: 'Less Admin Work', desc: 'Automate scheduling & invoicing' },
              { metric: '$50K+', label: 'Revenue Increase', desc: 'Average first-year growth' }
            ].map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                  {stat.metric}
                </div>
                <div className="text-lg font-bold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-slate-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="relative bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-2 border-emerald-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-emerald-500/20 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight">
              Ready to Automate Your HVAC Business?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Join HVAC contractors who are already saving time and growing revenue with Cortiware.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#pricing" className="group/btn inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-xl transition-all font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 relative overflow-hidden" style={{ background: 'var(--vp-gradient)' }}>
                <span className="relative z-10">Start Free Trial</span>
                <svg className="relative z-10 w-6 h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </Link>
              <a href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/50 border-2 border-slate-700 hover:border-emerald-500 text-white rounded-xl transition-all font-bold text-lg">
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

