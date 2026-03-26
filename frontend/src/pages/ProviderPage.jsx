import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { provider as providerApi } from '../services/api';
import FaceCard from '../components/common/FaceCard';

export default function ProviderPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerApi.profile(id).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;
  if (!data) return <div className="min-h-screen pt-[64px] flex items-center justify-center text-white/30">Provider not found</div>;

  const { provider: p, faces, stats } = data;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-14">
        {/* Provider Header */}
        <div className="flex items-center gap-6 mb-12 p-8 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          <div className="w-24 h-24 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[36px] font-bold shrink-0">
            {p.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-[28px] font-extrabold tracking-[-1px]">{p.name}</h1>
            <p className="text-white/30 text-[13px] mt-1">Member since {new Date(p.created_at).toLocaleDateString()}</p>
            <div className="flex gap-6 mt-4">
              {[
                { label: 'Faces', value: stats.total_faces },
                { label: 'Sales', value: stats.total_sales },
                { label: 'Earned', value: `$${stats.total_earned}` },
                { label: 'Rating', value: stats.avg_rating > 0 ? `★ ${stats.avg_rating}` : '—' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[20px] font-bold text-gold">{s.value}</div>
                  <div className="text-[11px] text-white/25 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Faces Grid */}
        <div className="mb-6">
          <h2 className="text-[22px] font-bold tracking-[-0.5px] mb-6">Faces by {p.name}</h2>
        </div>

        {faces.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-white/20">No faces yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {faces.map((face) => <FaceCard key={face.id} face={face} />)}
          </div>
        )}
      </div>
    </div>
  );
}
