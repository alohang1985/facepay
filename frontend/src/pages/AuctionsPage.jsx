import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auctions as auctionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function AuctionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [allAuctions, setAllAuctions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    try {
      const d = await auctionApi.list();
      setAllAuctions(d.auctions || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  const handleBid = async (auctionId) => {
    if (!user) { navigate('/login'); return; }
    if (!bidAmount) { toast.error('Enter bid amount'); return; }
    try {
      await auctionApi.bid(auctionId, parseFloat(bidAmount));
      toast.success(`Bid placed: $${bidAmount}`);
      setBidAmount('');
      load();
      if (selected?.id === auctionId) {
        const updated = await auctionApi.get(auctionId);
        setSelected(updated);
      }
    } catch (e) { toast.error(e.message); }
  };

  const filtered = tab === 'all' ? allAuctions : allAuctions.filter((a) => a.status === tab);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-14">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[3px] text-danger font-semibold mb-2">Live</div>
            <h1 className="text-[38px] font-extrabold tracking-[-1.5px]">🔨 Face Auctions</h1>
            <p className="text-white/30 text-[14px] mt-2">Bid for exclusive face licenses. 10-minute live auctions.</p>
          </div>
        </div>

        <div className="flex gap-1 mb-8 bg-white/[0.03] p-1 rounded-xl w-fit">
          {[{k:'all',l:'All'},{k:'live',l:'🔴 Live'},{k:'scheduled',l:'Upcoming'},{k:'ended',l:'Ended'}].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-5 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all ${
                tab === t.k ? 'text-gold bg-gold/[0.1]' : 'text-white/30 bg-transparent hover:text-white/50'
              }`}>{t.l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <div className="text-[48px] mb-4">🔨</div>
            <p className="text-white/30 text-[16px] mb-2">No auctions yet</p>
            <p className="text-white/15 text-[13px]">Exclusive license auctions will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <div key={a.id} className={`rounded-2xl border overflow-hidden transition-all ${
                a.status === 'live' ? 'border-danger/30 bg-danger/[0.03]' : 'border-white/[0.06] bg-white/[0.025]'
              }`}>
                {/* Face photo */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={a.face_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop&crop=face'}
                    alt={a.face_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {a.status === 'live' && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white" /> LIVE
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <div className="text-white font-bold text-[18px]">{a.face_name}</div>
                    <div className="text-white/40 text-[12px]">by {a.provider_name}</div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-[10px] text-white/25 uppercase tracking-wider">Current Bid</div>
                      <div className="text-gold font-extrabold text-[24px]">${a.current_price?.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/25 uppercase tracking-wider">Bids</div>
                      <div className="text-white/60 font-bold text-[20px]">{a.bid_count}</div>
                    </div>
                  </div>

                  <div className="text-[12px] text-white/30 mb-1">Industry: <span className="text-white/50">{a.industry}</span></div>
                  <div className="text-[12px] text-white/30 mb-4">
                    {a.status === 'live' ? 'Ends' : a.status === 'scheduled' ? 'Starts' : 'Ended'}:{' '}
                    <span className="text-white/50">{new Date(a.status === 'scheduled' ? a.starts_at : a.ends_at).toLocaleString()}</span>
                  </div>

                  {(a.status === 'live' || a.status === 'scheduled') && (
                    <div className="flex gap-2">
                      <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min $${(a.current_price + 1).toFixed(0)}`}
                        className="flex-1 py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
                      <button onClick={() => handleBid(a.id)}
                        className="px-5 py-2.5 rounded-lg bg-danger text-white font-bold text-[12px] border-none cursor-pointer hover:bg-red-500 transition-all">
                        Bid
                      </button>
                    </div>
                  )}

                  {a.status === 'ended' && a.current_bidder_id && (
                    <div className="p-3 rounded-lg bg-gold/[0.06] border border-gold/15 text-center">
                      <span className="text-gold text-[13px] font-semibold">Won at ${a.current_price?.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
