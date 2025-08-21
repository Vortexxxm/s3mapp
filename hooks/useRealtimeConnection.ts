import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    let channel: RealtimeChannel;
    let reconnectTimer: NodeJS.Timeout;

    const setupConnection = () => {
      channel = supabase
        .channel('connection_monitor')
        .on('presence', { event: 'sync' }, () => {
          console.log('🟢 Real-time connection established');
          setIsConnected(true);
          setReconnectAttempts(0);
        })
        .on('presence', { event: 'join' }, () => {
          console.log('🔵 Client joined real-time channel');
          setIsConnected(true);
        })
        .on('presence', { event: 'leave' }, () => {
          console.log('🔴 Client left real-time channel');
          setIsConnected(false);
        })
        .subscribe((status) => {
          console.log('📡 Real-time subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setReconnectAttempts(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            
            // Attempt to reconnect with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimer = setTimeout(() => {
              console.log(`🔄 Attempting to reconnect... (attempt ${reconnectAttempts + 1})`);
              setReconnectAttempts(prev => prev + 1);
              channel.unsubscribe();
              setupConnection();
            }, delay);
          }
        });
    };

    setupConnection();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [reconnectAttempts]);

  return { isConnected, reconnectAttempts };
}