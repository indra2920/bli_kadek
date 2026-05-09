import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCnqXvxTKNqJP2IplZzw-Hrwreobsxn_aU",
  authDomain: "bli-kadek-resto.firebaseapp.com",
  projectId: "bli-kadek-resto",
  storageBucket: "bli-kadek-resto.firebasestorage.app",
  messagingSenderId: "661900320249",
  appId: "1:661900320249:web:4d913fcd17b0065e6db128",
  measurementId: "G-YQ4VPKDLE3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
