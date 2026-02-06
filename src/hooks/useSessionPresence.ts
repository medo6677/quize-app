import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  student_id?: string;
  online_at: string;
  role: 'student' | 'teacher';
}

export function useSessionPresence(
  sessionCode: string | undefined, 
  userInfo?: { studentId: string; role: 'student' | 'teacher' }
) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    // Unique channel per session for presence
    const channelName = `presence:${sessionCode}`;
    const newChannel = supabase.channel(channelName);

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState<PresenceState>();
        
        // Flatten the presence state to count unique users
        // Structure is { [presenceId]: [ { student_id, ... }, ... ] }
        const allPresences = Object.values(state).flat();
        
        // Filter for students only if we want to count students
        const students = allPresences.filter(p => p.role === 'student');
        
        setOnlineCount(students.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // If userInfo is provided, track this user
          if (userInfo) {
            await newChannel.track({
              student_id: userInfo.studentId,
              role: userInfo.role,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [sessionCode, userInfo?.studentId]);

  return { onlineCount, channel };
}
