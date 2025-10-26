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
let ablyClient: Ably.Realtime | null = null;

/**
 * Get or create Ably client
 */
export function getAblyClient(): Ably.Realtime {
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
 * Channel naming conventions:
 * - org:{orgId}:dispatch - Dispatch board updates for an organization
 * - org:{orgId}:driver:{driverId} - Updates for a specific driver
 * - org:{orgId}:workorder:{workOrderId} - Updates for a specific work order
 * - org:{orgId}:location - Location updates for all assets/staff
 */

export interface DispatchUpdate {
  type: 'work_order_assigned' | 'work_order_started' | 'work_order_completed' | 'work_order_cancelled';
  workOrderId: string;
  driverId?: string;
  timestamp: string;
  data?: any;
}

export interface DriverUpdate {
  type: 'location' | 'status' | 'assignment';
  driverId: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  status?: 'available' | 'busy' | 'offline';
  assignment?: {
    workOrderId: string;
    eta?: string;
  };
}

export interface LocationUpdate {
  type: 'asset' | 'staff';
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  speed?: number;
  heading?: number;
}

/**
 * Publish dispatch update
 */
export async function publishDispatchUpdate(
  orgId: string,
  update: DispatchUpdate
): Promise<void> {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:dispatch`);
  
  await channel.publish('dispatch-update', update);
}

/**
 * Publish driver update
 */
export async function publishDriverUpdate(
  orgId: string,
  driverId: string,
  update: DriverUpdate
): Promise<void> {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:driver:${driverId}`);
  
  await channel.publish('driver-update', update);
}

/**
 * Publish location update
 */
export async function publishLocationUpdate(
  orgId: string,
  update: LocationUpdate
): Promise<void> {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:location`);
  
  await channel.publish('location-update', update);
}

/**
 * Subscribe to dispatch updates
 */
export function subscribeToDispatch(
  orgId: string,
  callback: (update: DispatchUpdate) => void
): () => void {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:dispatch`);
  
  const listener = (message: Ably.Message) => {
    callback(message.data as DispatchUpdate);
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
export function subscribeToDriver(
  orgId: string,
  driverId: string,
  callback: (update: DriverUpdate) => void
): () => void {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:driver:${driverId}`);
  
  const listener = (message: Ably.Message) => {
    callback(message.data as DriverUpdate);
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
export function subscribeToLocations(
  orgId: string,
  callback: (update: LocationUpdate) => void
): () => void {
  const client = getAblyClient();
  const channel = client.channels.get(`org:${orgId}:location`);
  
  const listener = (message: Ably.Message) => {
    callback(message.data as LocationUpdate);
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
export async function generateAblyToken(
  orgId: string,
  userId: string,
  capabilities?: Record<string, string[]>
): Promise<string> {
  const client = getAblyClient();
  
  // Default capabilities: subscribe to org channels
  const defaultCapabilities = {
    [`org:${orgId}:*`]: ['subscribe'],
  };
  
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: (capabilities || defaultCapabilities) as any,
    ttl: 3600000, // 1 hour
  });
  
  return JSON.stringify(tokenRequest);
}

/**
 * Close Ably connection
 */
export async function closeAblyConnection(): Promise<void> {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
  }
}

