import { useState } from 'react';
import { Link } from 'react-router-dom';
import { advanced } from '../services/api';

export default function FaceValuePage() {
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [age, setAge] = useState(25);
  const [style, setStyle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const estimate = async () => {
    setLoading(true);
    try {
      const r = await advanced.estimateValue({ gender, ethnicity, age, style });
      setResult(r);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[800px] mx-auto px-6 lg:px-10 py-14">
        <div className="text-center mb-12">
          <div className="text-[60px] mb-4">💰</div>
          <h1 className="text-[42px] font-extrabold tracking-[-2px] mb-3">How Much Is Your Face Worth?</h1>
          <p className="text-white/30 text-[16px]">Find out the market value of your face in the AI licensing economy</p>
        </div>

        {/* Input Form */}
        <div className="p-8 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-8">
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30">
                <option value="">Select</option>
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Ethnicity</label>
              <select value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30">
                <option value="">Select</option>
                <option>Korean</option><option>Japanese</option><option>Asian</option><option>Caucasian</option><option>Latino</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value))} min={18} max={80}
                className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white outline-none focus:border-gold/30">
                <option value="">Select</option>
                <option>Casual</option><option>Business</option><option>Professional</option><option>Elegant</option><option>Street</option><option>Fitness</option>
              </select>
            </div>
          </div>
          <button onClick={estimate} disabled={loading}
            className="w-full py-4 rounded-full bg-gold text-dark font-bold text-[14px] tracking-wide cursor-pointer hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] transition-all border-none disabled:opacity-50">
            {loading ? 'Calculating...' : '✨ Estimate My Face Value'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Main Value */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/[0.1] to-gold/[0.02] border border-gold/25 text-center">
              <div className="text-[11px] uppercase tracking-[3px] text-gold/60 font-semibold mb-3">Estimated Market Value</div>
              <div className="text-[64px] font-black text-gold tracking-[-3px] leading-none">${result.estimated_price}</div>
              <div className="text-white/25 text-[14px] mt-2">per license</div>
              <div className="text-white/15 text-[12px] mt-1">(Range: ${result.price_range.low} — ${result.price_range.high})</div>
            </div>

            {/* Potential Earnings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15 text-center">
                <div className="text-[10px] uppercase tracking-[2px] text-emerald-400/60 mb-2 font-semibold">Monthly Potential</div>
                <div className="text-[32px] font-black text-emerald-400">${result.monthly_potential}</div>
              </div>
              <div className="p-6 rounded-2xl bg-blue-500/[0.04] border border-blue-500/15 text-center">
                <div className="text-[10px] uppercase tracking-[2px] text-blue-400/60 mb-2 font-semibold">Yearly Potential</div>
                <div className="text-[32px] font-black text-blue-400">${result.yearly_potential}</div>
              </div>
            </div>

            {/* Factors */}
            {result.factors.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-4 font-semibold">Value Factors</div>
                {result.factors.map((f, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-[13px] text-white/45">{f.factor}</span>
                    <span className="text-emerald-400 font-bold text-[13px]">{f.modifier}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-4">
              <Link to="/register-face" className="flex-1 py-4 rounded-full bg-gold text-dark font-bold text-[14px] text-center no-underline hover:bg-gold-light transition-all">
                Register Your Face
              </Link>
              <button onClick={() => {
                const text = `My face is worth $${result.estimated_price}/license on FacePay! Monthly potential: $${result.monthly_potential} 💰`;
                navigator.share?.({ title: 'FacePay Face Value', text, url: 'https://facepay-sigma.vercel.app/face-value' }).catch(() => {
                  navigator.clipboard?.writeText(text);
                });
              }} className="flex-1 py-4 rounded-full border border-white/10 text-white/50 font-bold text-[14px] cursor-pointer hover:border-gold/25 hover:text-gold transition-all bg-transparent">
                📤 Share Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
