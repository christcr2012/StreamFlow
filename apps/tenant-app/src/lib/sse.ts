/**
 * Server-Sent Events (SSE) utility for real-time updates
 * 
 * This module manages SSE connections and provides a broadcast function
 * to send events to all connected clients for a specific organization.
 */

// Store active connections per org
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Add a connection to the org's connection set
 */
export function addConnection(orgId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(orgId)) {
    connections.set(orgId, new Set());
  }
  connections.get(orgId)!.add(controller);
}

/**
 * Remove a connection from the org's connection set
 */
export function removeConnection(orgId: string, controller: ReadableStreamDefaultController) {
  connections.get(orgId)?.delete(controller);
  if (connections.get(orgId)?.size === 0) {
    connections.delete(orgId);
  }
}

/**
 * Helper function to broadcast events to all connected clients for an org
 * This would be called from other API routes when events occur
 */
export function broadcastToOrg(orgId: string, event: any) {
  const orgConnections = connections.get(orgId);
  if (!orgConnections) return;

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = encoder.encode(message);

  for (const controller of orgConnections) {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      // Remove failed connection
      orgConnections.delete(controller);
    }
  }
}

