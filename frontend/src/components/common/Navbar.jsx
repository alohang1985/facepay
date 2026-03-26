import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/marketplace', label: 'Explore' },
    { to: '/register-face', label: 'Register' },
    { to: '/my-licenses', label: 'Licenses' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin' });
  }

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLink = (l) => (
    <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
      className={`text-[12px] tracking-[1.5px] uppercase no-underline transition-colors duration-200 ${
        pathname === l.to || (l.to === '/admin' && pathname.startsWith('/admin'))
          ? 'text-gold font-semibold'
          : 'text-white/40 hover:text-white/70'
      }`}>
      {l.label}
    </Link>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[64px] flex items-center justify-between">
          <Link to="/" className="text-[22px] font-bold text-text-primary no-underline tracking-[-1px]">
            face<span className="text-gold">pay</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {links.map(navLink)}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <span className="text-[12px] text-white/40">
                  {user.name}
                  {user.role === 'admin' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-bold">ADMIN</span>}
                </span>
                <button onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-white/10 text-white/40 text-[12px] font-medium bg-transparent cursor-pointer hover:border-danger/30 hover:text-danger transition-all duration-200">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[13px] text-white/50 no-underline hover:text-white transition-colors duration-200">Sign In</Link>
                <Link to="/marketplace" className="px-5 py-2 rounded-full bg-gold text-dark font-semibold text-[12px] tracking-wide no-underline hover:bg-gold-light transition-all duration-200">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer">
            <span className={`w-5 h-[1.5px] bg-white/60 transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
            <span className={`w-5 h-[1.5px] bg-white/60 transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-[1.5px] bg-white/60 transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-[64px] bg-dark/95 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col p-8 gap-6">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={`text-[18px] font-semibold no-underline transition-colors ${
                  pathname === l.to ? 'text-gold' : 'text-white/50'
                }`}>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] pt-6 mt-2">
              {user ? (
                <div className="space-y-4">
                  <div className="text-white/40 text-[14px]">
                    Signed in as <span className="text-white/70 font-medium">{user.name}</span>
                    {user.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-bold">ADMIN</span>}
                  </div>
                  <button onClick={handleLogout}
                    className="w-full py-3.5 rounded-full border border-danger/20 text-danger text-[14px] font-medium bg-transparent cursor-pointer">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className="block w-full py-3.5 rounded-full bg-gold text-dark text-[14px] font-bold text-center no-underline">
                    Sign In
                  </Link>
                  <Link to="/marketplace" onClick={() => setMobileOpen(false)}
                    className="block w-full py-3.5 rounded-full border border-white/10 text-white/50 text-[14px] font-medium text-center no-underline">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
