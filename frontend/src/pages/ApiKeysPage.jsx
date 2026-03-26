import { useState, useEffect } from 'react';
import { apiKeys } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function ApiKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => { apiKeys.list().then((d) => setKeys(d.keys || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await apiKeys.create({ name: keyName || 'Default', permissions: 'read' });
      setNewKey(result.api_key);
      toast.success('API key created!');
      setKeyName('');
      load();
    } catch (e) { toast.error(e.message); }
    setCreating(false);
  };

  const handleDelete = async (id) => {
    await apiKeys.delete(id);
    toast.success('API key deleted');
    load();
  };

  const handleToggle = async (id) => {
    await apiKeys.toggle(id);
    toast.info('Key status toggled');
    load();
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Developer</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">API Keys</h1>
          <p className="text-white/30 text-[14px] mt-2">Manage API keys for B2B integrations</p>
        </div>

        {/* Create new key */}
        <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-6">
          <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-4 font-semibold">Create New Key</div>
          <div className="flex gap-3">
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. Production)"
              className="flex-1 py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
            <button onClick={handleCreate} disabled={creating}
              className="px-6 py-3 rounded-xl bg-gold text-dark font-bold text-[13px] border-none cursor-pointer hover:bg-gold-light transition-all disabled:opacity-50">
              {creating ? 'Creating...' : 'Generate Key'}
            </button>
          </div>

          {newKey && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-emerald-400 text-[12px] font-semibold mb-2">🔑 Your new API key (copy it now — shown only once):</div>
              <code className="text-emerald-300 text-[13px] font-mono break-all select-all">{newKey}</code>
            </div>
          )}
        </div>

        {/* API Docs hint */}
        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-6">
          <div className="text-blue-400 text-[13px] font-semibold mb-2">📖 API Usage</div>
          <code className="text-[12px] text-white/40 font-mono block">
            curl -H "Authorization: Bearer YOUR_API_KEY" \<br/>
            &nbsp;&nbsp;https://facepay-production-85f0.up.railway.app/api/faces
          </code>
        </div>

        {/* Existing keys */}
        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-white/20">No API keys yet</div>
          ) : keys.map((k) => (
            <div key={k.id} className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${k.active ? 'bg-emerald-400' : 'bg-white/15'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">{k.name}</div>
                <div className="text-[11px] text-white/25 mt-0.5">
                  Created {new Date(k.created_at).toLocaleDateString()} · {k.calls_total} total calls · {k.permissions}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleToggle(k.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-all ${
                    k.active ? 'border-amber-400/20 text-amber-400 bg-transparent hover:bg-amber-400/10' : 'border-emerald-400/20 text-emerald-400 bg-transparent hover:bg-emerald-400/10'
                  }`}>{k.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleDelete(k.id)}
                  className="px-3 py-1.5 rounded-lg bg-transparent border border-danger/20 text-danger text-[11px] font-semibold cursor-pointer hover:bg-danger/10 transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
