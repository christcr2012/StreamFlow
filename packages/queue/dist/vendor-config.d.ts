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
export declare function getVendorCredentials(prisma: any, orgId: string, vendor: string): Promise<VendorCredentials | null>;
/**
 * Save vendor credentials to org settings
 */
export declare function saveVendorCredentials(prisma: any, orgId: string, vendor: string, credentials: Partial<VendorCredentials>): Promise<void>;
/**
 * List all configured vendors for an org
 */
export declare function listConfiguredVendors(prisma: any, orgId: string): Promise<VendorCredentials[]>;
/**
 * Test vendor API connection
 */
export declare function testVendorConnection(vendor: string, credentials: Record<string, string>): Promise<{
    success: boolean;
    message: string;
}>;
