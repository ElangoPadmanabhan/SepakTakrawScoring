import { useNavigate } from 'react-router-dom'

const THEMES = [
  {
    id: 'blaze',
    name: 'Blaze',
    tag: 'Fire & Energy',
    desc: 'Bold orange-red gradients, aggressive typography. Matches the flame logo energy.',
    preview: {
      bg: 'linear-gradient(160deg, #0d0b07 0%, #1a0d00 100%)',
      accent: '#ff5c00',
      accent2: '#ffb300',
      card: 'rgba(255,92,0,0.08)',
      border: 'rgba(255,92,0,0.2)',
      text: '#fff8f0',
      sub: '#a07050',
    },
  },
  {
    id: 'arena',
    name: 'Arena',
    tag: 'Stadium Broadcast',
    desc: 'Deep navy, crisp white cards, electric blue accents. Pro sports broadcast feel.',
    preview: {
      bg: 'linear-gradient(160deg, #050a14 0%, #0a1628 100%)',
      accent: '#2d7fff',
      accent2: '#00e5ff',
      card: 'rgba(45,127,255,0.08)',
      border: 'rgba(45,127,255,0.2)',
      text: '#e8f0ff',
      sub: '#4a6080',
    },
  },
  {
    id: 'champion',
    name: 'Champion',
    tag: 'Gold & Prestige',
    desc: 'Dark premium black with gold accents. Trophy-room feel for a prestigious league.',
    preview: {
      bg: 'linear-gradient(160deg, #0a0900 0%, #110e00 100%)',
      accent: '#d4a017',
      accent2: '#ffe066',
      card: 'rgba(212,160,23,0.08)',
      border: 'rgba(212,160,23,0.2)',
      text: '#fff9e6',
      sub: '#806a30',
    },
  },
]

export default function ThemePicker({ onPick }) {
  const navigate = useNavigate()

  const pick = (id) => {
    onPick(id)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#080810', padding: '24px 16px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          Choose Your Style
        </p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          Pick a Theme
        </h1>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '6px' }}>Select the look that fits your league</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {THEMES.map((t) => (
          <ThemeCard key={t.id} theme={t} onPick={() => pick(t.id)} />
        ))}
      </div>
    </div>
  )
}

function ThemeCard({ theme: t, onPick }) {
  const p = t.preview
  return (
    <div
      onClick={onPick}
      style={{
        background: '#111118',
        border: '1px solid #222',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 120ms ease, border-color 200ms',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Mini preview */}
      <div style={{ background: p.bg, padding: '20px 16px', position: 'relative' }}>
        {/* Fake nav bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ width: 80, height: 8, borderRadius: 4, background: p.sub, marginBottom: 6 }} />
            <div style={{ width: 120, height: 14, borderRadius: 4, background: p.text, opacity: 0.9 }} />
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: p.card, border: `1px solid ${p.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
          }}>🏆</div>
        </div>

        {/* Fake scoreboard */}
        <div style={{
          background: p.card, border: `1px solid ${p.border}`,
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: p.sub, fontWeight: 600, marginBottom: 6 }}>Team A</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: p.text, lineHeight: 1 }}>7</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                padding: '2px 10px', borderRadius: 20,
                background: p.accent + '22', border: `1px solid ${p.accent}55`,
                fontSize: '0.6rem', fontWeight: 700, color: p.accent, marginBottom: 8,
              }}>LIVE</div>
              <div style={{ fontSize: '1.2rem', color: p.sub, fontWeight: 700 }}>:</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: p.sub, fontWeight: 600, marginBottom: 6 }}>Team B</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: p.accent, lineHeight: 1 }}>12</div>
            </div>
          </div>
        </div>

        {/* Fake stats row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['Teams', 'Played', 'Today'].map((l, i) => (
            <div key={l} style={{
              flex: 1, background: p.card, border: `1px solid ${p.border}`,
              borderRadius: 10, padding: '8px 4px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: i === 2 ? p.accent2 : p.text }}>—</div>
              <div style={{ fontSize: '0.55rem', color: p.sub, fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Fake bottom nav */}
        <div style={{
          display: 'flex', marginTop: 14,
          background: 'rgba(0,0,0,0.4)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {['Home', 'Score', 'Table', 'Fix'].map((label, i) => (
            <div key={label} style={{
              flex: 1, padding: '6px 0', textAlign: 'center',
              borderTop: i === 0 ? `2px solid ${p.accent}` : '2px solid transparent',
            }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: i === 0 ? p.accent : p.sub, textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Label section */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{t.name}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 20,
              background: p.accent + '20', border: `1px solid ${p.accent}40`,
              fontSize: '0.62rem', fontWeight: 700, color: p.accent, letterSpacing: '0.5px',
            }}>
              {t.tag}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.4 }}>{t.desc}</p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: p.accent, flexShrink: 0, marginLeft: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
