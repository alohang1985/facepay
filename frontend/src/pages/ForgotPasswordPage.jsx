import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authExtra } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authExtra.forgotPassword(email);
      if (res.reset_token) {
        setToken(res.reset_token);
        setStep('reset');
        toast.success('Reset token generated');
      }
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authExtra.resetPassword(token, newPw);
      toast.success('Password reset! You can now sign in.');
      setStep('done');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-[64px]">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <Link to="/" className="text-[26px] font-bold text-text-primary no-underline tracking-[-1px] inline-block">face<span className="text-gold">pay</span></Link>
          <p className="text-white/30 text-[14px] mt-3">Reset your password</p>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          {step === 'email' && (
            <form onSubmit={handleRequest}>
              <div className="mb-5">
                <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2.5 block font-semibold">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com"
                  className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/20" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide cursor-pointer hover:bg-gold-light transition-all border-none disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset}>
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px]">
                Reset token generated. In production this would be emailed.
              </div>
              <div className="mb-5">
                <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2.5 block font-semibold">New Password</label>
                <input value={newPw} onChange={(e) => setNewPw(e.target.value)} required type="password" placeholder="••••••••" minLength={6}
                  className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/20" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide cursor-pointer hover:bg-gold-light transition-all border-none disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-emerald-400 text-[48px] mb-3">✓</div>
              <div className="text-[16px] font-bold mb-4">Password Reset!</div>
              <Link to="/login" className="inline-block px-8 py-3.5 rounded-full bg-gold text-dark font-bold text-[13px] no-underline">Sign In</Link>
            </div>
          )}

          <div className="text-center mt-5 text-[13px] text-white/30">
            <Link to="/login" className="text-gold no-underline hover:text-gold-light">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
