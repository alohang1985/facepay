import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/70 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[64px] flex items-center justify-between">
        <Link to="/" className="text-[22px] font-bold text-text-primary no-underline tracking-[-1px]">
          face<span className="text-gold">pay</span>
        </Link>

        <div className="flex items-center gap-10">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`text-[12px] tracking-[1.5px] uppercase no-underline transition-colors duration-200 ${
                pathname === l.to || (l.to === '/admin' && pathname.startsWith('/admin'))
                  ? 'text-gold font-semibold'
                  : 'text-white/40 hover:text-white/70'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
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
              <Link to="/login" className="text-[13px] text-white/50 no-underline hover:text-white transition-colors duration-200">
                Sign In
              </Link>
              <Link to="/marketplace" className="px-5 py-2 rounded-full bg-gold text-dark font-semibold text-[12px] tracking-wide no-underline hover:bg-gold-light transition-all duration-200">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
