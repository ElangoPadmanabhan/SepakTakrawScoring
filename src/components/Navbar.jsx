import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileSheet from './ProfileSheet'
import './Navbar.css'

const HomeIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const ScoreIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const TableIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
)
const FixturesIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const LeaguesIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>
  </svg>
)

const USER_TABS = [
  { path: '/',         label: 'Home',     Icon: HomeIcon     },
  { path: '/scoring',  label: 'Score',    Icon: ScoreIcon    },
  { path: '/table',    label: 'Table',    Icon: TableIcon    },
  { path: '/fixtures', label: 'Fixtures', Icon: FixturesIcon },
]

const ADMIN_TABS = [
  { path: '/',               label: 'Home',     Icon: HomeIcon     },
  { path: '/scoring',        label: 'Score',    Icon: ScoreIcon    },
  { path: '/table',          label: 'Table',    Icon: TableIcon    },
  { path: '/fixtures',       label: 'Fixtures', Icon: FixturesIcon },
  { path: '/admin/leagues',  label: 'Leagues',  Icon: LeaguesIcon  },
]

export default function Navbar() {
  const { user, isAdmin } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const TABS = isAdmin ? ADMIN_TABS : USER_TABS

  return (
    <>
      <nav className="navbar">
        {TABS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            aria-label={label}
          >
            <span className="nav-indicator" />
            <span className="nav-icon"><Icon /></span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}

        {/* Profile tab */}
        <button
          className="nav-item nav-profile-btn"
          onClick={() => setProfileOpen(true)}
          aria-label="Profile"
        >
          <span className="nav-indicator" />
          <span className="nav-icon">
            <ProfileAvatar user={user} isAdmin={isAdmin} />
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

function ProfileAvatar({ user, isAdmin }) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = !isAdmin && user?.photoURL && !imgError

  return (
    <div style={{ position: 'relative', width: 24, height: 24 }}>
      {showPhoto ? (
        <img
          src={user.photoURL}
          alt="Profile"
          width={24} height={24}
          onError={() => setImgError(true)}
          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'currentColor',
          opacity: 0.15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ opacity: 0 }}>A</span>
        </div>
      )}
      {/* Colored ring to make it look like a nav icon */}
      {showPhoto && (
        <div style={{
          position: 'absolute', inset: -2,
          borderRadius: '50%',
          border: '2px solid currentColor',
          opacity: 0.6,
        }} />
      )}
      {!showPhoto && (
        <svg style={{ position: 'absolute', inset: 0 }} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      )}
    </div>
  )
}
