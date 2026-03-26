import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/marketplace', label: t('explore') },
    { to: '/register-face', label: t('register') },
    { to: '/dashboard', label: t('dashboard') },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin' });
  }

  // User dropdown items (shown in mobile menu)
  const userLinks = user ? [
    { to: '/my-licenses', label: t('myLicenses') },
    { to: '/my-faces', label: t('myFaces') },
    { to: '/wishlist', label: t('wishlist') },
    { to: '/earnings', label: t('earnings') },
    { to: '/messages', label: 'Messages' },
    { to: '/api-keys', label: 'API Keys' },
    { to: '/profile', label: t('profile') },
  ] : [];

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
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/[0.04] transition-all cursor-pointer bg-transparent border-none">
                  <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-gold text-[11px] font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-[12px] text-white/50">{user.name}</span>
                  {user.role === 'admin' && <span className="px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[9px] font-bold">ADMIN</span>}
                  <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 w-48 py-2 rounded-xl bg-dark3 border border-white/[0.08] shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {userLinks.map((l) => (
                    <Link key={l.to} to={l.to} className="block px-4 py-2.5 text-[12px] text-white/40 no-underline hover:text-gold hover:bg-white/[0.03] transition-colors">{l.label}</Link>
                  ))}
                  <div className="border-t border-white/[0.06] mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-[12px] text-danger/60 bg-transparent border-none cursor-pointer hover:bg-danger/5 hover:text-danger transition-colors">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-[13px] text-white/50 no-underline hover:text-white transition-colors duration-200">{t('signIn')}</Link>
                <Link to="/marketplace" className="px-5 py-2 rounded-full bg-gold text-dark font-semibold text-[12px] tracking-wide no-underline hover:bg-gold-light transition-all duration-200">{t('getStarted')}</Link>
              </>
            )}
            {/* Notification bell */}
            {user && <NotificationBell />}

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[13px] cursor-pointer hover:border-gold/20 transition-all">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language toggle */}
            <button onClick={toggleLang}
              className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/40 cursor-pointer hover:text-gold hover:border-gold/20 transition-all">
              {lang === 'en' ? '한' : 'EN'}
            </button>
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
                <div className="space-y-3">
                  <div className="text-white/40 text-[14px] mb-2">
                    Signed in as <span className="text-white/70 font-medium">{user.name}</span>
                    {user.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-bold">ADMIN</span>}
                  </div>
                  {userLinks.map((l) => (
                    <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                      className={`block text-[15px] no-underline transition-colors ${pathname === l.to ? 'text-gold' : 'text-white/35'}`}>{l.label}</Link>
                  ))}
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
