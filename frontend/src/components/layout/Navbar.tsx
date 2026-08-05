import { NavLink } from 'react-router-dom';
import MidiStatusIndicator from '../midi/MidiStatusIndicator.tsx';
import '../../css/nav.css';

const navLinks = [
  { to: '/', label: 'Session', end: true },
  { to: '/analysis', label: 'Analysis', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

export default function Navbar() {
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
      </div>
    </header>
  );
}
