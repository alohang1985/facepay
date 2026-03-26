import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moodboards as mbApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function MoodboardsPage() {
  const toast = useToast();
  const [boards, setBoards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => { mbApi.list().then((d) => setBoards(d.moodboards || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const loadBoard = async (id) => {
    const d = await mbApi.get(id);
    setSelected(d.moodboard);
    setItems(d.items || []);
  };

  const handleCreate = async () => {
    if (!newName) return;
    setCreating(true);
    try {
      await mbApi.create({ name: newName });
      toast.success('Moodboard created!');
      setNewName('');
      load();
    } catch (e) { toast.error(e.message); }
    setCreating(false);
  };

  const handleRemoveFace = async (boardId, faceId) => {
    await mbApi.removeFace(boardId, faceId);
    toast.info('Removed');
    loadBoard(boardId);
  };

  const handleDelete = async (id) => {
    await mbApi.delete(id);
    toast.success('Moodboard deleted');
    setSelected(null);
    load();
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Collections</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Moodboards</h1>
          <p className="text-white/30 text-[14px] mt-2">Organize faces by project. Share with your team.</p>
        </div>

        {/* Create */}
        <div className="flex gap-3 mb-8">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New board name (e.g. Summer Campaign)"
            className="flex-1 py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
          <button onClick={handleCreate} disabled={creating}
            className="px-6 py-3 rounded-xl bg-gold text-dark font-bold text-[13px] border-none cursor-pointer hover:bg-gold-light transition-all disabled:opacity-50">
            + Create Board
          </button>
        </div>

        <div className="flex gap-8">
          {/* Board list */}
          <div className="w-[280px] shrink-0 space-y-2">
            {boards.map((b) => (
              <button key={b.id} onClick={() => loadBoard(b.id)}
                className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all ${
                  selected?.id === b.id ? 'bg-gold/[0.06] border-gold/25' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                }`}>
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-[14px]">{b.name}</div>
                  <span className="text-[11px] text-white/25 bg-white/[0.04] px-2 py-0.5 rounded-full">{b.item_count}</span>
                </div>
                <div className="text-[11px] text-white/20 mt-1">{new Date(b.created_at).toLocaleDateString()}</div>
              </button>
            ))}
            {boards.length === 0 && <div className="text-center py-8 text-white/15 text-[13px]">No boards yet</div>}
          </div>

          {/* Board content */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                <div className="text-[48px] mb-4">📋</div>
                <p className="text-white/25 text-[15px]">Select a moodboard to view faces</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[22px] font-bold">{selected.name}</h2>
                  <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 rounded-lg border border-danger/20 text-danger text-[11px] font-semibold bg-transparent cursor-pointer hover:bg-danger/10 transition-all">Delete Board</button>
                </div>
                {items.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <p className="text-white/20 mb-4">This board is empty</p>
                    <Link to="/marketplace" className="inline-block px-5 py-2.5 rounded-full bg-gold text-dark text-[13px] font-bold no-underline">Browse Faces to Add</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="group relative rounded-xl overflow-hidden">
                        <Link to={`/face/${item.face_id}`} className="block no-underline">
                          <img src={item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}
                            alt={item.name} className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-2">
                            <div className="text-white text-[13px] font-bold">{item.name}</div>
                            <div className="text-gold text-[12px]">${item.price}</div>
                          </div>
                        </Link>
                        <button onClick={() => handleRemoveFace(selected.id, item.face_id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/40 flex items-center justify-center text-[12px] cursor-pointer opacity-0 group-hover:opacity-100 transition-all hover:text-danger border-none">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
