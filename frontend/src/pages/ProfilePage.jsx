import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { auth } from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    auth.me().then((d) => { setProfile(d); setName(d.name); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ name });
      setProfile(updated);
      toast.success('Profile updated!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handlePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await auth.changePassword({ current_password: curPw, new_password: newPw });
      toast.success('Password changed!');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { toast.error(e.message); }
    setPwSaving(false);
  };

  if (!profile) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[700px] mx-auto px-6 lg:px-10 py-14">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Account</div>
          <h1 className="text-[34px] font-extrabold tracking-[-1.5px]">Profile Settings</h1>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-center gap-5 mb-10 p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[28px] font-bold shrink-0">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="text-[18px] font-bold">{profile.name}</div>
            <div className="text-white/30 text-[13px]">{profile.email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded bg-gold/10 text-gold text-[10px] font-bold uppercase">{profile.role}</span>
              <span className="text-white/15 text-[11px]">Since {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Edit Name */}
        <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-5">
          <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-5 font-semibold">Edit Profile</div>
          <div className="mb-4">
            <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors" />
          </div>
          <div className="mb-4">
            <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Email</label>
            <input value={profile.email} disabled
              className="w-full py-3.5 px-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-white/30 text-[14px] cursor-not-allowed" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3.5 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide hover:bg-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-5 font-semibold">Change Password</div>
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Current Password</label>
              <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)}
                className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/15" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/15" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Confirm</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/15" placeholder="••••••••" />
              </div>
            </div>
          </div>
          <button onClick={handlePassword} disabled={pwSaving || !curPw || !newPw}
            className="px-8 py-3.5 rounded-full border border-white/10 text-white/50 font-semibold text-[13px] tracking-wide hover:border-gold/25 hover:text-gold transition-all bg-transparent cursor-pointer disabled:opacity-30">
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
