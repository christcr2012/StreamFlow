import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { addConnection, removeConnection } from '@/lib/sse';

/**
 * Server-Sent Events (SSE) endpoint for real-time updates
 *
 * Clients can subscribe to receive real-time notifications about:
 * - Job status changes
 * - Invoice payments
 * - New customer messages
 * - Agreement signatures
 *
 * Usage:
 * const eventSource = new EventSource('/api/sse');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Received update:', data);
 * };
 */

export async function GET(request: NextRequest) {
  const authContext = await getAuthContext();
  
  if (!authContext.isAuthenticated || !authContext.orgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = authContext.orgId;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the org's connection set
      addConnection(orgId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'keepalive', timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveInterval);
        removeConnection(orgId, controller);
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

