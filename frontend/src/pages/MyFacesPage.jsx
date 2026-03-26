import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { faces as facesApi } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function MyFacesPage() {
  const toast = useToast();
  const [myFaces, setMyFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  const load = () => {
    facesApi.myFaces().then((d) => setMyFaces(d.faces || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await facesApi.delete(id);
      toast.success('Face deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const startEdit = (face) => {
    setEditing(face.id);
    setEditData({ name: face.name, price: face.price, tags: face.tags, ethnicity: face.ethnicity, style: face.style, location: face.location });
  };

  const handleSave = async (id) => {
    try {
      await facesApi.update(id, editData);
      toast.success('Face updated');
      setEditing(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-14">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Provider</div>
            <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">My Faces</h1>
            <p className="text-white/30 text-[14px] mt-2">{myFaces.length} faces registered</p>
          </div>
          <Link to="/register-face" className="px-6 py-3 rounded-full bg-gold text-dark font-bold text-[13px] no-underline hover:bg-gold-light transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Register New Face
          </Link>
        </div>

        {myFaces.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <div className="text-[48px] mb-4">📸</div>
            <p className="text-white/30 text-[16px] mb-2">No faces registered yet</p>
            <p className="text-white/15 text-[13px] mb-6">Upload your face to start earning</p>
            <Link to="/register-face" className="inline-block px-6 py-3 rounded-full bg-gold text-dark text-[13px] font-bold no-underline hover:bg-gold-light transition-all">Register Your First Face</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myFaces.map((face) => (
              <div key={face.id} className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                <div className="flex gap-5">
                  <img src={face.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'}
                    alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 ring-1 ring-white/[0.06]" />
                  <div className="flex-1 min-w-0">
                    {editing === face.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input value={editData.name} onChange={(e) => setEditData(d => ({...d, name: e.target.value}))}
                            className="py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30" placeholder="Name" />
                          <input type="number" value={editData.price} onChange={(e) => setEditData(d => ({...d, price: parseFloat(e.target.value)}))}
                            className="py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30" placeholder="Price" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input value={editData.ethnicity} onChange={(e) => setEditData(d => ({...d, ethnicity: e.target.value}))}
                            className="py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30" placeholder="Ethnicity" />
                          <input value={editData.style} onChange={(e) => setEditData(d => ({...d, style: e.target.value}))}
                            className="py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30" placeholder="Style" />
                          <input value={editData.location} onChange={(e) => setEditData(d => ({...d, location: e.target.value}))}
                            className="py-2.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white outline-none focus:border-gold/30" placeholder="Location" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(face.id)} className="px-4 py-2 rounded-lg bg-gold text-dark text-[12px] font-bold cursor-pointer border-none hover:bg-gold-light transition-all">Save</button>
                          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-transparent border border-white/[0.08] text-white/40 text-[12px] cursor-pointer hover:border-white/15 transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="font-bold text-[17px]">{face.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${face.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {face.verified ? 'Verified' : 'Pending Review'}
                          </span>
                        </div>
                        <div className="text-[13px] text-white/30 mb-1">{face.tags} · {face.location}</div>
                        <div className="text-gold font-bold text-[16px] mb-3">${face.price} <span className="text-white/20 text-[11px] font-normal">/license</span></div>
                        {face.face_id_hash && <div className="text-[11px] text-white/15 font-mono mb-3">Face ID: {face.face_id_hash}</div>}
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(face)} className="px-4 py-2 rounded-lg bg-transparent border border-white/[0.08] text-white/40 text-[12px] font-medium cursor-pointer hover:border-gold/25 hover:text-gold transition-all">Edit</button>
                          <button onClick={() => handleDelete(face.id, face.name)} className="px-4 py-2 rounded-lg bg-transparent border border-danger/20 text-danger text-[12px] font-medium cursor-pointer hover:bg-danger/10 transition-all">Delete</button>
                        </div>
                      </>
                    )}
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
