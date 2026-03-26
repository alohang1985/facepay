import { useState, useEffect } from 'react';
import { advanced } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function ReferralPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    advanced.referralCode().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard?.writeText(data?.share_link || '');
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[700px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-center mb-12">
          <div className="text-[60px] mb-4">🎁</div>
          <h1 className="text-[38px] font-extrabold tracking-[-1.5px] mb-3">Invite Friends, Earn $10</h1>
          <p className="text-white/30 text-[16px]">Both you and your friend get $10 credit when they sign up</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] text-center">
            <div className="text-[28px] font-extrabold text-gold">{data?.total_referred || 0}</div>
            <div className="text-[11px] text-white/25 mt-1">Referred</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] text-center">
            <div className="text-[28px] font-extrabold text-emerald-400">${data?.total_earned || 0}</div>
            <div className="text-[11px] text-white/25 mt-1">Earned</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] text-center">
            <div className="text-[28px] font-extrabold text-blue-400">${data?.reward_per_referral || 10}</div>
            <div className="text-[11px] text-white/25 mt-1">Per Invite</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="p-6 rounded-2xl bg-gold/[0.04] border border-gold/20 mb-8">
          <div className="text-[11px] uppercase tracking-[2px] text-gold/60 mb-3 font-semibold">Your Referral Link</div>
          <div className="flex gap-2">
            <input value={data?.share_link || ''} readOnly
              className="flex-1 py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-gold font-mono outline-none" />
            <button onClick={copyLink}
              className="px-6 py-3 rounded-xl bg-gold text-dark font-bold text-[13px] border-none cursor-pointer hover:bg-gold-light transition-all">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="text-white/20 text-[12px] mt-3">Code: <span className="text-gold font-mono">{data?.code}</span></div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Twitter', icon: '𝕏', color: 'bg-white/[0.04] hover:bg-white/[0.08]', url: `https://twitter.com/intent/tweet?text=Join%20FacePay%20and%20earn%20from%20your%20face!&url=${encodeURIComponent(data?.share_link || '')}` },
            { label: 'WhatsApp', icon: '💬', color: 'bg-emerald-500/10 hover:bg-emerald-500/20', url: `https://wa.me/?text=Join%20FacePay%20and%20earn%20from%20your%20face!%20${encodeURIComponent(data?.share_link || '')}` },
            { label: 'Email', icon: '✉️', color: 'bg-blue-500/10 hover:bg-blue-500/20', url: `mailto:?subject=Join%20FacePay&body=Join%20FacePay%20and%20earn%20from%20your%20face!%20${encodeURIComponent(data?.share_link || '')}` },
          ].map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className={`p-4 rounded-xl border border-white/[0.06] ${s.color} text-center no-underline text-white/60 transition-all`}>
              <div className="text-[24px] mb-1">{s.icon}</div>
              <div className="text-[12px] font-semibold">{s.label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
