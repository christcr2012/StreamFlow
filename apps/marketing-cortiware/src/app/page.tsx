'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function CortiwareHomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrolled = window.scrollY;
      const parallax = scrolled * 0.5;
      heroRef.current.style.transform = `translateY(${parallax}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-visible pt-20 pb-32">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-40 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        <div ref={heroRef} className="relative max-w-7xl mx-auto px-6 transition-transform duration-100">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-8 backdrop-blur-sm animate-fade-in-down">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI-Powered Business Software
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-none tracking-tight animate-fade-in-up">
              All-in-One Software
              <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Built for Your Industry
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Industry-specific software powered by AI. From scheduling to invoicing, customer management to automation—
              <span className="text-white font-semibold"> Cortiware handles it all</span> so you can focus on growing your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <a href="#industries" className="group px-8 py-4 text-white rounded-xl transition-all font-semibold text-lg shadow-2xl hover:shadow-emerald-500/50 relative overflow-hidden" style={{ background: 'var(--vp-gradient)' }}>
                <span className="relative z-10 flex items-center gap-2">
                  See Your Industry
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </a>
              <a href="#ai-features" className="group px-8 py-4 border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-white rounded-xl transition-all font-semibold text-lg hover:bg-slate-800/50">
                <span className="flex items-center gap-2">
                  Explore AI Features
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                </span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Setup in &lt; 1 day</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>95%+ satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ROI Stats - Premium Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {k:'Setup time',v:'< 1 day', icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )},
            {k:'AI automation',v:'24/7', icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )},
            {k:'Customer satisfaction',v:'95%+', icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          ].map((m, i) => (
            <div key={m.k} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {m.icon}
                </div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                  {m.v}
                </div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{m.k}</div>
              </div>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* AI Features - The Main Selling Point */}
      <section id="ai-features" className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Powered by Advanced AI
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            AI That Works <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">For You</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Industry-specific AI agents that understand your business and automate the heavy lifting—
            <span className="text-white font-semibold"> so you can focus on what matters</span>
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title:'AI Agents',
              desc:'Industry-specific AI assistants that handle customer inquiries, schedule appointments, and provide instant quotes—24/7.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              gradient: 'from-emerald-500/20 to-teal-500/20'
            },
            {
              title:'AI Concierge',
              desc:'Intelligent customer support that understands your industry. Answers questions, books services, and escalates when needed.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              ),
              gradient: 'from-teal-500/20 to-cyan-500/20'
            },
            {
              title:'Smart Automation',
              desc:'AI-powered workflows that automate scheduling, follow-ups, invoicing, and reminders—so you never miss an opportunity.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              gradient: 'from-cyan-500/20 to-emerald-500/20'
            },
            {
              title:'Predictive Analytics',
              desc:'AI insights that forecast demand, optimize pricing, and identify growth opportunities based on your data.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              gradient: 'from-emerald-500/20 to-green-500/20'
            },
            {
              title:'Document Intelligence',
              desc:'AI that reads and processes contracts, invoices, and forms—extracting data and automating paperwork.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              gradient: 'from-teal-500/20 to-emerald-500/20'
            },
            {
              title:'Lead Scoring',
              desc:'AI that prioritizes your best leads, predicts conversion likelihood, and recommends next actions.',
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
              gradient: 'from-cyan-500/20 to-teal-500/20'
            },
          ].map((f, i) => (
            <div key={f.title} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Icon */}
              <div className="relative z-10 mb-6">
                <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {f.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors duration-300">{f.title}</h3>
                <p className="text-slate-300 leading-relaxed">{f.desc}</p>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Industries Served */}
      <section id="industries" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Industry-Specific Solutions
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Your Industry</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
            Cortiware is tailored to the unique needs of service businesses across multiple industries—
            <span className="text-white font-semibold"> with AI that understands your specific workflows</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              name:'Cleaning',
              desc:'Booking, recurring services, quality checks, invoicing',
              badge: 'EARLY ACCESS',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )
            },
            {
              name:'HVAC',
              desc:'Scheduling, dispatch, pricing, customer portal',
              badge: 'ROADMAP',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            },
            {
              name:'Plumbing',
              desc:'Service calls, estimates, invoicing, routing',
              badge: 'ROADMAP',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )
            },
            {
              name:'Roofing',
              desc:'Inspections, estimates, project tracking, photos',
              badge: 'ROADMAP',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )
            },
            {
              name:'Landscaping',
              desc:'Quotes, scheduling, crew management, billing',
              badge: 'ROADMAP',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              name:'Electrical',
              desc:'Service requests, safety compliance, estimates',
              badge: 'ROADMAP',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            },
          ].map((industry, i) => (
            <div key={industry.name} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Badge */}
              {industry.badge && (
                <div className="absolute top-4 right-4 z-20">
                  <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    industry.badge === 'EARLY ACCESS'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-700/50 border border-slate-600/30 text-slate-400'
                  }`}>
                    {industry.badge}
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl sm:rounded-2xl text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {industry.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors duration-300">{industry.name}</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{industry.desc}</p>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
        <div className="text-center mt-8 sm:mt-12 lg:mt-16 px-4">
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            <span className="text-emerald-400 font-semibold">+</span> Pest Control, Pressure Washing, Snow Removal, Fencing, Concrete, Appliance Rental, Auto Detail, and more
          </p>
        </div>
      </section>


      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Simple Setup Process
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Works</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
            Get up and running in <span className="text-white font-semibold">less than a day</span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500/40 to-emerald-500/20 -translate-y-1/2" style={{ top: '80px' }} />

          {[
            {
              step:'1',
              title:'Sign Up',
              desc:'Choose Cortiware for your industry. Tell us about your business and what you need.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )
            },
            {
              step:'2',
              title:'Customize',
              desc:'Adjust branding, pricing, and workflows to match your business. Our team helps you get set up.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              )
            },
            {
              step:'3',
              title:'Go Live',
              desc:'Your AI-powered system is ready. Accept bookings, manage customers, automate workflows—all in one place.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )
            },
          ].map((s, i) => (
            <div key={s.step} className="relative animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden group">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Step number badge */}
                <div className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-2xl shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300" style={{ background: 'var(--vp-gradient)' }}>
                  {s.step}
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-4 sm:mb-6 mt-4 sm:mt-6">
                  <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl sm:rounded-2xl text-emerald-400 group-hover:scale-110 transition-all duration-300">
                    {s.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-emerald-400 transition-colors duration-300">{s.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{s.desc}</p>
                </div>

                {/* Decorative corner */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Complete Platform
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Run Your Business</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title:'Customer Management',
              desc:'Complete CRM with contact history, notes, tags, and communication tracking.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            },
            {
              title:'Invoicing & Payments',
              desc:'Generate quotes, send invoices, accept payments, and track revenue—all automated.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            },
            {
              title:'AI Automation',
              desc:'AI agents handle scheduling, follow-ups, customer support, and routine tasks.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )
            },
            {
              title:'Analytics & Reporting',
              desc:'Real-time dashboards showing revenue, customer trends, and business performance.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            {
              title:'Customer Portal',
              desc:'Branded portal where customers can book services, view invoices, and communicate with you.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              )
            },
            {
              title:'Mobile-Friendly',
              desc:'Access Cortiware from any device. Your team and customers can work from anywhere.',
              icon: (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )
            },
          ].map((f, i) => (
            <div key={f.title} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl sm:rounded-2xl text-emerald-400 group-hover:scale-110 transition-all duration-300">
                  {f.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-emerald-400 transition-colors duration-300">{f.title}</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{f.desc}</p>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>


      {/* Comparison: Cortiware vs DIY */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Why Choose Cortiware
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            Cortiware vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Building Your Own</span>
          </h2>
        </div>
        <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl shadow-2xl">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-300 text-sm sm:text-base">Capability</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-emerald-400 text-sm sm:text-base">Cortiware</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-400 text-sm sm:text-base">DIY Build</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {[
                {
                  cap: 'Time to launch',
                  cortiware: '< 1 day',
                  diy: '3-6 months',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  cap: 'Industry-specific features',
                  cortiware: 'Built-in',
                  diy: 'Design from scratch',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  cap: 'AI agents & automation',
                  cortiware: 'Included',
                  diy: 'Build & train yourself',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                  )
                },
                {
                  cap: 'Customer portal',
                  cortiware: 'Ready to use',
                  diy: 'Months of development',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  cap: 'Mobile app',
                  cortiware: 'Included',
                  diy: 'Separate project',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  cap: 'Updates & maintenance',
                  cortiware: 'Automatic',
                  diy: 'Your responsibility',
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  cap: 'Support',
                  cortiware: 'Dedicated team',
                  diy: "You're on your own",
                  icon: (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  )
                },
              ].map((row, i) => (
                <tr key={row.cap} className="group hover:bg-slate-800/40 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="hidden sm:block">{row.icon}</div>
                      <span className="text-slate-300 text-sm sm:text-base font-medium">{row.cap}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">{row.cortiware}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className="text-slate-400 text-sm sm:text-base">{row.diy}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
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
          {/* Starter */}
          <div className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up pt-4">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Starter</h3>
              <div className="flex items-baseline gap-2 mb-6 sm:mb-8">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">$49</span>
                <span className="text-lg text-slate-400">/mo</span>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                {[
                  'Up to 3 users',
                  'Basic scheduling & dispatch',
                  'Customer portal',
                  'Mobile app access',
                  'Email support',
                  'Monthly invoicing'
                ].map((feature) => (
                  <li key={feature} className="text-sm sm:text-base text-slate-300 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="group/btn block w-full px-6 py-3 sm:py-4 border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-white rounded-xl transition-all font-semibold text-center hover:bg-slate-800/50">
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
            </div>
          </div>

          {/* Professional - Featured */}
          <div className="group relative pt-4">
            {/* Most Popular Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg z-20 whitespace-nowrap" style={{ background: 'var(--vp-gradient)' }}>
              MOST POPULAR
            </div>

            <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-500 hover:-translate-y-2 overflow-visible ring-1 ring-emerald-500/30 hover:ring-emerald-400/50 md:scale-105 animate-fade-in-up pt-10" style={{ borderColor: 'var(--vp-emerald)', animationDelay: '0.1s' }}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 opacity-100 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Professional</h3>
                <div className="flex items-baseline gap-2 mb-6 sm:mb-8">
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">$199</span>
                  <span className="text-lg text-slate-400">/mo</span>
                </div>
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  {[
                    'Unlimited users',
                    'Advanced AI automation',
                    'Custom branding',
                    'API access',
                    'Priority support',
                    'Real-time analytics',
                    'Custom integrations',
                    'SSO & advanced security'
                  ].map((feature) => (
                  <li key={feature} className="text-sm sm:text-base text-slate-300 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="group/btn block w-full px-6 py-3 sm:py-4 text-white rounded-xl transition-all font-semibold text-center shadow-lg hover:shadow-emerald-500/50 relative overflow-hidden" style={{ background: 'var(--vp-gradient)' }}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </a>
            </div>
            </div>
          </div>

          {/* Enterprise */}
          <div className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up pt-4" style={{ animationDelay: '0.2s' }}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-2 mb-6 sm:mb-8">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Custom</span>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                {[
                  'Everything in Professional',
                  'Dedicated account manager',
                  'Custom SLA',
                  'On-premise deployment',
                  'Advanced compliance',
                  'Custom development',
                  'Training & onboarding',
                  'Phone support'
                ].map((feature) => (
                  <li key={feature} className="text-sm sm:text-base text-slate-300 flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:sales@robinsonaisystems.com" className="group/btn block w-full px-6 py-3 sm:py-4 border-2 border-slate-700 hover:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-white rounded-xl transition-all font-semibold text-center hover:bg-slate-800/50">
                <span className="flex items-center justify-center gap-2">
                  Contact Sales
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Early Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Join Early Access
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Customers Say</span>
          </h2>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 sm:mb-6">Be the First to Share Your Experience</h3>
              <p className="text-base sm:text-lg text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                Cortiware is in <span className="text-emerald-400 font-semibold">early access</span>. Join our growing community of service businesses and help shape the future of AI-powered business software.
              </p>
              <a
                href="#pricing"
                className="group/btn inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-white rounded-xl transition-all font-semibold text-base sm:text-lg shadow-lg hover:shadow-emerald-500/50 relative overflow-hidden"
                style={{ background: 'var(--vp-gradient)' }}
              >
                <span className="relative z-10">Get Early Access</span>
                <svg className="relative z-10 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </a>
            </div>

            {/* Decorative corners */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Questions</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {[{
            q: 'Can I customize Cortiware for my specific business?',
            a: 'Absolutely! Cortiware is fully customizable. Adjust branding, pricing, workflows, and features to match your exact needs.',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            )
          },{
            q: 'What if my industry isn\'t listed?',
            a: 'We support many industries beyond what\'s shown. Contact us and we\'ll configure Cortiware for your specific business.',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },{
            q: 'Do I need technical skills to use Cortiware?',
            a: 'No. Cortiware is designed for business owners, not developers. If you can use a web browser, you can run Cortiware.',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },{
            q: 'How does the AI actually help my business?',
            a: 'AI handles customer inquiries, schedules appointments, sends follow-ups, generates quotes, and automates routine tasks—24/7.',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          }].map((f, i) => (
            <div key={f.q} className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="relative z-10 mb-4">
                <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-all duration-300">
                  {f.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">{f.q}</h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{f.a}</p>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-emerald-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="relative bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-2 border-emerald-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-emerald-500/20 overflow-hidden group">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 opacity-100 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Floating orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Transform</span> Your Business?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              Get Cortiware for your industry and start automating with AI today. <span className="text-white font-semibold">No credit card required</span> to get started.
            </p>
            <a href="https://app.cortiware.com" target="_blank" rel="noopener noreferrer" className="group/btn inline-flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-5 text-white rounded-xl transition-all font-bold text-base sm:text-lg shadow-2xl hover:shadow-emerald-500/50 relative overflow-hidden" style={{ background: 'var(--vp-gradient)' }}>
              <span className="relative z-10">Get Started</span>
              <svg className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

