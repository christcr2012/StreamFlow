/**
 * Pricing Data Fetcher for Marketing Site
 * 
 * Fetches pricing from the Provider Portal API with ISR (Incremental Static Regeneration).
 * Falls back to hardcoded pricing if API is unavailable.
 */

export interface PricingPlan {
  name: string;
  price: number | null; // null for "Contact Sales"
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export interface PricingData {
  plans: PricingPlan[];
  lastUpdated: string;
}

// Fallback pricing (used if API fails)
const FALLBACK_PRICING: PricingData = {
  plans: [
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
  ],
  lastUpdated: new Date().toISOString(),
};

/**
 * Fetch pricing data from Provider Portal API
 * 
 * Uses Next.js fetch with revalidation for ISR:
 * - Revalidates every 60 seconds
 * - Serves stale data while revalidating in background
 * - Falls back to hardcoded pricing if API fails
 */
export async function getPricing(): Promise<PricingData> {
  const apiUrl = process.env.NEXT_PUBLIC_PROVIDER_PORTAL_URL || 'https://provider.robinsonaisystems.com';
  const endpoint = `${apiUrl}/api/public/pricing`;

  try {
    const response = await fetch(endpoint, {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ['pricing'], // Tag for on-demand revalidation
      },
    });

    if (!response.ok) {
      console.warn(`Pricing API returned ${response.status}, using fallback`);
      return FALLBACK_PRICING;
    }

    const data: PricingData = await response.json();
    
    // Validate response structure
    if (!data.plans || !Array.isArray(data.plans) || data.plans.length === 0) {
      console.warn('Invalid pricing data structure, using fallback');
      return FALLBACK_PRICING;
    }

    return data;
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return FALLBACK_PRICING;
  }
}

/**
 * Get pricing for a specific plan by slug
 */
export async function getPricingPlan(slug: string): Promise<PricingPlan | null> {
  const data = await getPricing();
  const plan = data.plans.find((p) => p.name.toLowerCase() === slug.toLowerCase());
  return plan || null;
}

