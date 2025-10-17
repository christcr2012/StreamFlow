export default function IndustriesPage() {
  const verticals = [
    { name: 'Professional Services', blurb: 'Consulting, agencies, and service firms with client projects, billing, and pipelines.' },
    { name: 'Healthcare Services', blurb: 'Clinics and care providers with intake, appointments, and compliance workflows.' },
    { name: 'Legal Services', blurb: 'Matter management, intake, document automation, and client communications.' },
    { name: 'Financial & Accounting', blurb: 'Engagements, recurring services, invoicing, compliance, and reporting.' },
    { name: 'Real Estate Services', blurb: 'Brokerages and property services with leads, showings, and transaction workflows.' },
    { name: 'Marketing & Creative', blurb: 'Campaign pipelines, briefs, approvals, and asset delivery.' },
    { name: 'IT & MSP', blurb: 'Ticketing, SLAs, asset tracking, and customer success automation.' },
    { name: 'Staffing & Recruiting', blurb: 'Candidate pipelines, client reqs, interviews, and placements.' },
    { name: 'Education & Training', blurb: 'Cohorts, enrollments, content, certifications, and support.' },
    { name: 'Field & Home Services', blurb: 'Scheduling, dispatch, mobile work orders, and customer updates.' },
    { name: 'Government Contractors (GovCon)', blurb: 'Lead discovery via SAM.gov, capture, proposals, and delivery tracking.' },
  ];
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-bold text-white mb-4">Industries</h1>
      <p className="text-slate-300 mb-10 max-w-3xl">We focus on service-based clientele. Our Vertical Expansion Packs deliver opinionated data models, workflows, AI agents, and integrations tailored to each industry.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {verticals.map(v => (
          <div key={v.name} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-2">{v.name}</h3>
            <p className="text-slate-400 text-sm">{v.blurb}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-white text-xl font-semibold mb-2">Vertical Expansion Packs (Roadmap)</h2>
        <ul className="list-disc pl-5 text-slate-300 space-y-2">
          <li>Domain models and templates (CRM objects, pipelines, activities)</li>
          <li>Workflow recipes and automations (approvals, SLAs, reminders)</li>
          <li>AI agent packs (intake, support, analysis, content)</li>
          <li>Integrations kit (calendars, billing, communications)</li>
          <li>Dashboards & reports tailored to each vertical</li>
        </ul>
      </div>
      <div className="mt-10">
        <a href="/contact" className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold">Discuss your vertical →</a>
      </div>
    </main>
  );
}

