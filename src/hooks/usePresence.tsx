import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  online_at: string;
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    console.log('Setting up presence for user:', user.email);

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presence sync:', state);
        
        const users: OnlineUser[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence) {
            users.push({
              id: key,
              name: presence.name || presence.email || 'Unknown',
              email: presence.email || '',
              online_at: presence.online_at,
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        console.log('Subscribed to presence channel');
        
        // Track current user
        const presenceTrackStatus = await presenceChannel.track({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          online_at: new Date().toISOString(),
        });
        
        console.log('Presence track status:', presenceTrackStatus);
      });

    setChannel(presenceChannel);

    return () => {
      console.log('Cleaning up presence channel');
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  return { onlineUsers };
}
