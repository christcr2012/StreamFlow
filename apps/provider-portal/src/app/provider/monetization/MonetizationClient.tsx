'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

import { ScopeSelector, Scope } from '@/components/clarity/ScopeSelector';
import { ScopeBadge } from '@/components/clarity/ScopeBadge';
import { ImpactSummary, Impact } from '@/components/clarity/ImpactSummary';
import { HelpDrawer } from '@/components/clarity/HelpDrawer';
import { ConfirmDialog } from '@/components/clarity/ConfirmDialog';


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <div className="mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {children}
    </label>
  );
}

export default function MonetizationClient() {
  const [plans, setPlans] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [cfg, setCfg] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState({ key: '', name: '', description: '' });
  const [priceForm, setPriceForm] = useState({ planId: '', unitAmountCents: 0, cadence: 'MONTHLY' });
  const [inviteForm, setInviteForm] = useState({ email: '', planId: '', priceId: '', trialDays: 14, expiresInMinutes: 60 });

  // Extended controls
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  // Clarity framework state
  const [scope, setScope] = useState<Scope>({ type: 'provider' });
  const [impact, setImpact] = useState<Impact | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  const previewImpact = useCallback(async () => {
    setError(null);
    setPreviewBusy(true);
    try {
      const res = await fetch('/api/provider/monetization/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to preview impact');
      setImpact(j?.impact || null);
    } catch (e: any) {
      setImpact(null);
      setError(String(e?.message || e));
    } finally {
      setPreviewBusy(false);
    }
  }, [scope]);

  const [overrides, setOverrides] = useState<any[]>([]);

  const [couponForm, setCouponForm] = useState({ code: '', percentOff: 0, amountOffCents: 0, duration: 'once' });
  const [offerForm, setOfferForm] = useState({ key: '', name: '', description: '', active: true });
  const [overrideForm, setOverrideForm] = useState({ orgId: '', planId: '', priceId: '', type: 'percent', percentOff: 0, amountOffCents: 0, priceCents: 0, reason: '' });
  const [orgSuggestions, setOrgSuggestions] = useState<any[]>([]);

  // Listing filters/pagination
  const [couponFilter, setCouponFilter] = useState<{ code: string; active: string }>({ code: '', active: '' });
  const [couponPage, setCouponPage] = useState(0);
  const [couponLimit, setCouponLimit] = useState(10);
  const [offerFilter, setOfferFilter] = useState<{ active: string }>({ active: '' });
  const [offerPage, setOfferPage] = useState(0);
  const [offerLimit, setOfferLimit] = useState(10);

  const [couponPageMeta, setCouponPageMeta] = useState<{ total: number; limit: number; offset: number }|null>(null);
  const [offerPageMeta, setOfferPageMeta] = useState<{ total: number; limit: number; offset: number }|null>(null);

  // CODE QUALITY: Fixed useEffect dependency - wrapped loadAll in useCallback
  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const couponQS = new URLSearchParams();
      if (couponFilter.code) couponQS.set('code', couponFilter.code);
      if (couponFilter.active) couponQS.set('active', couponFilter.active);
      couponQS.set('limit', String(couponLimit));
      couponQS.set('offset', String(couponPage * couponLimit));
      const offerQS = new URLSearchParams();
      if (offerFilter.active) offerQS.set('active', offerFilter.active);
      offerQS.set('limit', String(offerLimit));
      offerQS.set('offset', String(offerPage * offerLimit));
      const [pl, pr, gc, cp, of, ov] = await Promise.all([
        fetch('/api/provider/monetization/plans').then(r=>r.json()),
        fetch('/api/provider/monetization/prices').then(r=>r.json()),
        fetch('/api/provider/monetization/global-config').then(r=>r.json()),
        fetch(`/api/provider/monetization/coupons?${couponQS.toString()}`).then(r=>r.json()),
        fetch(`/api/provider/monetization/offers?${offerQS.toString()}`).then(r=>r.json()),
        fetch('/api/provider/monetization/overrides').then(r=>r.json()),
      ]);
      setPlans(pl?.items || []);
      setPrices(pr?.items || []);
      setCfg(gc?.item || null);
      setCoupons(cp?.items || []);
      setCouponPageMeta(cp?.page || null);
      setOffers(of?.items || []);
      setOfferPageMeta(of?.page || null);
      setOverrides(ov?.items || []);
    } catch (e:any) {
      setError(String(e?.message||e));
    }
  }, [couponFilter, couponLimit, couponPage, offerFilter, offerLimit, offerPage]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/fed/providers/tenants?limit=10');
        if (res.ok) {
          const j = await res.json();
          setOrgSuggestions(j?.items || []);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const planOptions = useMemo(() => plans.map((p:any)=>({ id:p.id, name:p.name })), [plans]);
  const priceOptions = useMemo(() => prices.map((p:any)=>({ id:p.id, label:`${p.cadence.toLowerCase()} • $${(p.unitAmountCents/100).toFixed(2)}` })), [prices]);

  async function createPlan() {
    setError(null);
    try {
      const res = await fetch('/api/provider/monetization/plans', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ ...planForm }) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setPlanForm({ key:'', name:'', description:'' });
      await loadAll();
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  async function createPrice() {
    setError(null);
    try {
      const res = await fetch('/api/provider/monetization/prices', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ ...priceForm, unitAmountCents: Number(priceForm.unitAmountCents) }) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setPriceForm({ planId:'', unitAmountCents:0, cadence:'MONTHLY' });
      await loadAll();
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  async function createInvite() {
    setError(null);
    try {
      const res = await fetch('/api/provider/monetization/invites', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ ...inviteForm }) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      const base = process.env.NEXT_PUBLIC_BASE_URL || '';
      const url = `${base}/onboarding?t=${encodeURIComponent(j?.item?.token)}`;
      await navigator.clipboard.writeText(url);
      alert('Invite created. Link copied to clipboard.');
      setInviteForm({ email:'', planId:'', priceId:'', trialDays:14, expiresInMinutes:60 });
      await loadAll();
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  async function updateGlobal(partial: any) {
    setError(null);
    try {
      const res = await fetch('/api/provider/monetization/global-config', { method: 'PATCH', headers: { 'content-type':'application/json' }, body: JSON.stringify(partial) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setCfg(j.item);
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  // Extended handlers
  async function createCoupon() {
    setError(null);
    try {
      const body:any = { code: couponForm.code, duration: couponForm.duration };
      if (couponForm.percentOff) body.percentOff = Number(couponForm.percentOff);
      if (couponForm.amountOffCents) body.amountOffCents = Number(couponForm.amountOffCents);
      const res = await fetch('/api/provider/monetization/coupons', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setCouponForm({ code:'', percentOff:0, amountOffCents:0, duration:'once' });
      await loadAll();
    } catch(e:any) { setError(String(e?.message||e)); }
  }

  async function createOffer() {
    setError(null);
    try {
      const res = await fetch('/api/provider/monetization/offers', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(offerForm) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setOfferForm({ key:'', name:'', description:'', active:true });
      await loadAll();
    } catch(e:any) { setError(String(e?.message||e)); }
  }

  async function createOverride() {
    setError(null);
    try {
      const { orgId, planId, priceId, type, percentOff, amountOffCents, priceCents, reason } = overrideForm as any;
      const body:any = { orgId, planId: planId||undefined, priceId: priceId||undefined, type, reason };
      if (type==='percent') body.percentOff = Number(percentOff||0);
      if (type==='amount') body.amountOffCents = Number(amountOffCents||0);
      if (type==='fixed') body.priceCents = Number(priceCents||0);
      const res = await fetch('/api/provider/monetization/overrides', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      setOverrideForm({ orgId:'', planId:'', priceId:'', type:'percent', percentOff:0, amountOffCents:0, priceCents:0, reason:'' });
      await loadAll();
    } catch(e:any) { setError(String(e?.message||e)); }
  }

      {/* Scope & Impact */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="font-semibold" style={{ color:'var(--text-primary)' }}>Scope & Impact</div>
            <ScopeBadge level={scope.type as any} />
          </div>
          <HelpDrawer title="What does scope mean?">
            <p className="mb-2">Scope defines where your change applies:</p>
            <ul className="list-disc pl-5">
              <li><b>Provider</b>: global defaults for all tenants (unless overridden)</li>
              <li><b>Plan</b>: tenants assigned to the selected plan (overrides remain unchanged)</li>
              <li><b>Tenant</b>: a single tenant/org only</li>
            </ul>
          </HelpDrawer>
        </div>
        <ScopeSelector
          value={scope}
          onChange={(s)=>{ setScope(s); setImpact(null); }}
          planOptions={planOptions}
          orgOptions={orgSuggestions.map((o:any)=>({ id: o.id||o.orgId, name: o.name||o.orgName||o.id }))}
        />
        <div className="flex items-center gap-2 mt-3">
          <button onClick={previewImpact} disabled={previewBusy} className="px-3 py-2 rounded border" style={{ borderColor:'var(--border-accent)' }}>{previewBusy? 'Computing…' : 'Preview Impact'}</button>
        </div>
        <div className="mt-3">
          <ImpactSummary impact={impact} />
        </div>
      </div>


  async function deleteOverride(id:string) {
    setError(null);
    try {
      const res = await fetch(`/api/provider/monetization/overrides?id=${encodeURIComponent(id)}`, { method:'DELETE' });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error||'Failed');
      await loadAll();
    } catch(e:any) { setError(String(e?.message||e)); }
  }


  async function deleteCoupon(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/provider/monetization/coupons?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Failed');
      await loadAll();
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  async function deleteOffer(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/provider/monetization/offers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Failed');
      await loadAll();
    } catch (e:any) { setError(String(e?.message||e)); }
  }

  return (
    <div className="space-y-8">
      {error ? <div className="text-red-400 text-sm">{error}</div> : null}

      {/* Quick Create Plan */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Create Plan</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Key"><input value={planForm.key} onChange={e=>setPlanForm(v=>({...v,key:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Name"><input value={planForm.name} onChange={e=>setPlanForm(v=>({...v,name:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Description"><input value={planForm.description} onChange={e=>setPlanForm(v=>({...v,description:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
        </div>
        <div className="flex justify-end mt-3"><button onClick={createPlan} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Plan</button></div>
      </div>

      {/* Quick Create Price */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Create Price</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Plan">
            <select value={priceForm.planId} onChange={e=>setPriceForm(v=>({...v,planId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>

              <option value="">Select plan</option>
              {planOptions.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="Cadence">
            <select value={priceForm.cadence} onChange={e=>setPriceForm(v=>({...v,cadence:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option>MONTHLY</option>
              <option>YEARLY</option>
            </select>
          </Field>
          <Field label="Amount (cents)"><input type="number" value={priceForm.unitAmountCents} onChange={e=>setPriceForm(v=>({...v,unitAmountCents:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
        </div>
        <div className="flex justify-end mt-3"><button onClick={createPrice} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Price</button></div>
      </div>

      {/* Generate Invite */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Generate Onboarding Invite</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Email"><input value={inviteForm.email} onChange={e=>setInviteForm(v=>({...v,email:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Plan">
            <select value={inviteForm.planId} onChange={e=>setInviteForm(v=>({...v,planId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">Select plan</option>
              {planOptions.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="Price">
            <select value={inviteForm.priceId} onChange={e=>setInviteForm(v=>({...v,priceId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">Select price</option>
              {priceOptions.map(p=>(<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <Field label="Trial Days"><input type="number" value={inviteForm.trialDays} onChange={e=>setInviteForm(v=>({...v,trialDays:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Expires In (minutes)"><input type="number" value={inviteForm.expiresInMinutes} onChange={e=>setInviteForm(v=>({...v,expiresInMinutes:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
        </div>
        <div className="flex justify-end mt-3"><button onClick={createInvite} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Invite</button></div>
      </div>

      {/* Global Config */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Global Defaults</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Default Plan">
            <select value={cfg?.defaultPlanId || ''} onChange={e=>updateGlobal({ defaultPlanId: e.target.value||null })} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              {planOptions.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="Default Price">
            <select value={cfg?.defaultPriceId || ''} onChange={e=>updateGlobal({ defaultPriceId: e.target.value||null })} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              {priceOptions.map(p=>(<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <Field label="Public Onboarding">
            <select value={String(cfg?.publicOnboarding ?? true)} onChange={e=>updateGlobal({ publicOnboarding: e.target.value === 'true' })} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>
        </div>
      </div>
      {/* Coupons */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Coupons</div>
        {/* Create */}
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Code"><input value={couponForm.code} onChange={e=>setCouponForm(v=>({...v,code:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Percent Off"><input type="number" value={couponForm.percentOff} onChange={e=>setCouponForm(v=>({...v,percentOff:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Amount Off (cents)"><input type="number" value={couponForm.amountOffCents} onChange={e=>setCouponForm(v=>({...v,amountOffCents:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Duration">
            <select value={couponForm.duration} onChange={e=>setCouponForm(v=>({...v,duration:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="once">once</option>
              <option value="repeating">repeating</option>
              <option value="forever">forever</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end mt-3"><button onClick={createCoupon} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Coupon</button></div>

        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-4 mt-6">
          <Field label="Filter Code"><input value={couponFilter.code} onChange={e=>setCouponFilter(v=>({...v,code:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Active">
            <select value={couponFilter.active} onChange={e=>setCouponFilter(v=>({...v,active:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </Field>
          <Field label="Page Size">
            <select value={String(couponLimit)} onChange={e=>{ setCouponLimit(Number(e.target.value)); setCouponPage(0); }} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </Field>
          <div className="flex items-end"><button onClick={()=>{ setCouponPage(0); loadAll(); }} className="px-3 py-2 rounded border" style={{ borderColor:'var(--border-accent)' }}>Apply</button></div>
        </div>

        {/* List */}
        <div className="mt-3 space-y-2">
          {coupons.map((c:any)=> (
            <div key={c.id} className="flex items-center justify-between text-sm" style={{ color:'var(--text-secondary)' }}>
              <div>#{c.id} · code {c.code} · {c.active ? 'active' : 'inactive'}</div>
              <button onClick={()=>deleteCoupon(c.id)} className="px-2 py-1 rounded" style={{ background:'transparent', border:'1px solid var(--border-accent)', color:'var(--text-tertiary)' }}>Delete</button>
            </div>
          ))}
          {(!coupons || coupons.length===0) && (<div className="text-xs" style={{ color:'var(--text-tertiary)' }}>No coupons</div>)}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={()=>{ if (couponPage>0) { setCouponPage(couponPage-1); loadAll(); } }} className="px-2 py-1 rounded border" style={{ borderColor:'var(--border-accent)' }}>Prev</button>
          <button onClick={()=>{ const max = couponPageMeta ? Math.ceil(couponPageMeta.total / couponLimit) - 1 : couponPage+1; if (couponPage < max) { setCouponPage(couponPage+1); loadAll(); } }} className="px-2 py-1 rounded border" style={{ borderColor:'var(--border-accent)' }}>Next</button>
          <div className="text-xs" style={{ color:'var(--text-tertiary)' }}>
            {couponPageMeta ? `Total ${couponPageMeta.total}, Page ${couponPage+1}` : ''}
          </div>
        </div>
      </div>

      {/* Offers */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Offers</div>
        {/* Create */}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Key"><input value={offerForm.key} onChange={e=>setOfferForm(v=>({...v,key:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Name"><input value={offerForm.name} onChange={e=>setOfferForm(v=>({...v,name:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <Field label="Active">
            <select value={String(offerForm.active)} onChange={e=>setOfferForm(v=>({...v,active:e.target.value==='true'}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><input value={offerForm.description} onChange={e=>setOfferForm(v=>({...v,description:e.target.value}))} className="w-full px-3 py-2 rounded border mt-2" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
        <div className="flex justify-end mt-3"><button onClick={createOffer} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Offer</button></div>

        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-3 mt-6">
          <Field label="Active">
            <select value={offerFilter.active} onChange={e=>setOfferFilter({ active: e.target.value })} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </Field>
          <Field label="Page Size">
            <select value={String(offerLimit)} onChange={e=>{ setOfferLimit(Number(e.target.value)); setOfferPage(0); }} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </Field>
          <div className="flex items-end"><button onClick={()=>{ setOfferPage(0); loadAll(); }} className="px-3 py-2 rounded border" style={{ borderColor:'var(--border-accent)' }}>Apply</button></div>
        </div>

        {/* List */}
        <div className="mt-3 space-y-2">
          {offers.map((o:any)=> (
            <div key={o.id} className="flex items-center justify-between text-sm" style={{ color:'var(--text-secondary)' }}>
              <div>#{o.id} · {o.name||o.key} · {o.active ? 'active' : 'inactive'}</div>
              <button onClick={()=>deleteOffer(o.id)} className="px-2 py-1 rounded" style={{ background:'transparent', border:'1px solid var(--border-accent)', color:'var(--text-tertiary)' }}>Delete</button>
            </div>
          ))}
          {(!offers || offers.length===0) && (<div className="text-xs" style={{ color:'var(--text-tertiary)' }}>No offers</div>)}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={()=>{ if (offerPage>0) { setOfferPage(offerPage-1); loadAll(); } }} className="px-2 py-1 rounded border" style={{ borderColor:'var(--border-accent)' }}>Prev</button>
          <button onClick={()=>{ const max = offerPageMeta ? Math.ceil(offerPageMeta.total / offerLimit) - 1 : offerPage+1; if (offerPage < max) { setOfferPage(offerPage+1); loadAll(); } }} className="px-2 py-1 rounded border" style={{ borderColor:'var(--border-accent)' }}>Next</button>
          <div className="text-xs" style={{ color:'var(--text-tertiary)' }}>
            {offerPageMeta ? `Total ${offerPageMeta.total}, Page ${offerPage+1}` : ''}
          </div>
        </div>
      </div>

      {/* Tenant Overrides */}
      <div className="rounded-xl p-4" style={{ background:'var(--glass-bg)', border:'1px solid var(--border-accent)' }}>
        <div className="font-semibold mb-3" style={{ color:'var(--text-primary)' }}>Tenant Price Overrides</div>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Org ID"><input list="org-list" value={overrideForm.orgId} onChange={e=>setOverrideForm(v=>({...v,orgId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          <datalist id="org-list">
            {orgSuggestions.map((o:any)=>(<option key={o.id||o.orgId} value={o.id||o.orgId}>{o.name||o.orgName||o.id}</option>))}
          </datalist>
          <Field label="Plan">
            <select value={overrideForm.planId} onChange={e=>setOverrideForm(v=>({...v,planId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              {planOptions.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="Price">
            <select value={overrideForm.priceId} onChange={e=>setOverrideForm(v=>({...v,priceId:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="">—</option>
              {priceOptions.map(p=>(<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <Field label="Type">
            <select value={overrideForm.type} onChange={e=>setOverrideForm(v=>({...v,type:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
              <option value="percent">percent</option>
              <option value="amount">amount</option>
              <option value="fixed">fixed</option>
            </select>
          </Field>
          {overrideForm.type==='percent' && (
            <Field label="Percent Off"><input type="number" value={overrideForm.percentOff} onChange={e=>setOverrideForm(v=>({...v,percentOff:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          )}
          {overrideForm.type==='amount' && (
            <Field label="Amount Off (cents)"><input type="number" value={overrideForm.amountOffCents} onChange={e=>setOverrideForm(v=>({...v,amountOffCents:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          )}
          {overrideForm.type==='fixed' && (
            <Field label="Fixed Price (cents)"><input type="number" value={overrideForm.priceCents} onChange={e=>setOverrideForm(v=>({...v,priceCents:Number(e.target.value||0)}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
          )}
          <Field label="Reason"><input value={overrideForm.reason} onChange={e=>setOverrideForm(v=>({...v,reason:e.target.value}))} className="w-full px-3 py-2 rounded border" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }} /></Field>
        </div>
        <div className="flex justify-end mt-3"><button onClick={createOverride} className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }}>Create Override</button></div>
        <div className="mt-3 text-xs" style={{ color:'var(--text-tertiary)' }}>Recent: {overrides.slice(0,5).map((o:any)=>o.id).join(', ')||'—'}</div>
        {overrides.slice(0,5).map((o:any)=> (
          <div key={o.id} className="flex items-center justify-between text-xs mt-1" style={{ color:'var(--text-secondary)' }}>
            <div>#{o.id} · org {o.orgId} · {o.type}</div>
            <button onClick={()=>deleteOverride(o.id)} className="px-2 py-1 rounded" style={{ background:'transparent', border:'1px solid var(--border-accent)', color:'var(--text-tertiary)' }}>Delete</button>
          </div>
        ))}
      </div>

    </div>
  );
}

