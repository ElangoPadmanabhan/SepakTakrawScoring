importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            '__VITE_FIREBASE_API_KEY__',
  authDomain:        '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId:         '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket:     '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId:             '__VITE_FIREBASE_APP_ID__',
})

const messaging = firebase.messaging()

// Handle background / app-closed push messages
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '🏐 Match Live!'
  const body  = payload.notification?.body  || 'A match is starting now.'
  const url   = payload.data?.url || '/chennaisepaktakraw/'

  self.registration.showNotification(title, {
    body,
    icon:    '/chennaisepaktakraw/icons/icon-192.png',
    badge:   '/chennaisepaktakraw/icons/icon-192.png',
    tag:     'match-live',
    data:    { url },
    vibrate: [200, 100, 200],
  })
})

// Tap notification → open the match scoring page
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/chennaisepaktakraw/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('chennaisepaktakraw'))
      if (existing) { existing.focus(); existing.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
