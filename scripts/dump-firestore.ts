import firebase from "firebase/compat/app";

const firebaseConfig = {
  apiKey: 'AIzaSyAsSsYfHVML9a5Jc0F7kc7sLfXY9nJyG4o',
  projectId: 'filiplindqvist-com-ea66d',
}

firebase.initializeApp(firebaseConfig)

import { getFirestore, collection, doc, getDocs, getDoc } from "firebase/firestore";

const db = getFirestore()

const col = collection(db, 'spotify-agent', 'tracks', 'corrections')

import { writeFileSync, appendFileSync } from 'fs'

const path = './dump.csv'

writeFileSync(path, 'id,bpm')

getDocs(col).then(snapshot => {
  snapshot.forEach(doc => {
    const data = doc.data()
    if (data) {
        const entries = Object.entries(data)
        for (const [id, data] of entries) {
            appendFileSync(path, `\n${id},${data.bpm || ''}`)
        }
    }
  })
})
