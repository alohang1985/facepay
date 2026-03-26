import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen pt-[64px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[120px] font-black text-white/[0.04] leading-none tracking-[-5px]">404</div>
        <h1 className="text-[28px] font-extrabold tracking-[-1px] -mt-8 mb-3">Page Not Found</h1>
        <p className="text-white/30 text-[14px] mb-8 max-w-[360px] mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="px-7 py-3.5 rounded-full bg-gold text-dark font-bold text-[13px] no-underline hover:bg-gold-light transition-all">
            Go Home
          </Link>
          <Link to="/marketplace" className="px-7 py-3.5 rounded-full border border-white/10 text-white/50 font-medium text-[13px] no-underline hover:border-gold/25 hover:text-gold transition-all">
            Browse Faces
          </Link>
        </div>
      </div>
    </div>
  );
}
