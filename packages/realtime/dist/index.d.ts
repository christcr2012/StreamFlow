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
/**
 * Get or create Ably client
 */
export declare function getAblyClient(): Ably.Realtime;
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
export declare function publishDispatchUpdate(orgId: string, update: DispatchUpdate): Promise<void>;
/**
 * Publish driver update
 */
export declare function publishDriverUpdate(orgId: string, driverId: string, update: DriverUpdate): Promise<void>;
/**
 * Publish location update
 */
export declare function publishLocationUpdate(orgId: string, update: LocationUpdate): Promise<void>;
/**
 * Subscribe to dispatch updates
 */
export declare function subscribeToDispatch(orgId: string, callback: (update: DispatchUpdate) => void): () => void;
/**
 * Subscribe to driver updates
 */
export declare function subscribeToDriver(orgId: string, driverId: string, callback: (update: DriverUpdate) => void): () => void;
/**
 * Subscribe to location updates
 */
export declare function subscribeToLocations(orgId: string, callback: (update: LocationUpdate) => void): () => void;
/**
 * Generate Ably token for client-side authentication
 *
 * This should be called from an API route to generate tokens
 * with appropriate permissions for the authenticated user
 */
export declare function generateAblyToken(orgId: string, userId: string, capabilities?: Record<string, string[]>): Promise<string>;
/**
 * Close Ably connection
 */
export declare function closeAblyConnection(): Promise<void>;
//# sourceMappingURL=index.d.ts.map