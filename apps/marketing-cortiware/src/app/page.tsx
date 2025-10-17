export default function CortiwareHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--vp-gradient)' }} />
            <span className="text-xl font-bold text-white">Cortiware</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#industries" className="text-slate-300 hover:text-white transition-colors">Industries</a>
            <a href="#ai-features" className="text-slate-300 hover:text-white transition-colors">AI Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white rounded-lg font-medium shadow-sm" style={{ background: 'var(--vp-gradient)' }}>
              Get Started →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden max-w-7xl mx-auto px-6 py-28">
        <div className="relative text-center max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl p-8 md:p-12 shadow-lg shadow-emerald-500/10">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full blur-3xl opacity-20" style={{ background: 'var(--vp-gradient)' }} />
        </div>

          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold">
              AI-Powered Business Software
            </div>
            <div className="inline-block px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-full text-slate-300 text-xs">
              By Robinson AI Systems, LLC
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            All-in-One Software
            <span className="block text-transparent bg-clip-text" style={{ backgroundImage: 'var(--vp-gradient)', WebkitBackgroundClip: 'text' }}>
              Built for Your Industry
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Industry-specific software powered by AI. From scheduling to invoicing, customer management to automation—
            Cortiware handles it all so you can focus on growing your business.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#industries" className="px-8 py-4 text-white rounded-lg transition-all font-semibold text-lg shadow-lg hover:shadow-emerald-500/30" style={{ background: 'var(--vp-gradient)' }}>
              See Your Industry
            </a>
            <a href="#ai-features" className="px-8 py-4 border-2 border-slate-700 hover:border-emerald-500 text-white rounded-lg transition-colors font-semibold text-lg">
              AI Features
            </a>
          </div>
        </div>
      </section>
      {/* ROI Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          {[{k:'Setup time',v:'< 1 day'},{k:'AI automation',v:'24/7'},{k:'Customer satisfaction',v:'95%+'}].map((m) => (
            <div key={m.k} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: 'var(--vp-gradient)' }}>{m.v}</div>
              <div className="text-slate-400 text-sm">{m.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features - The Main Selling Point */}
      <section id="ai-features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">AI That Works For You</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Industry-specific AI agents that understand your business and automate the heavy lifting
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {icon:'🤖',title:'AI Agents',desc:'Industry-specific AI assistants that handle customer inquiries, schedule appointments, and provide instant quotes—24/7.'},
            {icon:'💬',title:'AI Concierge',desc:'Intelligent customer support that understands your industry. Answers questions, books services, and escalates when needed.'},
            {icon:'⚡',title:'Smart Automation',desc:'AI-powered workflows that automate scheduling, follow-ups, invoicing, and reminders—so you never miss an opportunity.'},
            {icon:'📊',title:'Predictive Analytics',desc:'AI insights that forecast demand, optimize pricing, and identify growth opportunities based on your data.'},
            {icon:'📝',title:'Document Intelligence',desc:'AI that reads and processes contracts, invoices, and forms—extracting data and automating paperwork.'},
            {icon:'🎯',title:'Lead Scoring',desc:'AI that prioritizes your best leads, predicts conversion likelihood, and recommends next actions.'},
          ].map((f) => (
            <div key={f.title} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-400/10 hover:-translate-y-0.5 transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industries Served */}
      <section id="industries" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Built for Your Industry</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Cortiware is tailored to the unique needs of service businesses across multiple industries
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {name:'HVAC',desc:'Scheduling, dispatch, pricing, customer portal',icon:'🔧'},
            {name:'Legal',desc:'Case management, document automation, billing',icon:'⚖️'},
            {name:'Healthcare',desc:'Patient scheduling, records, compliance, billing',icon:'🏥'},
            {name:'Real Estate',desc:'Listings, CRM, showings, transaction management',icon:'🏠'},
            {name:'Plumbing',desc:'Service calls, estimates, invoicing, routing',icon:'🚰'},
            {name:'Roofing',desc:'Inspections, estimates, project tracking, photos',icon:'🏗️'},
            {name:'Landscaping',desc:'Quotes, scheduling, crew management, billing',icon:'🌳'},
            {name:'Cleaning',desc:'Booking, recurring services, quality checks, invoicing',icon:'🧹'},
            {name:'Electrical',desc:'Service requests, safety compliance, estimates',icon:'⚡'},
          ].map((industry) => (
            <div key={industry.name} className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-400/10 hover:-translate-y-1 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all" />
              <div className="text-4xl mb-3">{industry.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{industry.name}</h3>
              <p className="text-slate-300 text-sm">{industry.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-slate-400">
            + Pest Control, Pressure Washing, Snow Removal, Fencing, Concrete, Appliance Rental, Auto Detail, and more
          </p>
        </div>
      </section>


      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get up and running in less than a day
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {step:'1',title:'Sign Up',desc:'Choose Cortiware for your industry. Tell us about your business and what you need.'},
            {step:'2',title:'Customize',desc:'Adjust branding, pricing, and workflows to match your business. Our team helps you get set up.'},
            {step:'3',title:'Go Live',desc:'Your AI-powered system is ready. Accept bookings, manage customers, automate workflows—all in one place.'},
          ].map((s) => (
            <div key={s.step} className="relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ background: 'var(--vp-gradient)' }}>
                {s.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 mt-2">{s.title}</h3>
              <p className="text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Everything You Need to Run Your Business</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {icon:'📋',title:'Customer Management',desc:'Complete CRM with contact history, notes, tags, and communication tracking.'},
            {icon:'💰',title:'Invoicing & Payments',desc:'Generate quotes, send invoices, accept payments, and track revenue—all automated.'},
            {icon:'🤖',title:'AI Automation',desc:'AI agents handle scheduling, follow-ups, customer support, and routine tasks.'},
            {icon:'📊',title:'Analytics & Reporting',desc:'Real-time dashboards showing revenue, customer trends, and business performance.'},
            {icon:'🔐',title:'Customer Portal',desc:'Branded portal where customers can book services, view invoices, and communicate with you.'},
            {icon:'📱',title:'Mobile-Friendly',desc:'Access Cortiware from any device. Your team and customers can work from anywhere.'},
          ].map((f) => (
            <div key={f.title} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-400/10 hover:-translate-y-0.5 transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Comparison: Cortiware vs DIY */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Cortiware vs Building Your Own System</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <table className="min-w-full text-left">
            <thead className="text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Capability</th>
                <th className="px-6 py-4 font-semibold">Cortiware</th>
                <th className="px-6 py-4 font-semibold">DIY Build</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {[
                ['Time to launch','< 1 day','3-6 months'],
                ['Industry-specific features','Built-in','Design from scratch'],
                ['AI agents & automation','Included','Build & train yourself'],
                ['Customer portal','Ready to use','Months of development'],
                ['Mobile app','Included','Separate project'],
                ['Updates & maintenance','Automatic','Your responsibility'],
                ['Support','Dedicated team','You\'re on your own'],
              ].map((row)=> (
                <tr key={row[0]} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{row[0]}</td>
                  <td className="px-6 py-4"><span className="text-emerald-400">{row[1]}</span></td>
                  <td className="px-6 py-4 text-slate-400">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            All-inclusive pricing. No hidden fees, no surprises.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-400/10 hover:-translate-y-0.5 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <div className="text-4xl font-bold text-white mb-6">
              $299<span className="text-lg text-slate-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Up to 500 customers
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> AI agents & automation
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Customer portal
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Custom branding
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Email support
              </li>
            </ul>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="block w-full px-6 py-3 border-2 border-slate-700 hover:border-emerald-500 text-white rounded-lg transition-colors font-semibold text-center">
              Get Started
            </a>
          </div>

          {/* Professional */}
          <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-2 rounded-2xl p-8 relative shadow-xl shadow-emerald-500/10 hover:shadow-emerald-400/20 hover:-translate-y-1 transition-all duration-300 hover:scale-[1.01] ring-1 ring-emerald-500/30 hover:ring-emerald-400/40" style={{ borderColor: 'var(--vp-emerald)' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm font-semibold rounded-full" style={{ background: 'var(--vp-gradient)' }}>
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
            <div className="text-4xl font-bold text-white mb-6">
              $699<span className="text-lg text-slate-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Up to 2,500 customers
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Advanced AI features
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Priority support
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> API access
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Custom integrations
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Multi-user access
              </li>
            </ul>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="block w-full px-6 py-3 text-white rounded-lg transition-all font-semibold text-center shadow-lg hover:shadow-emerald-500/30" style={{ background: 'var(--vp-gradient)' }}>
              Get Started
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-400/10 hover:-translate-y-0.5 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-bold text-white mb-6">
              Custom
            </div>
            <ul className="space-y-3 mb-8">
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Unlimited customers
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> White-label options
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Custom AI training
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Dedicated account manager
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> SLA guarantee
              </li>
              <li className="text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">✓</span> On-premise deployment
              </li>
            </ul>
            <a href="mailto:sales@robinsonaisystems.com" className="block w-full px-6 py-3 border-2 border-slate-700 hover:border-emerald-500 text-white rounded-lg transition-colors font-semibold text-center">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials - Early Access */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">What Our Customers Say</h2>
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center shadow-lg shadow-emerald-500/5">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Be the First to Share Your Experience</h3>
            <p className="text-slate-300 mb-6">
              Cortiware is in early access. Join our growing community of service businesses and help shape the future of AI-powered business software.
            </p>
            <a
              href="#pricing"
              className="inline-block px-8 py-3 rounded-lg font-semibold transition-all"
              style={{ background: 'var(--vp-gradient)' }}
            >
              <span className="text-white">Get Early Access</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[{
            q: 'Can I customize Cortiware for my specific business?',
            a: 'Absolutely! Cortiware is fully customizable. Adjust branding, pricing, workflows, and features to match your exact needs.'
          },{
            q: 'What if my industry isn\'t listed?',
            a: 'We support many industries beyond what\'s shown. Contact us and we\'ll configure Cortiware for your specific business.'
          },{
            q: 'Do I need technical skills to use Cortiware?',
            a: 'No. Cortiware is designed for business owners, not developers. If you can use a web browser, you can run Cortiware.'
          },{
            q: 'How does the AI actually help my business?',
            a: 'AI handles customer inquiries, schedules appointments, sends follow-ups, generates quotes, and automates routine tasks—24/7.'
          }].map((f) => (
            <div key={f.q} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">{f.q}</h3>
              <p className="text-slate-300">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Get Cortiware for your industry and start automating with AI today. No credit card required to get started.
          </p>
          <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="px-8 py-4 text-white rounded-lg transition-all font-semibold text-lg inline-block shadow-lg hover:shadow-emerald-500/30" style={{ background: 'var(--vp-gradient)' }}>
            Get Started →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--vp-gradient)' }} />
                <span className="text-xl font-bold text-white">Cortiware</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered software for service businesses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#industries" className="hover:text-white transition-colors">Industries</a></li>
                <li><a href="#ai-features" className="hover:text-white transition-colors">AI Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="https://robinsonaisystems.com" className="hover:text-white transition-colors">Robinson AI Systems</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-8 text-center text-slate-400 text-sm">
            © 2025 Robinson AI Systems, LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

