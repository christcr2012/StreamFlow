import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      description: 'Perfect for small teams just getting started',
      features: [
        'Up to 3 users',
        'Basic scheduling & dispatch',
        'Customer portal',
        'Mobile app access',
        'Email support',
        'Monthly invoicing',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: 199,
      description: 'For growing businesses with advanced needs',
      features: [
        'Unlimited users',
        'Advanced AI automation',
        'Custom branding',
        'API access',
        'Priority support',
        'Real-time analytics',
        'Custom integrations',
        'SSO & advanced security',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'Custom solutions for large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom SLA',
        'On-premise deployment',
        'Advanced compliance',
        'Custom development',
        'Training & onboarding',
        'Phone support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm font-bold mb-8">
            SIMPLE, TRANSPARENT PRICING
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Plans for Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Business Size</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Start free. Scale as you grow. All plans include a 14-day free trial—no credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div key={idx} className="relative">
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white text-xs font-bold shadow-lg">
                  MOST POPULAR
                </div>
              )}
              <div className={`rounded-2xl transition-all duration-300 h-full ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50 scale-105 shadow-2xl shadow-emerald-500/20'
                  : 'bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-emerald-500/30'
              } p-8 ${plan.highlighted ? 'pt-10' : ''}`}>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">${plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">Custom Pricing</div>
                )}
              </div>

              <button className={`w-full py-3 rounded-xl font-semibold mb-8 transition-all duration-300 hover:scale-105 ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}>
                {plan.cta}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, fidx) => (
                  <div key={fidx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Questions About Pricing?</h2>
          <p className="text-slate-300 mb-6">
            We offer volume discounts, annual billing options, and custom enterprise packages.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105">
            Contact Sales
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}

