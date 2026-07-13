import { NavLink } from 'react-router-dom';
import MidiStatusIndicator from '../midi/MidiStatusIndicator.tsx';
import { useAuth } from '../../context/AuthProvider.tsx';
import '../../css/nav.css';

const navLinks = [
  { to: '/', label: 'Session', end: true },
  { to: '/analysis', label: 'Analysis', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();

  const displayLabel =
    profile?.display_name?.trim() ||
    profile?.email ||
    user?.email ||
    'Account';

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar-logo" end>
          Jazz Gen
        </NavLink>

        <nav className="navbar__links" aria-label="Main">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <MidiStatusIndicator />

        <div className="navbar__auth">
          {loading ? null : user ? (
            <>
              <span className="navbar__user" title={user.email ?? undefined}>
                {displayLabel}
              </span>
              <button
                type="button"
                className="navbar__auth-link navbar__auth-link--button"
                onClick={() => void handleSignOut()}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar__auth-link">
                Log in
              </NavLink>
              <NavLink to="/signup" className="navbar__auth-button">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
