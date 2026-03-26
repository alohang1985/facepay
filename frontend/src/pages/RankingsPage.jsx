import { useState, useEffect } from 'react';
import { subscriptions } from '../services/api';

export default function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptions.rankings().then((d) => setRankings(d.rankings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-center mb-12">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Leaderboard</div>
          <h1 className="text-[38px] font-extrabold tracking-[-1.5px]">Top Providers</h1>
          <p className="text-white/30 text-[14px] mt-2">Most successful face providers on FacePay</p>
        </div>

        <div className="space-y-3">
          {rankings.map((r, i) => (
            <div key={r.id} className={`p-5 rounded-2xl border flex items-center gap-5 transition-all ${
              i === 0 ? 'bg-gold/[0.06] border-gold/20' : i === 1 ? 'bg-white/[0.035] border-white/[0.08]' : i === 2 ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-white/[0.025] border-white/[0.06]'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[16px] shrink-0 ${
                i === 0 ? 'bg-gold text-dark' : i === 1 ? 'bg-white/10 text-white/60' : i === 2 ? 'bg-amber-800/30 text-amber-500' : 'bg-white/[0.04] text-white/25'
              }`}>
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold text-[18px] font-bold shrink-0">
                {r.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[16px] flex items-center gap-2">
                  {r.name}
                  {i < 3 && <span className="text-[14px]">{['🥇','🥈','🥉'][i]}</span>}
                </div>
                <div className="text-[12px] text-white/30 mt-0.5">
                  {r.total_faces} faces · {r.total_sales} sales
                  {r.avg_rating > 0 && <span className="text-gold ml-2">★ {r.avg_rating.toFixed(1)}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-gold font-extrabold text-[20px]">${r.total_earned.toFixed(0)}</div>
                <div className="text-white/20 text-[11px]">earned</div>
              </div>
            </div>
          ))}
          {rankings.length === 0 && (
            <div className="text-center py-16 text-white/20">No providers yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
