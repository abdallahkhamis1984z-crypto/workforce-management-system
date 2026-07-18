import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Badge } from '../../components/ui/Badge';
import { useLang } from '../../context/LangContext';
import type { AppNotification } from '../../types';

const SEVERITY_COLOR = { info: '#2563eb', warning: '#ca8a04', critical: '#dc2626' };

export default function Notifications() {
  const { lang } = useLang();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setItems((data as AppNotification[]) ?? []));
  }, []);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems(items.map(i => (i.id === id ? { ...i, is_read: true } : i)));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Notifications</h1>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-slate-400">No notifications.</p>}
        {items.map(n => (
          <div
            key={n.id}
            className={`flex items-start justify-between rounded-xl bg-white p-4 shadow-sm ${n.is_read ? 'opacity-60' : ''}`}
          >
            <div>
              <Badge text={n.severity} color={SEVERITY_COLOR[n.severity]} />
              <p className="mt-2 text-sm text-slate-700">{lang === 'ar' ? n.message_ar : n.message_en}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && (
              <button onClick={() => markRead(n.id)} className="text-xs font-medium text-blue-600 hover:underline">
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
