/**
 * Realtime Pub/Sub Infrastructure
 *
 * Provides real-time updates for:
 * - Driver/board updates
 * - Work order status changes
 * - Dispatch notifications
 * - Location tracking
 *
 * Uses Ably for managed pub/sub with automatic scaling
 */
import Ably from 'ably';
// Ably client singleton
let ablyClient = null;
/**
 * Get or create Ably client
 */
export function getAblyClient() {
    if (!ablyClient) {
        const apiKey = process.env.ABLY_API_KEY;
        if (!apiKey) {
            throw new Error('ABLY_API_KEY environment variable is required');
        }
        ablyClient = new Ably.Realtime({
            key: apiKey,
            echoMessages: false, // Don't echo messages back to sender
        });
    }
    return ablyClient;
}
/**
 * Publish dispatch update
 */
export async function publishDispatchUpdate(orgId, update) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:dispatch`);
    await channel.publish('dispatch-update', update);
}
/**
 * Publish driver update
 */
export async function publishDriverUpdate(orgId, driverId, update) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:driver:${driverId}`);
    await channel.publish('driver-update', update);
}
/**
 * Publish location update
 */
export async function publishLocationUpdate(orgId, update) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:location`);
    await channel.publish('location-update', update);
}
/**
 * Subscribe to dispatch updates
 */
export function subscribeToDispatch(orgId, callback) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:dispatch`);
    const listener = (message) => {
        callback(message.data);
    };
    channel.subscribe('dispatch-update', listener);
    // Return unsubscribe function
    return () => {
        channel.unsubscribe('dispatch-update', listener);
    };
}
/**
 * Subscribe to driver updates
 */
export function subscribeToDriver(orgId, driverId, callback) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:driver:${driverId}`);
    const listener = (message) => {
        callback(message.data);
    };
    channel.subscribe('driver-update', listener);
    // Return unsubscribe function
    return () => {
        channel.unsubscribe('driver-update', listener);
    };
}
/**
 * Subscribe to location updates
 */
export function subscribeToLocations(orgId, callback) {
    const client = getAblyClient();
    const channel = client.channels.get(`org:${orgId}:location`);
    const listener = (message) => {
        callback(message.data);
    };
    channel.subscribe('location-update', listener);
    // Return unsubscribe function
    return () => {
        channel.unsubscribe('location-update', listener);
    };
}
/**
 * Generate Ably token for client-side authentication
 *
 * This should be called from an API route to generate tokens
 * with appropriate permissions for the authenticated user
 */
export async function generateAblyToken(orgId, userId, capabilities) {
    const client = getAblyClient();
    // Default capabilities: subscribe to org channels
    const defaultCapabilities = {
        [`org:${orgId}:*`]: ['subscribe'],
    };
    const tokenRequest = await client.auth.createTokenRequest({
        clientId: userId,
        capability: (capabilities || defaultCapabilities),
        ttl: 3600000, // 1 hour
    });
    return JSON.stringify(tokenRequest);
}
/**
 * Close Ably connection
 */
export async function closeAblyConnection() {
    if (ablyClient) {
        ablyClient.close();
        ablyClient = null;
    }
}
//# sourceMappingURL=index.js.map