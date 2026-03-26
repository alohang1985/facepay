import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlist as wishApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function WishlistPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    wishApi.list().then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleRemove = async (faceId, name) => {
    try {
      await wishApi.remove(faceId);
      toast.info(`Removed "${name}" from wishlist`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Saved</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">My Wishlist</h1>
          <p className="text-white/30 text-[14px] mt-2">{items.length} saved faces</p>
        </div>

        {items.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <div className="text-[48px] mb-4">💝</div>
            <p className="text-white/30 text-[16px] mb-2">Your wishlist is empty</p>
            <p className="text-white/15 text-[13px] mb-6">Browse faces and save your favorites</p>
            <Link to="/marketplace" className="inline-block px-6 py-3 rounded-full bg-gold text-dark text-[13px] font-bold no-underline hover:bg-gold-light transition-all">Browse Faces</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.wishlist_id} className="group relative overflow-hidden rounded-2xl">
                <Link to={`/face/${item.id}`} className="block no-underline">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face'}
                      alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-[17px] truncate">{item.name}</h3>
                      <p className="text-white/40 text-[12px] mt-1 truncate">{item.tags}</p>
                      <div className="text-gold font-bold text-[18px] mt-2">${item.price}</div>
                    </div>
                  </div>
                </Link>
                <button onClick={() => handleRemove(item.id, item.name)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-danger cursor-pointer hover:bg-danger/20 transition-all text-[16px]">
                  ♥
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
