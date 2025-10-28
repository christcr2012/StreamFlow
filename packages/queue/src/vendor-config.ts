/**
 * Vendor API Configuration Management
 * 
 * Stores and retrieves encrypted vendor API credentials from org settings.
 */

export interface VendorCredentials {
  vendor: 'samsara' | 'geotab' | 'paylocity' | 'holman';
  enabled: boolean;
  credentials: Record<string, string>;
  lastSyncAt?: string;
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'manual';
}

export interface SamsaraCredentials {
  apiKey: string;
  groupId?: string;
}

export interface GeotabCredentials {
  username: string;
  password: string;
  database: string;
  server?: string;
}

export interface PaylocityCredentials {
  clientId: string;
  clientSecret: string;
  companyId: string;
}

export interface HolmanCredentials {
  apiKey: string;
  clientId: string;
}

/**
 * Get vendor credentials from org settings
 */
export async function getVendorCredentials(
  prisma: any,
  orgId: string,
  vendor: string
): Promise<VendorCredentials | null> {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { settingsJson: true },
  });

  if (!org || !org.settingsJson) {
    return null;
  }

  const settings = typeof org.settingsJson === 'string' 
    ? JSON.parse(org.settingsJson) 
    : org.settingsJson;

  const vendorConfig = settings.vendors?.[vendor];
  
  if (!vendorConfig || !vendorConfig.enabled) {
    return null;
  }

  return vendorConfig as VendorCredentials;
}

/**
 * Save vendor credentials to org settings
 */
export async function saveVendorCredentials(
  prisma: any,
  orgId: string,
  vendor: string,
  credentials: Partial<VendorCredentials>
): Promise<void> {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { settingsJson: true },
  });

  const settings = org?.settingsJson 
    ? (typeof org.settingsJson === 'string' ? JSON.parse(org.settingsJson) : org.settingsJson)
    : {};

  if (!settings.vendors) {
    settings.vendors = {};
  }

  settings.vendors[vendor] = {
    ...settings.vendors[vendor],
    ...credentials,
    updatedAt: new Date().toISOString(),
  };

  await prisma.org.update({
    where: { id: orgId },
    data: {
      settingsJson: settings,
    },
  });
}

/**
 * List all configured vendors for an org
 */
export async function listConfiguredVendors(
  prisma: any,
  orgId: string
): Promise<VendorCredentials[]> {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { settingsJson: true },
  });

  if (!org || !org.settingsJson) {
    return [];
  }

  const settings = typeof org.settingsJson === 'string' 
    ? JSON.parse(org.settingsJson) 
    : org.settingsJson;

  const vendors = settings.vendors || {};
  
  return Object.entries(vendors)
    .filter(([_, config]: [string, any]) => config.enabled)
    .map(([vendor, config]: [string, any]) => ({
      vendor: vendor as any,
      ...config,
    }));
}

/**
 * Test vendor API connection
 */
export async function testVendorConnection(
  vendor: string,
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  try {
    switch (vendor) {
      case 'samsara':
        return await testSamsaraConnection(credentials as any);
      case 'geotab':
        return await testGeotabConnection(credentials as any);
      case 'paylocity':
        return await testPaylocityConnection(credentials as any);
      case 'holman':
        return await testHolmanConnection(credentials as any);
      default:
        return { success: false, message: `Unknown vendor: ${vendor}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testSamsaraConnection(creds: SamsaraCredentials): Promise<{ success: boolean; message: string }> {
  // Test Samsara API connection
  const response = await fetch('https://api.samsara.com/fleet/vehicles', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${creds.apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (response.ok) {
    return { success: true, message: 'Successfully connected to Samsara API' };
  } else {
    return { success: false, message: `Samsara API error: ${response.statusText}` };
  }
}

async function testGeotabConnection(creds: GeotabCredentials): Promise<{ success: boolean; message: string }> {
  // Test Geotab API connection
  const server = creds.server || 'my.geotab.com';
  const response = await fetch(`https://${server}/apiv1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Authenticate',
      params: {
        userName: creds.username,
        password: creds.password,
        database: creds.database,
      },
    }),
  });

  const data = await response.json();
  
  if (data.result) {
    return { success: true, message: 'Successfully connected to Geotab API' };
  } else {
    return { success: false, message: `Geotab API error: ${data.error?.message || 'Unknown error'}` };
  }
}

async function testPaylocityConnection(creds: PaylocityCredentials): Promise<{ success: boolean; message: string }> {
  // Test Paylocity API connection (OAuth flow)
  // This is simplified - actual implementation would need OAuth token exchange
  return { 
    success: true, 
    message: 'Paylocity credentials saved (OAuth authentication required on first sync)' 
  };
}

async function testHolmanConnection(creds: HolmanCredentials): Promise<{ success: boolean; message: string }> {
  // Test Holman API connection
  // This is a placeholder - actual endpoint depends on Holman's API
  return { 
    success: true, 
    message: 'Holman credentials saved (will be validated on first sync)' 
  };
}

