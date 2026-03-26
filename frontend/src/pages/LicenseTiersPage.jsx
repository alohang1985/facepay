import { useState, useEffect } from 'react';
import { auctions } from '../services/api';

const categoryColors = {
  personal: 'text-blue-400',
  business: 'text-emerald-400',
  ai: 'text-purple-400',
  restricted: 'text-danger',
  exclusive: 'text-gold',
};

const categoryBg = {
  personal: 'bg-blue-500/5 border-blue-500/10',
  business: 'bg-emerald-500/5 border-emerald-500/10',
  ai: 'bg-purple-500/5 border-purple-500/10',
  restricted: 'bg-danger/5 border-danger/10',
  exclusive: 'bg-gold/5 border-gold/10',
};

export default function LicenseTiersPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auctions.tiers().then((d) => setTiers(d.tiers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  const grouped = {};
  tiers.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Licensing</div>
          <h1 className="text-[42px] font-extrabold tracking-[-1.5px] mb-4">License Types</h1>
          <p className="text-white/30 text-[16px] max-w-[500px] mx-auto">Choose the right license for your needs. Prices shown as multipliers of the face's base price.</p>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-10">
            <h2 className={`text-[16px] font-bold uppercase tracking-wider mb-5 ${categoryColors[category] || 'text-white/40'}`}>
              {category === 'personal' ? '👤 Personal' : category === 'business' ? '🏢 Business' : category === 'ai' ? '🤖 AI' : category === 'restricted' ? '🔞 Restricted' : '👑 Exclusive'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((tier) => (
                <div key={tier.id} className={`p-6 rounded-2xl border ${categoryBg[category] || 'bg-white/[0.02] border-white/[0.06]'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-[17px]">{tier.name}</h3>
                    <span className="text-gold font-extrabold text-[20px]">{tier.base_multiplier}x</span>
                  </div>
                  <p className="text-white/35 text-[13px] mb-5">{tier.description}</p>

                  <div className="space-y-2">
                    {[
                      ['Commercial Use', tier.allows_commercial],
                      ['AI Synthesis', tier.allows_ai_synthesis],
                      ['Adult Content', tier.allows_adult],
                      ['Print/Package', tier.allows_print],
                      ['Broadcast/TV', tier.allows_broadcast],
                    ].map(([label, allowed]) => (
                      <div key={label} className="flex items-center gap-2 text-[12px]">
                        {allowed ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-white/15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                        <span className={allowed ? 'text-white/50' : 'text-white/15'}>{label}</span>
                      </div>
                    ))}
                    {tier.max_impressions > 0 && (
                      <div className="text-[11px] text-white/25 mt-2">Max {tier.max_impressions.toLocaleString()} impressions</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-white/30 text-[14px] mb-2">Example: Face base price $30</p>
          <div className="flex gap-4 justify-center flex-wrap mt-4 text-[13px]">
            <span className="text-blue-400">Personal SNS: $30</span>
            <span className="text-emerald-400">Commercial Web: $90</span>
            <span className="text-purple-400">AI Synthesis: $240</span>
            <span className="text-gold">Full Buyout: $750</span>
          </div>
        </div>
      </div>
    </div>
  );
}
