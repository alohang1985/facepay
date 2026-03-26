import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { faces as facesApi } from '../services/api';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(ids.map((id) => facesApi.get(id).catch(() => null)))
      .then((results) => setFaces(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Compare</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Face Comparison</h1>
          <p className="text-white/30 text-[14px] mt-2">Compare faces side by side</p>
        </div>

        {faces.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <div className="text-[48px] mb-4">⚖️</div>
            <p className="text-white/30 text-[16px] mb-2">No faces to compare</p>
            <p className="text-white/15 text-[13px] mb-6">Add faces from the marketplace using the compare button</p>
            <Link to="/marketplace" className="inline-block px-6 py-3 rounded-full bg-gold text-dark text-[13px] font-bold no-underline">Browse Faces</Link>
          </div>
        ) : (
          <div className={`grid gap-6 ${faces.length === 1 ? 'grid-cols-1 max-w-[500px]' : faces.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {faces.map((face) => (
              <div key={face.id} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
                <img src={face.photo_url || face.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face'}
                  alt={face.name} className="w-full aspect-[3/4] object-cover" />
                <div className="p-5">
                  <h3 className="text-[20px] font-bold mb-3">{face.name}</h3>
                  <div className="space-y-2.5 text-[13px]">
                    {[
                      ['Price', `$${face.price}/license`],
                      ['Ethnicity', face.ethnicity],
                      ['Age', face.age],
                      ['Gender', face.gender],
                      ['Style', face.style],
                      ['Location', face.location],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-white/30">{label}</span>
                        <span className="text-white/60 font-medium">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={`/face/${face.id}`} className="block mt-5 w-full py-3 rounded-full bg-gold text-dark text-[13px] font-bold text-center no-underline hover:bg-gold-light transition-all">
                    License Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
