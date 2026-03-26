import { useState, useEffect } from 'react';
import { notifications as notiApi } from '../../services/api';

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notiApi.list().then((d) => { setNotifs(d.notifications || []); setUnread(d.unread || 0); }).catch(() => {});
  }, []);

  const handleReadAll = async () => {
    await notiApi.readAll().catch(() => {});
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center cursor-pointer hover:border-gold/20 transition-all relative">
        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-[9px] text-white font-bold flex items-center justify-center">{unread}</div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] rounded-xl bg-dark3 border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[12px] font-semibold text-white/50">Notifications</span>
            {unread > 0 && (
              <button onClick={handleReadAll} className="text-[11px] text-gold bg-transparent border-none cursor-pointer hover:text-gold-light">Mark all read</button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-white/20 text-[13px]">No notifications</div>
            ) : notifs.slice(0, 10).map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-white/[0.04] last:border-0 ${!n.read ? 'bg-gold/[0.03]' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-[12px]">{n.title}</span>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1" />}
                </div>
                <p className="text-[11px] text-white/30 mt-0.5">{n.body}</p>
                <span className="text-[10px] text-white/15 mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
