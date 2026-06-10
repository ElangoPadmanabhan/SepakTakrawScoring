const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp }     = require('firebase-admin/app')
const { getMessaging }      = require('firebase-admin/messaging')
const { getFirestore }      = require('firebase-admin/firestore')

initializeApp()

const APP_URL = 'https://ElangoPadmanabhan.github.io/chennaisepaktakraw'

// ── Helper: fetch all FCM tokens and send multicast ──────────────
async function sendToAll(db, notification, url) {
  const tokensSnap = await db.collection('userTokens').get()
  const tokens     = tokensSnap.docs.map(d => d.data().token).filter(Boolean)
  if (tokens.length === 0) return

  const message = { notification, data: { url }, tokens }
  const response = await getMessaging().sendEachForMulticast(message)
  console.log(`[FCM] "${notification.title}" → ${response.successCount}/${tokens.length} ok`)

  // Clean up stale tokens
  const staleIds = []
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || ''
      if (code.includes('invalid-registration-token') ||
          code.includes('registration-token-not-registered')) {
        staleIds.push(tokensSnap.docs[i].id)
      }
    }
  })
  if (staleIds.length > 0) {
    await Promise.all(staleIds.map(id => db.collection('userTokens').doc(id).delete()))
    console.log(`[FCM] Cleaned up ${staleIds.length} stale tokens`)
  }
}

// ── Main trigger ─────────────────────────────────────────────────
exports.notifyMatchEvents = onDocumentUpdated(
  'leagues/{leagueId}/fixtures/{fixtureId}',
  async (event) => {
    const before = event.data.before.data()
    const after  = event.data.after.data()

    const db   = getFirestore()
    const home = after.homeTeam?.name || 'Home'
    const away = after.awayTeam?.name || 'Away'
    const ev   = after.event ? ` · ${after.event}` : ''
    const url  = `${APP_URL}/scoring/${event.params.leagueId}/${event.params.fixtureId}`

    // ── 1. Match started ────────────────────────────────────────
    if (before.status !== 'live' && after.status === 'live') {
      await sendToAll(db, {
        title: `🏐 Match Started!`,
        body:  `${home} vs ${away}${ev} — Tap to watch live`,
      }, url)
      return null
    }

    // ── 2. Set won ──────────────────────────────────────────────
    const beforeSets = before.sets || []
    const afterSets  = after.sets  || []

    for (let i = 0; i < afterSets.length; i++) {
      const wasWon = beforeSets[i]?.winner
      const nowWon = afterSets[i]?.winner
      if (!wasWon && nowWon) {
        const setNum   = i + 1
        const winner   = nowWon === 'home' ? home : away
        const scoreH   = afterSets[i].home
        const scoreA   = afterSets[i].away
        const setsH    = afterSets.filter(s => s.winner === 'home').length
        const setsA    = afterSets.filter(s => s.winner === 'away').length
        const isLast   = after.status === 'completed'

        if (isLast) break  // match completed — handled below

        await sendToAll(db, {
          title: `Set ${setNum} — ${winner} wins!`,
          body:  `${home} ${setsH}–${setsA} ${away} (${scoreH}–${scoreA})${ev}`,
        }, url)
        return null
      }
    }

    // ── 3. Match completed ──────────────────────────────────────
    if (before.status !== 'completed' && after.status === 'completed') {
      const setsH   = after.homeScore ?? afterSets.filter(s => s.winner === 'home').length
      const setsA   = after.awayScore ?? afterSets.filter(s => s.winner === 'away').length
      const winner  = setsH > setsA ? home : away
      const totalH  = afterSets.reduce((sum, s) => sum + (s.home || 0), 0)
      const totalA  = afterSets.reduce((sum, s) => sum + (s.away || 0), 0)

      await sendToAll(db, {
        title: `🏆 ${winner} wins the match!`,
        body:  `Final: ${home} ${setsH}–${setsA} ${away} (${totalH}–${totalA} pts)${ev}`,
      }, url)
      return null
    }

    return null
  }
)
