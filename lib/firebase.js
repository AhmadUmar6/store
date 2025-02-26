// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDm9yVWfThiyTiZLjyyXftaBQN5nMKEwaQ",
    authDomain: "ecommercestore-92dc7.firebaseapp.com",
    projectId: "ecommercestore-92dc7",
    storageBucket: "ecommercestore-92dc7.firebasestorage.app",
    messagingSenderId: "665183995067",
    appId: "1:665183995067:web:b2218a65f6c07bfa2e959e",
    measurementId: "G-C0FZ4EQ6C2"
  };
  
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);