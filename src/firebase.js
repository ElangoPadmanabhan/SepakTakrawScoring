import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAH6CX3-3NsA3Q2AOtXXmtRLzYHmAwOAtc',
  authDomain: 'chennai-sepak-takraw.firebaseapp.com',
  projectId: 'chennai-sepak-takraw',
  storageBucket: 'chennai-sepak-takraw.firebasestorage.app',
  messagingSenderId: '230469246205',
  appId: '1:230469246205:web:66f46ae985eaaf67fbf294',
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
