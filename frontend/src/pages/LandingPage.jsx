import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { faces as localFaces } from '../data/faces';
import { faces as facesApi } from '../services/api';
import FaceCard from '../components/common/FaceCard';

export default function LandingPage() {
  const [faces, setFaces] = useState(localFaces);

  useEffect(() => {
    facesApi.list({ limit: 12 })
      .then((data) => { if (data.faces?.length) setFaces(data.faces); })
      .catch(() => {}); // fallback to local data
  }, []);
  return (
    <>
      {/* Hero - Full Screen */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* BG Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1920&h=1080&fit=crop"
            alt="" className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/85 to-dark/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/50" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 w-full pt-32 pb-24">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-gold/90 text-[11px] font-semibold tracking-[1.5px] uppercase">AI Face Licensing Platform</span>
            </div>

            <h1 className="text-[clamp(40px,5.5vw,64px)] font-extrabold leading-[1.05] tracking-[-2.5px] text-white mb-6">
              License Real Faces.<br/>
              <span className="text-gold">Use Them Legally.</span>
            </h1>

            <p className="text-[17px] text-white/45 leading-[1.7] mb-12 max-w-[480px]">
              A consent-based marketplace connecting face providers with businesses. Protected, verified, premium.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/marketplace" className="px-9 py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide no-underline hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] transition-all duration-300">
                Explore Faces
              </Link>
              <Link to="/login" className="px-9 py-4 rounded-full border border-white/15 text-white/70 font-medium text-[13px] tracking-wide no-underline hover:border-white/30 hover:text-white transition-all duration-300">
                Start as Provider
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-12 mt-20 pt-10 border-t border-white/[0.06]">
              {[
                { num: '2,847', label: 'Licensed Faces' },
                { num: '$1.2M', label: 'Paid to Providers' },
                { num: '98%', label: 'Dispute-Free' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[32px] font-extrabold text-white tracking-tight">{s.num}</div>
                  <div className="text-[11px] text-white/25 mt-1 uppercase tracking-[2px] font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/15">
          <div className="w-[1px] h-10 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* Featured Faces */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-28">
        <div className="flex justify-between items-end mb-14">
          <div>
            <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Featured</div>
            <h2 className="text-[38px] font-extrabold tracking-[-1.5px]">Curated Faces</h2>
          </div>
          <Link to="/marketplace" className="text-[13px] text-text-muted no-underline hover:text-gold transition-colors duration-200 flex items-center gap-2 group">
            View All <span className="text-lg group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          {faces.slice(0, 4).map((face) => (
            <FaceCard key={face.id} face={face} large />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-28">
          <div className="text-center mb-20">
            <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Process</div>
            <h2 className="text-[38px] font-extrabold tracking-[-1.5px]">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Upload & Verify', desc: 'Submit your photos and complete identity verification. Our AI creates a secure biometric profile.' },
              { num: '02', title: 'Set Your Terms', desc: 'Define pricing, usage rights, and restrictions. You maintain complete control over your face data.' },
              { num: '03', title: 'Earn Royalties', desc: 'Businesses license your face legally. Get paid automatically with transparent, real-time tracking.' },
            ].map((step) => (
              <div key={step.num} className="group p-8 lg:p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-500">
                <div className="text-gold/20 text-[56px] font-black mb-6 tracking-[-3px] group-hover:text-gold/40 transition-colors duration-500">{step.num}</div>
                <h3 className="text-[19px] font-bold mb-3 tracking-[-0.3px]">{step.title}</h3>
                <p className="text-[14px] text-text-secondary leading-[1.8]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Large showcase */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faces.slice(4, 6).map((face) => (
            <Link key={face.id} to={`/face/${face.id}`} className="group relative aspect-[16/9] rounded-2xl overflow-hidden no-underline">
              <img src={face.photo_url || face.photo} alt={face.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 flex justify-between items-end">
                <div>
                  <h3 className="text-white text-[24px] font-bold tracking-[-0.5px]">{face.name}</h3>
                  <p className="text-white/35 text-[13px] mt-1">{face.tags}</p>
                </div>
                <div className="text-gold text-[22px] font-bold">${face.price}<span className="text-[12px] text-white/25 font-normal ml-1">/license</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-28 text-center">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Get Started</div>
          <h2 className="text-[42px] font-extrabold tracking-[-1.5px] mb-5">Ready to license?</h2>
          <p className="text-text-secondary text-[16px] mb-12 max-w-[420px] mx-auto leading-[1.7]">
            Join the premium face licensing marketplace. Early providers receive reduced fees.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/login" className="px-9 py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide no-underline hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] transition-all duration-300">
              Register Your Face
            </Link>
            <Link to="/marketplace" className="px-9 py-4 rounded-full border border-white/15 text-white/60 font-medium text-[13px] tracking-wide no-underline hover:border-gold/30 hover:text-gold transition-all duration-300">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
