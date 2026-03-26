import { useState, useEffect } from 'react';
import { admin } from '../services/api';

const TABS = ['Overview', 'Users', 'Faces', 'Licenses'];

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [faces, setFaces] = useState([]);
  const [allLicenses, setAllLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, f, l] = await Promise.all([
        admin.stats(), admin.users(), admin.faces(), admin.licenses(),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setFaces(f.faces || []);
      setAllLicenses(l.licenses || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleVerify = async (id) => { await admin.verifyFace(id); flash('Face verified'); loadData(); };
  const handleReject = async (id) => { await admin.rejectFace(id); flash('Face rejected'); loadData(); };
  const handleRevoke = async (id) => { await admin.revokeLicense(id); flash('License revoked'); loadData(); };
  const handleRoleChange = async (id, role) => { await admin.updateRole(id, role); flash('Role updated'); loadData(); };
  const handleDeleteUser = async (id) => { if (confirm('Delete this user?')) { await admin.deleteUser(id); flash('User deleted'); loadData(); }};

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-danger font-semibold mb-2">Admin Panel</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Administration</h1>
        </div>

        {msg && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] font-medium">{msg}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-10 bg-white/[0.03] p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all tracking-wide ${
                tab === t ? 'text-gold bg-gold/[0.1]' : 'text-white/30 bg-transparent hover:text-white/50'
              }`}>{t}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'Overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total_users, color: 'text-blue-400' },
              { label: 'Total Faces', value: stats.total_faces, sub: `${stats.pending_faces} pending`, color: 'text-purple-400' },
              { label: 'Total Licenses', value: stats.total_licenses, sub: `${stats.active_licenses} active`, color: 'text-emerald-400' },
              { label: 'Total Revenue', value: `$${stats.total_revenue.toFixed(2)}`, color: 'text-gold' },
            ].map((s) => (
              <div key={s.label} className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="text-[11px] text-white/25 uppercase tracking-[2px] mb-4 font-semibold">{s.label}</div>
                <div className={`text-[30px] font-extrabold tracking-[-1px] ${s.color}`}>{s.value}</div>
                {s.sub && <div className="text-[12px] text-white/20 mt-1">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'Users' && (
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Role</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Joined</th>
                  <th className="text-right p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-white/40">{u.email}</td>
                    <td className="p-4">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[12px] text-white/60 outline-none cursor-pointer">
                        <option value="buyer">buyer</option>
                        <option value="provider">provider</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-white/30 text-[12px]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1.5 rounded-lg bg-transparent border border-danger/20 text-danger text-[11px] font-semibold cursor-pointer hover:bg-danger/10 transition-all">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Faces */}
        {tab === 'Faces' && (
          <div className="space-y-3">
            {faces.map((f) => (
              <div key={f.id} className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex items-center gap-5">
                <img src={f.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-white/[0.06]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-[15px]">{f.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{f.verified ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="text-[12px] text-white/25">{f.tags} · ${f.price} · by {f.owner_name || 'Unknown'}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!f.verified && (
                    <button onClick={() => handleVerify(f.id)} className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-semibold cursor-pointer hover:bg-emerald-500/20 transition-all">Approve</button>
                  )}
                  <button onClick={() => handleReject(f.id)} className="px-4 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-[12px] font-semibold cursor-pointer hover:bg-danger/20 transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Licenses */}
        {tab === 'Licenses' && (
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Face</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Buyer</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Price</th>
                  <th className="text-left p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 text-white/30 font-semibold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLicenses.map((l) => (
                  <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium">{l.face_name || '—'}</td>
                    <td className="p-4 text-white/40">{l.buyer_name || '—'}</td>
                    <td className="p-4 text-white/40">{l.license_type}</td>
                    <td className="p-4 text-gold font-semibold">${l.price_paid}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                        l.status === 'revoked' ? 'bg-danger/10 text-danger' :
                        'bg-white/5 text-white/30'
                      }`}>{l.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      {l.status === 'active' && (
                        <button onClick={() => handleRevoke(l.id)} className="px-3 py-1.5 rounded-lg bg-transparent border border-danger/20 text-danger text-[11px] font-semibold cursor-pointer hover:bg-danger/10 transition-all">Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
