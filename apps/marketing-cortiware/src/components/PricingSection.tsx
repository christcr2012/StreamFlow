/**
 * Pricing Section Component (Server Component)
 * 
 * Fetches pricing dynamically from the Provider Portal API
 * Uses ISR (Incremental Static Regeneration) for automatic updates
 */

import { getPricing } from '@/lib/pricing';

export default async function PricingSection() {
  const { plans } = await getPricing();

  return (
    <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
          Flexible Plans
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
          Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Transparent Pricing</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
          All-inclusive pricing. <span className="text-white font-semibold">No hidden fees, no surprises.</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 gap-y-12 max-w-6xl mx-auto overflow-visible mt-8">
        {plans.map((plan, index) => {
          const isHighlighted = plan.highlighted;
          const animationDelay = `${index * 0.1}s`;

          return (
            <div
              key={plan.name}
              className={`group relative ${isHighlighted ? 'pt-4' : 'pt-4'}`}
            >
              {/* Most Popular Badge (only for highlighted plan) */}
              {isHighlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white text-xs sm:text-sm font-bold shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}

              <div
                className={`${
                  isHighlighted
                    ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-500 hover:-translate-y-2 overflow-visible ring-1 ring-emerald-500/30 hover:ring-emerald-400/50 md:scale-105 animate-fade-in-up pt-10'
                    : 'bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up'
                }`}
                style={
                  isHighlighted
                    ? { borderColor: 'var(--vp-emerald)', animationDelay }
                    : { animationDelay }
                }
              >
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 ${
                    isHighlighted
                      ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 opacity-100'
                      : 'bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0'
                  } group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6 sm:mb-8">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                          ${plan.price}
                        </span>
                        <span className="text-lg text-slate-400">/mo</span>
                      </>
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        Custom
                      </span>
                    )}
                  </div>
                  
                  <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-sm sm:text-base text-slate-300 flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.cta === 'Contact Sales' ? (
                    <a
                      href="mailto:sales@robinsonaisystems.com"
                      className="group/btn block w-full px-6 py-3 sm:py-4 border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-white rounded-xl transition-all font-semibold text-center hover:bg-slate-800/50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {plan.cta}
                        <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </a>
                  ) : isHighlighted ? (
                    <a
                      href="https://app.cortiware.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn block w-full px-6 py-3 sm:py-4 text-white rounded-xl transition-all font-semibold text-center shadow-lg hover:shadow-emerald-500/50 relative overflow-hidden"
                      style={{ background: 'var(--vp-gradient)' }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {plan.cta}
                        <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </a>
                  ) : (
                    <a
                      href="https://app.cortiware.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn block w-full px-6 py-3 sm:py-4 border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-white rounded-xl transition-all font-semibold text-center hover:bg-slate-800/50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {plan.cta}
                        <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

