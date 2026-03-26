import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-dark">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <div className="flex justify-between items-start mb-14 flex-wrap gap-10">
          <div>
            <Link to="/" className="text-[24px] font-bold text-text-primary no-underline tracking-[-1px]">
              face<span className="text-gold">pay</span>
            </Link>
            <p className="text-white/25 text-[13px] mt-3 max-w-[280px] leading-relaxed">
              The premium marketplace for AI face licensing. Consent-based, legally protected.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <div className="text-[10px] uppercase tracking-[3px] text-white/20 mb-5 font-semibold">Platform</div>
              <div className="space-y-3">
                {['Marketplace', 'Pricing', 'For Providers', 'API'].map((l) => (
                  <a key={l} href="#" className="block text-[13px] text-white/35 no-underline hover:text-gold transition-colors duration-200">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[3px] text-white/20 mb-5 font-semibold">Legal</div>
              <div className="space-y-3">
                {['Terms', 'Privacy', 'License Policy', 'Contact'].map((l) => (
                  <a key={l} href="#" className="block text-[13px] text-white/35 no-underline hover:text-gold transition-colors duration-200">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.04] pt-6 flex justify-between items-center flex-wrap gap-4">
          <p className="text-[12px] text-white/15">&copy; 2026 FacePay. All rights reserved.</p>
          <div className="flex gap-5 text-white/20 text-[12px]">
            <span className="hover:text-gold cursor-pointer transition-colors duration-200">Twitter</span>
            <span className="hover:text-gold cursor-pointer transition-colors duration-200">LinkedIn</span>
            <span className="hover:text-gold cursor-pointer transition-colors duration-200">Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
