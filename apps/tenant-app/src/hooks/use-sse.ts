'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface SSEEvent {
  type: 'job_updated' | 'invoice_updated' | 'payment_received' | 'customer_updated';
  data: any;
  timestamp: string;
}

export interface UseSSEOptions {
  onJobUpdated?: (data: any) => void;
  onInvoiceUpdated?: (data: any) => void;
  onPaymentReceived?: (data: any) => void;
  onCustomerUpdated?: (data: any) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onJobUpdated,
    onInvoiceUpdated,
    onPaymentReceived,
    onCustomerUpdated,
    onError,
    reconnectInterval = 3000,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        isConnectedRef.current = true;
        console.log('[SSE] Connected');
      };

      eventSource.onerror = (error) => {
        isConnectedRef.current = false;
        console.error('[SSE] Error:', error);
        
        if (onError) {
          onError(new Error('SSE connection error'));
        }

        // Attempt to reconnect
        eventSource.close();
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[SSE] Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      };

      eventSource.addEventListener('message', (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);
          
          switch (sseEvent.type) {
            case 'job_updated':
              if (onJobUpdated) {
                onJobUpdated(sseEvent.data);
              }
              break;
            case 'invoice_updated':
              if (onInvoiceUpdated) {
                onInvoiceUpdated(sseEvent.data);
              }
              break;
            case 'payment_received':
              if (onPaymentReceived) {
                onPaymentReceived(sseEvent.data);
              }
              break;
            case 'customer_updated':
              if (onCustomerUpdated) {
                onCustomerUpdated(sseEvent.data);
              }
              break;
          }
        } catch (err) {
          console.error('[SSE] Failed to parse event:', err);
        }
      });
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
      if (onError) {
        onError(err as Error);
      }
    }
  }, [onJobUpdated, onInvoiceUpdated, onPaymentReceived, onCustomerUpdated, onError, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      isConnectedRef.current = false;
      console.log('[SSE] Disconnected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    reconnect: connect,
    disconnect,
  };
}

