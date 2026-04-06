// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCb1mo3dRTO7RqaHretCXNc_429sT6Xs9I",
  authDomain: "masjid-manager-bdce7.firebaseapp.com",
  projectId: "masjid-manager-bdce7",
  storageBucket: "masjid-manager-bdce7.firebasestorage.app",
  messagingSenderId: "493445979029",
  appId: "1:493445979029:web:7e69209faf095932d4749c",
  measurementId: "G-KG63LWF4J3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ڈیٹا بیس کنکشن کے لیے یہ لائن بہت ضروری ہے
export const db = getFirestore(app);
