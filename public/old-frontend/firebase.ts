import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_WEB_API_KEY || "AIzaSyD7AeXekkIx4LtovavRkT-DovMoN-BDLfw",
  authDomain: "onspot-16048.firebaseapp.com",
  projectId: "onspot-16048",
  storageBucket: "onspot-16048.firebasestorage.app",
  messagingSenderId: "91406952290",
  appId: "1:91406952290:web:d7c691797bf47747d42e3b",
  measurementId: "G-NRCE919DCK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
