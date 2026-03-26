import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function LoginPage() {
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await login({ email, password });
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        await register({ name, email, password });
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-[64px]">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <Link to="/" className="text-[26px] font-bold text-text-primary no-underline tracking-[-1px] inline-block">
            face<span className="text-gold">pay</span>
          </Link>
          <p className="text-white/30 text-[14px] mt-3">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
          {!isLogin && (
            <div className="mb-5">
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2.5 block font-semibold">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors duration-200 placeholder:text-white/20" type="text" placeholder="Your name" />
            </div>
          )}

          <div className="mb-5">
            <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2.5 block font-semibold">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors duration-200 placeholder:text-white/20" type="email" placeholder="you@example.com" />
          </div>

          <div className="mb-5">
            <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2.5 block font-semibold">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors duration-200 placeholder:text-white/20" type="password" placeholder="••••••••" />
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px]">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide cursor-pointer hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,110,0.2)] transition-all duration-300 border-none disabled:opacity-50">
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {isLogin && (
            <div className="text-right mt-3">
              <Link to="/forgot-password" className="text-[12px] text-white/25 no-underline hover:text-gold transition-colors">Forgot password?</Link>
            </div>
          )}

          {/* Quick login hint */}
          <div className="mt-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/20 space-y-1">
            <div>Admin: <span className="text-white/40">admin@facepay.com / admin123</span></div>
            <div>Buyer: <span className="text-white/40">sarah@example.com / test123</span></div>
          </div>

          <div className="text-center mt-5 text-[13px] text-white/30">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gold bg-transparent border-none cursor-pointer text-[13px] font-semibold hover:text-gold-light transition-colors duration-200">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
