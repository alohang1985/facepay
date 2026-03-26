import { useState, useEffect } from 'react';
import { licenses as licApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function MyLicensesPage() {
  const [tab, setTab] = useState('all');
  const [myLicenses, setMyLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => { licApi.my().then(setMyLicenses).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleRenew = async (id, months) => {
    try {
      const result = await licApi.renew(id, months);
      toast.success(`License renewed! +${months} months ($${result.renewal_price.toFixed(2)})`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = tab === 'all' ? myLicenses : myLicenses.filter((l) => l.status === tab);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Licenses</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">My Licenses</h1>
        </div>

        <div className="flex gap-1 mb-8 bg-white/[0.03] p-1 rounded-xl w-fit">
          {[{k:'all',l:'All'},{k:'active',l:'Active'},{k:'expired',l:'Expired'},{k:'revoked',l:'Revoked'}].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-5 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 tracking-wide ${
                tab === t.k ? 'text-gold bg-gold/[0.1]' : 'text-white/30 bg-transparent hover:text-white/50'
              }`}>{t.l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-white/25 text-[15px]">No licenses found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lic) => (
              <div key={lic.id} className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                <div className="flex gap-5 items-start">
                  {lic.face_photo && <img src={lic.face_photo} alt="" className="w-[72px] h-[72px] rounded-xl object-cover shrink-0 ring-1 ring-white/[0.06]" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-[17px]">{lic.face_name || 'Face'}</h3>
                        <div className="text-[13px] text-white/30 mt-1">{lic.usage_purpose}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                        lic.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                        lic.status === 'expired' ? 'bg-danger/10 text-danger border-danger/15' :
                        lic.status === 'revoked' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' :
                        'bg-white/5 text-white/30 border-white/10'
                      }`}>{lic.status}</span>
                    </div>
                    <div className="text-[12px] text-white/20 space-y-0.5 mb-3">
                      <div>{lic.license_type} license · {lic.duration_months} months · <span className="text-gold font-semibold">${lic.price_paid}</span></div>
                      <div>Expires: {new Date(lic.expires_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {(lic.status === 'expired' || lic.status === 'active') && [3, 6, 12].map((m) => (
                        <button key={m} onClick={() => handleRenew(lic.id, m)}
                          className="px-3.5 py-1.5 rounded-lg bg-transparent border border-gold/20 text-gold text-[11px] font-semibold cursor-pointer hover:bg-gold/10 transition-all">
                          {lic.status === 'expired' ? 'Renew' : 'Extend'} {m}mo
                        </button>
                      ))}
                      <a href={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/^(?!http)/, 'https://')}/licenses/${lic.id}/pdf`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-transparent border border-blue-400/20 text-blue-400 text-[11px] font-semibold cursor-pointer hover:bg-blue-400/10 transition-all no-underline inline-flex items-center gap-1">
                        📄 PDF Certificate
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
