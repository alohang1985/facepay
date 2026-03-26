import { useState, useEffect } from 'react';
import { protection, faces as facesApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function ProtectionPage() {
  const toast = useToast();
  const [tab, setTab] = useState('scans');
  const [scans, setScans] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [myFaces, setMyFaces] = useState([]);
  const [scanUrl, setScanUrl] = useState('');
  const [scanFace, setScanFace] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sc, di, mf] = await Promise.all([
        protection.myScans().catch(() => ({ scans: [] })),
        protection.myDisputes().catch(() => ({ disputes: [] })),
        facesApi.myFaces().catch(() => ({ faces: [] })),
      ]);
      setScans(sc.scans || []);
      setDisputes(di.disputes || []);
      setMyFaces(mf.faces || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    if (!scanFace) { toast.error('Select a face to scan'); return; }
    try {
      await protection.scan({ face_id: scanFace, source_url: scanUrl });
      toast.success('Scan initiated!');
      setScanUrl('');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleConfirm = async (scanId, confirmed) => {
    try {
      const res = await protection.confirmScan(scanId, confirmed);
      toast.success(res.message);
      if (confirmed) {
        const dmca = await protection.dmca(scanId);
        toast.info('DMCA takedown generated');
      }
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-danger font-semibold mb-2">Protection</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Face Protection Center</h1>
          <p className="text-white/30 text-[14px] mt-2">Monitor and protect your face from unauthorized use</p>
        </div>

        {/* Scan Form */}
        <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-8">
          <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-4 font-semibold">🔍 New Misuse Scan</div>
          <div className="flex gap-3 flex-wrap">
            <select value={scanFace} onChange={(e) => setScanFace(e.target.value)}
              className="flex-1 min-w-[200px] py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30">
              <option value="">Select your face...</option>
              {myFaces.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input value={scanUrl} onChange={(e) => setScanUrl(e.target.value)} placeholder="Suspicious URL (optional)"
              className="flex-1 min-w-[200px] py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
            <button onClick={handleScan}
              className="px-6 py-3 rounded-xl bg-danger text-white font-bold text-[13px] border-none cursor-pointer hover:bg-red-500 transition-all">
              Start Scan
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/[0.03] p-1 rounded-xl w-fit">
          {[{k:'scans',l:`Scans (${scans.length})`},{k:'disputes',l:`Disputes (${disputes.length})`}].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-5 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all tracking-wide ${
                tab === t.k ? 'text-gold bg-gold/[0.1]' : 'text-white/30 bg-transparent hover:text-white/50'
              }`}>{t.l}</button>
          ))}
        </div>

        {/* Scans */}
        {tab === 'scans' && (
          <div className="space-y-3">
            {scans.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-white/20">No scans yet. Start one above!</div>
            ) : scans.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-[15px]">{s.face_name}</span>
                    <span className={`ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      s.status === 'confirmed' ? 'bg-danger/10 text-danger' :
                      s.status === 'dmca_sent' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-white/5 text-white/30'
                    }`}>{s.status}</span>
                  </div>
                  <span className="text-[11px] text-white/20">Stage {s.stage}/3</span>
                </div>
                {s.source_url && <div className="text-[12px] text-white/30 mb-3 truncate">URL: {s.source_url}</div>}

                {s.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleConfirm(s.id, true)}
                      className="px-4 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-[12px] font-semibold cursor-pointer hover:bg-danger/20 transition-all">
                      Yes, this is misuse
                    </button>
                    <button onClick={() => handleConfirm(s.id, false)}
                      className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] cursor-pointer hover:border-white/15 transition-all">
                      Not me, dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Disputes */}
        {tab === 'disputes' && (
          <div className="space-y-3">
            {disputes.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-white/20">No disputes</div>
            ) : disputes.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-[15px]">{d.reporter_name} vs {d.against_name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === 'open' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>{d.status}</span>
                </div>
                <p className="text-[13px] text-white/40">{d.reason}</p>
                {d.admin_notes && <p className="text-[12px] text-blue-400/60 mt-2">Admin: {d.admin_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
