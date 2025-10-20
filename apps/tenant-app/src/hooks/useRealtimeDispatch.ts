/**
 * React Hook for Realtime Dispatch Updates
 * 
 * Subscribes to dispatch board updates for an organization
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Ably from 'ably';

export interface DispatchUpdate {
  type: 'work_order_assigned' | 'work_order_started' | 'work_order_completed' | 'work_order_cancelled';
  workOrderId: string;
  driverId?: string;
  timestamp: string;
  data?: any;
}

export function useRealtimeDispatch(orgId: string) {
  const [updates, setUpdates] = useState<DispatchUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  
  // Initialize Ably client
  useEffect(() => {
    let ablyClient: Ably.Realtime | null = null;
    
    async function initializeAbly() {
      try {
        // Get token from API
        const response = await fetch('/api/realtime/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get Ably token');
        }
        
        const { tokenRequest } = await response.json();
        
        // Create Ably client with token
        ablyClient = new Ably.Realtime({
          authCallback: async (tokenParams, callback) => {
            callback(null, tokenRequest);
          },
        });
        
        ablyClient.connection.on('connected', () => {
          setConnected(true);
          setError(null);
        });
        
        ablyClient.connection.on('disconnected', () => {
          setConnected(false);
        });
        
        ablyClient.connection.on('failed', (stateChange) => {
          setConnected(false);
          setError(stateChange.reason?.message || 'Connection failed');
        });
        
        setClient(ablyClient);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    
    initializeAbly();
    
    return () => {
      if (ablyClient) {
        ablyClient.close();
      }
    };
  }, [orgId]);
  
  // Subscribe to dispatch channel
  useEffect(() => {
    if (!client || !connected) return;
    
    const channel = client.channels.get(`org:${orgId}:dispatch`);
    
    const handleUpdate = (message: Ably.Message) => {
      const update = message.data as DispatchUpdate;
      setUpdates((prev) => [update, ...prev].slice(0, 100)); // Keep last 100 updates
    };
    
    channel.subscribe('dispatch-update', handleUpdate);
    
    return () => {
      channel.unsubscribe('dispatch-update', handleUpdate);
    };
  }, [client, connected, orgId]);
  
  // Clear updates
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);
  
  return {
    updates,
    connected,
    error,
    clearUpdates,
  };
}

