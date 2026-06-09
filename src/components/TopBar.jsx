import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProfileSheet from './ProfileSheet'

export default function TopBar() {
  const { user, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-base)',
      }}>
        {/* League name */}
        <p style={{
          fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '1px', textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          Chennai ST League
        </p>

        {/* Profile avatar button */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open profile"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, borderRadius: '50%',
            transition: 'transform 120ms ease',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Avatar user={user} isAdmin={isAdmin} size={38} />
        </button>
      </div>

      <ProfileSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function Avatar({ user, isAdmin, size = 36 }) {
  const [imgError, setImgError] = useState(false)

  const initials = isAdmin
    ? 'A'
    : (user?.displayName || user?.email || '?')[0].toUpperCase()

  const showPhoto = !isAdmin && user?.photoURL && !imgError

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {showPhoto ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'Profile'}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{
            width: size, height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--accent)',
            display: 'block',
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: isAdmin ? 'var(--accent)' : 'var(--accent-mid)',
          border: `2px solid var(--accent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800,
          fontSize: size * 0.38,
          color: isAdmin ? '#fff' : 'var(--accent)',
        }}>
          {initials}
        </div>
      )}
      {/* Online dot */}
      <span style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--success)',
        border: '2px solid var(--bg-base)',
      }} />
    </div>
  )
}
