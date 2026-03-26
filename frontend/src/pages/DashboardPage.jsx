import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboard as dashApi, licenses as licApi } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myLicenses, setMyLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashApi.stats().catch(() => null),
      licApi.my().catch(() => []),
    ]).then(([s, l]) => {
      setStats(s);
      setMyLicenses(l.slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  const statCards = stats ? [
    { label: 'Balance', value: `$${stats.balance.toFixed(2)}`, sub: 'Available', color: 'text-emerald-400' },
    { label: 'Active Licenses', value: String(stats.active_licenses), sub: 'In use', color: 'text-blue-400' },
    { label: 'Total Spent', value: `$${stats.total_spent.toFixed(0)}`, sub: 'Lifetime', color: 'text-gold' },
    { label: 'Total Earned', value: `$${stats.total_earned.toFixed(0)}`, sub: 'As provider', color: 'text-purple-400' },
  ] : [
    { label: 'Balance', value: '$0', sub: 'Available', color: 'text-emerald-400' },
    { label: 'Active Licenses', value: '0', sub: 'In use', color: 'text-blue-400' },
    { label: 'Total Spent', value: '$0', sub: 'Lifetime', color: 'text-gold' },
    { label: 'Total Earned', value: '$0', sub: 'As provider', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-12">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Dashboard</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Welcome back, {user?.name || 'User'}</h1>
          <p className="text-white/30 text-[14px] mt-2">Manage your face licenses and track usage.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {statCards.map((s) => (
            <div key={s.label} className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] transition-colors duration-300">
              <div className="text-[11px] text-white/25 uppercase tracking-[2px] mb-4 font-semibold">{s.label}</div>
              <div className={`text-[30px] font-extrabold tracking-[-1px] ${s.color}`}>{s.value}</div>
              <div className="text-[12px] text-white/20 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[22px] font-bold tracking-[-0.5px]">Recent Licenses</h2>
            <Link to="/my-licenses" className="text-[13px] text-white/30 no-underline hover:text-gold transition-colors duration-200 group">View All <span className="group-hover:translate-x-1 inline-block transition-transform">→</span></Link>
          </div>
          {myLicenses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myLicenses.map((lic) => (
                <div key={lic.id} className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                  <div className="flex items-center gap-3.5 mb-4">
                    {lic.face_photo && <img src={lic.face_photo} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/[0.06]" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-[14px] truncate">{lic.face_name || 'Face'}</div>
                      <div className="text-[12px] text-white/30 truncate">{lic.license_type} · ${lic.price_paid}</div>
                    </div>
                  </div>
                  <div className="text-[12px] text-white/25 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      lic.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                      lic.status === 'expired' ? 'bg-danger/10 text-danger border-danger/15' :
                      'bg-white/5 text-white/30 border-white/10'
                    }`}>{lic.status}</span>
                  </div>
                  <Link to="/my-licenses" className="block w-full py-2.5 rounded-full text-[12px] font-semibold text-center border border-gold/20 text-gold bg-transparent no-underline hover:bg-gold/10 transition-all">
                    Manage →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <p className="text-white/25 text-[14px] mb-4">No licenses yet</p>
              <Link to="/marketplace" className="inline-block px-6 py-3 rounded-full bg-gold text-dark text-[13px] font-bold no-underline hover:bg-gold-light transition-all">Browse Faces</Link>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.5px] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Browse Faces', desc: 'Find your next face', to: '/marketplace', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> },
              { label: 'Register Face', desc: 'Become a provider', to: '/register-face', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"/></svg> },
              { label: 'License History', desc: 'View past transactions', to: '/my-licenses', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
            ].map((action) => (
              <Link key={action.label} to={action.to}
                className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] no-underline text-text-primary hover:border-gold/20 hover:bg-gold/[0.03] transition-all duration-300 group flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 group-hover:text-gold group-hover:border-gold/20 transition-all duration-300 shrink-0">{action.icon}</div>
                <div>
                  <div className="font-semibold text-[14px] group-hover:text-gold transition-colors duration-300">{action.label}</div>
                  <div className="text-[12px] text-white/25 mt-1">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
