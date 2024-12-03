// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBy6tXwJz488MzngGStNPLr2U8t0J7utCk',
  authDomain: 'foldspace-6483c.firebaseapp.com',
  projectId: 'foldspace-6483c',
  storageBucket: 'foldspace-6483c.appspot.com',
  messagingSenderId: '1049446072988',
  appId: '1:1049446072988:web:d679e61a7066eb29e22359',
  measurementId: 'G-MPMLJQEN1F',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);

export { auth, provider, db };
