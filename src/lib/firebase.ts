// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACHU1023V80SULHtA4yO_CScoLXaJLnwk",
  authDomain: "procterlink.firebaseapp.com",
  projectId: "procterlink",
  storageBucket: "procterlink.firebasestorage.app",
  messagingSenderId: "626549532487",
  appId: "1:626549532487:web:8f62bb39be7c1034dbce62",
  measurementId: "G-QRB15Y5DDL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };