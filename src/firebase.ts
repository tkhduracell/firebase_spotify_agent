import { useUserState } from './state'
import { onMounted, onUnmounted } from '@vue/composition-api'

import { initializeApp } from '@firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, Unsubscribe } from '@firebase/auth'
import { getFirestore } from '@firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAsSsYfHVML9a5Jc0F7kc7sLfXY9nJyG4o',
  authDomain: 'filiplindqvist-com-ea66d.firebaseapp.com',
  databaseURL: 'https://filiplindqvist-com-ea66d.firebaseio.com',
  projectId: 'filiplindqvist-com-ea66d',
  storageBucket: 'filiplindqvist-com-ea66d.appspot.com',
  messagingSenderId: '530377340060',
  appId: '1:530377340060:web:ed41192de4b4e1c87fe959'
}

initializeApp(firebaseConfig)
export const auth = getAuth()

export const firestore = getFirestore()

export function useFirebaseUser () {
  const state = useUserState()

  let unsubcribe: Unsubscribe
  onMounted(() => {
    unsubcribe = auth.onAuthStateChanged(update => {
      if (update) {
        state.id = update.uid
        state.name = update.displayName ?? ''
      }
    })
  })

  onUnmounted(() => {
    if (unsubcribe) {
      unsubcribe()
    }
  })

  async function signIn () {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    const result = await signInWithPopup(auth, provider)
    console.log('Redirect success', result)
    state.id = result.user?.uid
    state.name = result.user?.displayName ?? ''
  }

  return { signIn }
}
