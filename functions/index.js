const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp }     = require('firebase-admin/app')
const { getMessaging }      = require('firebase-admin/messaging')
const { getFirestore }      = require('firebase-admin/firestore')

initializeApp()

const APP_URL = 'https://ElangoPadmanabhan.github.io/chennaisepaktakraw'

/**
 * Fires whenever a fixture document is updated.
 * When status changes → 'live', sends a push notification to all
 * subscribed users whose FCM tokens are stored in userTokens collection.
 */
exports.notifyMatchLive = onDocumentUpdated(
  'leagues/{leagueId}/fixtures/{fixtureId}',
  async (event) => {
    const before = event.data.before.data()
    const after  = event.data.after.data()

    // Only trigger when status changes TO 'live'
    if (before.status === after.status || after.status !== 'live') return null

    const db        = getFirestore()
    const tokensSnap = await db.collection('userTokens').get()
    const tokens     = tokensSnap.docs.map(d => d.data().token).filter(Boolean)

    if (tokens.length === 0) return null

    const home   = after.homeTeam?.name || 'Home'
    const away   = after.awayTeam?.name || 'Away'
    const ev     = after.event ? ` · ${after.event}` : ''
    const url    = `${APP_URL}/scoring/${event.params.leagueId}/${event.params.fixtureId}`

    const message = {
      notification: {
        title: `🏐 Match Live Now!`,
        body:  `${home} vs ${away}${ev} — Tap to watch`,
      },
      data: { url },
      tokens,
    }

    const response = await getMessaging().sendEachForMulticast(message)
    console.log(`Sent to ${tokens.length} devices: ${response.successCount} ok, ${response.failureCount} failed`)

    // Remove stale / invalid tokens so they don't accumulate
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
      console.log(`Cleaned up ${staleIds.length} stale tokens`)
    }

    return null
  }
)
