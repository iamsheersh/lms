// File Location: frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Import Storage service

const firebaseConfig = {
  apiKey: "AIzaSyAKFO2-7UE8pC7N2KYZibg0D5NYmb6-dRI",
  authDomain: "lms-portal-97d9a.firebaseapp.com",
  projectId: "lms-portal-97d9a",
  storageBucket: "lms-portal-97d9a.firebasestorage.app",
  messagingSenderId: "222009307482",
  appId: "1:222009307482:web:3efc07d08ee60727e54363",
  measurementId: "G-SPB2HBVHML"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services so they can be used across your components
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Initialize and export Storage