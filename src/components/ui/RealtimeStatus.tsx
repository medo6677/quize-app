import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

export default function RealtimeStatus() {
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');

  useEffect(() => {
    // Create a monitoring channel to track connection status
    const channel = supabase.channel('system_monitor');
    
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        setStatus('CONNECTED');
      } else if (state === 'CLOSED' || state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        setStatus('DISCONNECTED');
      } else {
        setStatus('CONNECTING');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Don't show if everything is fine to keep UI clean, 
  // OR show a small indicator if user wants assurance. 
  // Given the user is debugging, let's show it always for now.

  return (
    <div className={`fixed bottom-4 left-4 z-50 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg ${
      status === 'CONNECTED' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
      status === 'CONNECTING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
      'bg-red-500/20 text-red-400 border border-red-500/50'
    } backdrop-blur-md`}>
      {status === 'CONNECTED' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
      <span className="text-xs font-bold text-nowrap">
        {status === 'CONNECTED' ? 'متصل' : 
         status === 'CONNECTING' ? 'جاري الاتصال...' : 
         'مفصول - تحقق من الإنترنت'}
      </span>
    </div>
  );
}
