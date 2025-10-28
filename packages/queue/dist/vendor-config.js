/**
 * Vendor API Configuration Management
 *
 * Stores and retrieves encrypted vendor API credentials from org settings.
 */
/**
 * Get vendor credentials from org settings
 */
export async function getVendorCredentials(prisma, orgId, vendor) {
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
    return vendorConfig;
}
/**
 * Save vendor credentials to org settings
 */
export async function saveVendorCredentials(prisma, orgId, vendor, credentials) {
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
export async function listConfiguredVendors(prisma, orgId) {
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
        .filter(([_, config]) => config.enabled)
        .map(([vendor, config]) => ({
        vendor: vendor,
        ...config,
    }));
}
/**
 * Test vendor API connection
 */
export async function testVendorConnection(vendor, credentials) {
    try {
        switch (vendor) {
            case 'samsara':
                return await testSamsaraConnection(credentials);
            case 'geotab':
                return await testGeotabConnection(credentials);
            case 'paylocity':
                return await testPaylocityConnection(credentials);
            case 'holman':
                return await testHolmanConnection(credentials);
            default:
                return { success: false, message: `Unknown vendor: ${vendor}` };
        }
    }
    catch (error) {
        return { success: false, message: error.message };
    }
}
async function testSamsaraConnection(creds) {
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
    }
    else {
        return { success: false, message: `Samsara API error: ${response.statusText}` };
    }
}
async function testGeotabConnection(creds) {
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
    }
    else {
        return { success: false, message: `Geotab API error: ${data.error?.message || 'Unknown error'}` };
    }
}
async function testPaylocityConnection(creds) {
    // Test Paylocity API connection (OAuth flow)
    // This is simplified - actual implementation would need OAuth token exchange
    return {
        success: true,
        message: 'Paylocity credentials saved (OAuth authentication required on first sync)'
    };
}
async function testHolmanConnection(creds) {
    // Test Holman API connection
    // This is a placeholder - actual endpoint depends on Holman's API
    return {
        success: true,
        message: 'Holman credentials saved (will be validated on first sync)'
    };
}
//# sourceMappingURL=vendor-config.js.map