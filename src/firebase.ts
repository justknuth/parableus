// import { initializeApp } from 'firebase/app';
// import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import firebaseConfig from '../firebase-applet-config.json';

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
// export const auth = getAuth(app);

// export const signInWithGoogle = async () => {
//   const provider = new GoogleAuthProvider();
//   try {
//     await signInWithPopup(auth, provider);
//   } catch (error) {
//     console.error("Error signing in with Google", error);
//   }
// };

// export const logout = async () => {
//   try {
//     await signOut(auth);
//   } catch (error) {
//     console.error("Error signing out", error);
//   }
// };

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded config to bypass Vite build errors from missing local files
const firebaseConfig = {
  apiKey: "AIzaSyBAO6pnwfGwEi6VnBUmLEEaHpEpTGLPBpU",
  authDomain: "parableus.firebaseapp.com",
  projectId: "parableus",
  storageBucket: "parableus.firebasestorage.app",
  messagingSenderId: "714074819925",
  appId: "1:714074819925:web:6e6a2c45a55407eda233dc",
  firestoreDatabaseId: "(default)" 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};