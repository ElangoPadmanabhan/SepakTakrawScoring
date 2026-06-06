import { useAuth } from '../context/AuthContext'
import ViewerCount from '../components/ViewerCount'

export default function Home() {
  const { user, isAdmin } = useAuth()

  return (
    <div className="page" style={{ paddingTop: 0 }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #ff5500 0%, #ff8c00 100%)',
        margin: '0 -16px',
        padding: '40px 24px 28px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Season 2025
            </p>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Chennai Sepak<br />Takraw League
            </h1>
            <span style={{
              display: 'inline-block', marginTop: 10,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: '0.68rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px',
            }}>
              {isAdmin ? '⚡ Admin' : `👤 ${user?.displayName?.split(' ')[0] || 'User'}`}
            </span>
          </div>
          <img
            src="/logo.jpg"
            alt="Chennai Sepak Takraw League"
            width={80} height={80}
            style={{ objectFit: 'contain', flexShrink: 0, mixBlendMode: 'multiply', borderRadius: 8 }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>

      {/* ── Live match + viewer count ── */}
      <div className="card" style={{ border: '1px solid rgba(255,85,0,0.18)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="card-label" style={{ marginBottom: 4 }}>Live Match</p>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>No match in progress</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ViewerCount />
            <span className="badge badge-upcoming">Waiting</span>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <p className="card-label" style={{ paddingLeft: 2 }}>Overview</p>
      <div className="stat-grid">
        {[
          { label: 'Teams',  value: '—', color: 'var(--text-1)' },
          { label: 'Played', value: '—', color: 'var(--text-1)' },
          { label: 'Today',  value: '—', color: 'var(--accent)'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-chip">
            <div className="stat-chip-value" style={{ color }}>{value}</div>
            <div className="stat-chip-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Latest result ── */}
      <div className="card">
        <p className="card-label">Latest Result</p>
        <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>No results yet. Appears here once matches begin.</p>
      </div>

      {/* ── Table preview ── */}
      <div className="card">
        <p className="card-label">Top of Table</p>
        <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>Standings will appear here once matches begin.</p>
      </div>

    </div>
  )
}
