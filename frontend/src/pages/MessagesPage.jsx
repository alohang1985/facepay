import { useState, useEffect } from 'react';
import { messages as msgApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function MessagesPage() {
  const toast = useToast();
  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [i, s] = await Promise.all([msgApi.inbox(), msgApi.sent()]);
      setInbox(i.messages || []);
      setUnread(i.unread || 0);
      setSent(s.messages || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleRead = async (msg) => {
    setSelected(msg);
    if (!msg.read) {
      await msgApi.markRead(msg.id).catch(() => {});
      load();
    }
  };

  const handleDelete = async (id) => {
    await msgApi.delete(id);
    toast.success('Message deleted');
    setSelected(null);
    load();
  };

  const items = tab === 'inbox' ? inbox : sent;

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Communication</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Messages</h1>
          {unread > 0 && <p className="text-gold text-[14px] mt-1">{unread} unread messages</p>}
        </div>

        <div className="flex gap-1 mb-8 bg-white/[0.03] p-1 rounded-xl w-fit">
          {[{k:'inbox',l:`Inbox (${inbox.length})`},{k:'sent',l:`Sent (${sent.length})`}].map((t) => (
            <button key={t.k} onClick={() => {setTab(t.k); setSelected(null);}}
              className={`px-5 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all tracking-wide ${
                tab === t.k ? 'text-gold bg-gold/[0.1]' : 'text-white/30 bg-transparent hover:text-white/50'
              }`}>{t.l}</button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Message list */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-2">
            {items.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-white/20">No messages</div>
            ) : items.map((m) => (
              <button key={m.id} onClick={() => handleRead(m)}
                className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all ${
                  selected?.id === m.id ? 'bg-gold/[0.06] border-gold/25' :
                  !m.read && tab === 'inbox' ? 'bg-white/[0.04] border-white/[0.08]' :
                  'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.03]'
                }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-[13px] truncate">{tab === 'inbox' ? m.from_name : m.to_name}</span>
                  <span className="text-[10px] text-white/20 shrink-0">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-[12px] text-gold/60 truncate">{m.subject || '(no subject)'}</div>
                <div className="text-[11px] text-white/25 truncate mt-0.5">{m.body}</div>
                {!m.read && tab === 'inbox' && <div className="w-2 h-2 rounded-full bg-gold absolute top-3 right-3" />}
              </button>
            ))}
          </div>

          {/* Message detail */}
          {selected && (
            <div className="flex-1 min-w-0 hidden lg:block">
              <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[18px] font-bold">{selected.subject || '(no subject)'}</h3>
                    <p className="text-white/30 text-[12px] mt-1">
                      From: {selected.from_name || 'Unknown'} · {new Date(selected.created_at).toLocaleString()}
                    </p>
                    {selected.face_name && <p className="text-gold/60 text-[12px]">Re: {selected.face_name}</p>}
                  </div>
                  <button onClick={() => handleDelete(selected.id)}
                    className="px-3 py-1.5 rounded-lg bg-transparent border border-danger/20 text-danger text-[11px] font-semibold cursor-pointer hover:bg-danger/10 transition-all">Delete</button>
                </div>
                <div className="text-white/50 text-[14px] leading-relaxed whitespace-pre-wrap">{selected.body}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
