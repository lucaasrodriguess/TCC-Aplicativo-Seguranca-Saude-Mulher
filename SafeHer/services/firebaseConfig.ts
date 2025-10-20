import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app);

const db = getFirestore(app);

const storage = getStorage(app, "gs://tcc-safeher.firebasestorage.app");

export { app, auth, db, storage };
