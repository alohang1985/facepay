import { useState, useEffect } from 'react';
import { dashboard, licenses as licApi } from '../services/api';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboard.earnings().catch(() => ({ total: 0, by_purpose: {}, recent: [] })),
      licApi.provided().catch(() => []),
    ]).then(([e, s]) => { setEarnings(e); setSales(s); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  const purposes = Object.entries(earnings?.by_purpose || {}).sort((a, b) => b[1] - a[1]);
  const maxPurpose = purposes[0]?.[1] || 1;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Provider</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Earnings Dashboard</h1>
        </div>

        {/* Total Earnings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-gold/[0.08] to-gold/[0.02] border border-gold/20">
            <div className="text-[11px] uppercase tracking-[2px] text-gold/60 mb-3 font-semibold">Total Earnings</div>
            <div className="text-[36px] font-black text-gold tracking-[-1px]">${(earnings?.total || 0).toFixed(2)}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-3 font-semibold">Total Sales</div>
            <div className="text-[36px] font-black text-emerald-400 tracking-[-1px]">{sales.length}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-3 font-semibold">Avg per Sale</div>
            <div className="text-[36px] font-black text-blue-400 tracking-[-1px]">
              ${sales.length ? ((earnings?.total || 0) / sales.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Earnings by Purpose */}
        {purposes.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-10">
            <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-6 font-semibold">Revenue by Usage Purpose</div>
            <div className="space-y-4">
              {purposes.map(([purpose, amount]) => (
                <div key={purpose}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] text-white/50">{purpose}</span>
                    <span className="text-[13px] text-gold font-semibold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-500" style={{ width: `${(amount / maxPurpose) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-6 font-semibold">Recent Sales</div>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-[14px]">No sales yet</div>
          ) : (
            <div className="space-y-3">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                  {s.face_photo && <img src={s.face_photo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{s.face_name || 'Face'}</div>
                    <div className="text-[12px] text-white/25">{s.usage_purpose} · {s.license_type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-gold font-bold">${s.price_paid}</div>
                    <div className="text-[11px] text-white/20">{new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
