import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function FeaturesPage() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Automation',
      description: 'Intelligent agents handle scheduling, routing, customer communication, and more—learning from your business patterns.'
    },
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description: 'Comprehensive dashboards track revenue, team performance, customer retention, and growth metrics.'
    },
    {
      icon: '🔐',
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SSO, audit logs, and compliance with SOC 2, GDPR, and industry standards.'
    },
    {
      icon: '🎨',
      title: 'Custom Branding',
      description: 'White-label your customer portal with your logo, colors, and domain for a seamless brand experience.'
    },
    {
      icon: '⚡',
      title: 'Lightning-Fast Performance',
      description: 'Optimized for speed with sub-second load times and real-time data synchronization across all devices.'
    },
    {
      icon: '🔌',
      title: 'API-First Architecture',
      description: 'Powerful REST API for custom integrations, third-party tools, and advanced automation workflows.'
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Fully responsive interface works seamlessly on phones, tablets, and desktops for your team on the go.'
    },
    {
      icon: '🌍',
      title: 'Multi-Tenant Ready',
      description: 'Manage multiple locations, teams, or business units from a single unified platform.'
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
            POWERFUL CAPABILITIES
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Run Your Business</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Cortiware combines industry-specific workflows with AI-powered automation to help you work smarter, not harder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
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
      </main>
    </div>
  );
}

