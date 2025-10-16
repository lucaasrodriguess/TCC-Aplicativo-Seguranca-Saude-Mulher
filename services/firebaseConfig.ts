import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDI-amhlWRiOOIkcP79pwCwLriqfiL8e1Q",
  authDomain: "tcc-safeher.firebaseapp.com",
  projectId: "tcc-safeher",
  storageBucket: "tcc-safeher.firebasestorage.app",
  messagingSenderId: "1050394973274",
  appId: "1:1050394973274:web:1aa115c77689c39a53f463",
  measurementId: "G-53Z7V9C97K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar no resto do aplicativo
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
