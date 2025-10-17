# Business Websites Specification (Cortiware + Robinson)

Scope: Finalized design/implementation spec for the two marketing sites. Independent from provider/tenant UI systems.

Apps
- Cortiware product site: apps/marketing-cortiware
- Robinson company site: apps/marketing-robinson

Goals
- Premium, accessible, performant sites with clear IA
- Industry norms for communications and email addresses (see docs/EMAIL_ALIASES.md)
- Strict separation from provider/tenant themes; each site has its own design system

---

## 1. Mobile Hamburger Navigation (Both Sites)

Behavior
- Breakpoint: show hamburger < lg; full inline nav on lg+
- Toggle: button with aria-expanded + aria-controls; SR-visible label "Menu"
- Panel: slide-in overlay/drawer with subtle blur/glass; backdrop click closes
- Focus: trap within open panel; ESC closes; return focus to toggle on close
- Scroll lock: disable body scroll when open
- Route change: automatically close panel
- Active page: highlight current route
- CTA: prominent final link (Cortiware → Get Started; Robinson → Contact)
- Sticky: header sticks with subtle elevation on scroll

Accessibility
- Button has accessible name; icons are aria-hidden
- Panel uses role="dialog" or nav landmark; labelled by panel heading
- Keyboard support: Tab/Shift+Tab cycle, ESC closes, focus ring visible
- Contrast: AA+; target touch area ≥ 44px

Components
- Navigation.tsx (client): state+aria, scroll lock, close on route change
- NavLinks.tsx: pure route list; accepts className
- MobilePanel.tsx: overlay/drawer; props { open, onClose }
- CTAButton.tsx: brand-specific CTA styles

Animation Tokens (Tailwind examples)
- enter: opacity-0 translate-y-2 → opacity-100 translate-y-0 (duration-200 ease-out)
- overlay: bg-slate-950/50 → bg-slate-950/60
- icon: scale-95 → scale-100 with transition

---

## 2. Design System & Brand Tokens

Separation
- Each site maintains its own tokens via CSS variables and Tailwind mapping
- No hard-coded hex in components; use Tailwind classes referencing CSS vars

Cortiware (Rebrand-ready)
- File: apps/marketing-cortiware/src/styles/brand.css
- Variables (examples):
  - Colors: --brand-50..900, --bg, --surface, --text, --muted
  - Gradients: --brand-gradient (e.g., emerald→teal)
  - Radii: --radius-sm/md/lg/xl
  - Shadows: --shadow-sm/md/lg
  - Typography: --font-display, --font-body (families/weights)
- Tailwind: map theme.extend.colors.brand, background, surface, text via CSS vars
- Usage: Use classes like text-brand-600, bg-surface, border-brand-700, from-[var(--brand-gradient)]
- Rebrand procedure: Replace values in brand.css + assets (logo, favicon, OG). No component refactor required.

Robinson (Apply existing kit)
- File: apps/marketing-robinson/src/styles/brand.css
- Map kit palette/typography to CSS vars; mirror Tailwind mapping above
- Apply to Nav/Footer first; ensure enterprise/executive tone

Shared Primitives per site
- Layout components: Header/Nav, Footer, Section
- UI: Card, Badge, CTAButton, FeatureCard, PricingCard, GridList, FormField
- Motion: duration/easings; modest hover/entrance transitions

---

## 3. Information Architecture

Cortiware
- /, /features, /industries (+ vertical pages), /pricing, /get-started, /contact, /about, /privacy, /terms
- Utility: 404, 500, robots.txt, sitemap.xml

Robinson
- /, /services (or /engagements), /security, /why, /approach, /case-studies, /about, /contact, /privacy, /terms
- Utility: 404, 500, robots.txt, sitemap.xml

---

## 4. Content & Copy Guidelines
- Product-led for Cortiware; expertise-led for Robinson
- Avoid untrue industry claims; clearly label Early Access vs Roadmap
- Use clear CTAs: Cortiware → Get Started; Robinson → Contact/Schedule

---

## 5. SEO / Performance / Accessibility

SEO
- Per-page metadata (title/description)
- Open Graph + Twitter cards; correct images per site
- JSON-LD: Organization, Product, BreadcrumbList, FAQ (where applicable)
- Sitemap + robots.txt

Performance
- next/image for responsive images
- Font loading strategy (swap); subset if necessary
- Code-splitting and lazy components where viable

Accessibility
- Keyboard navigation, focus-visible states, skip links
- Color contrast AA+
- Forms: labels, aria-invalid, error messaging

---

## 6. Communications Integration
- Use aliases from docs/EMAIL_ALIASES.md
- Robinson site now: hello@ (default), sales@ (pricing/enterprise), support@ (help), security@ (security), privacy@ (policy), webmaster@ (ops)
- Cortiware site until its domain is live: use robinsonaisystems.com equivalents

---

## 7. Acceptance Criteria
- Mobile nav hamburger implemented and accessible per spec
- Tokens-based theming with no hard-coded colors in components
- Robinson styling applied to header/footer baseline
- SEO: valid OG/Twitter + JSON-LD; sitemap/robots present
- Lighthouse targets: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- No broken links; 404/500 themed

---

## 8. Implementation Order (Model-optimized)
1) Tokens + Nav primitives (both sites)
2) Robinson header/footer styling (kit-applied)
3) Page shells + metadata/JSON-LD
4) Copy pass; then performance/a11y polish
5) Forms wiring (safe-by-default); provider choice pending approval

Owners
- Planning/audits: GPT‑5
- Implementation: Sonnet 4.5
- Copy variants (batch): Haiku; final pass: GPT‑5

Change log
- 2025-10-17: Initial finalized spec created

