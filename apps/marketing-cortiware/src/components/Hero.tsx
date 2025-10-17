interface HeroProps {
  badge?: string;
  title: string;
  highlight: string;
  description: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
}

export function Hero({ badge, title, highlight, description, primaryCTA, secondaryCTA }: HeroProps) {
  return (
    <section className="relative overflow-visible pt-20 pb-32">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-40 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-8 backdrop-blur-sm">
              {badge}
            </div>
          )}
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-none tracking-tight">
            {title}
            <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500">
              {highlight}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={primaryCTA.href}
              className="px-8 py-4 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105"
              style={{ background: 'var(--vp-gradient)' }}
            >
              {primaryCTA.text}
            </a>
            {secondaryCTA && (
              <a
                href={secondaryCTA.href}
                className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold text-lg border border-slate-700 hover:border-emerald-500/50 transition-all hover:scale-105"
              >
                {secondaryCTA.text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

