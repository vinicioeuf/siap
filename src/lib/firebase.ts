// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmhELFTITEE6s-5786fZ2MHQTlP7OLgBM",
  authDomain: "siap-c5a9b.firebaseapp.com",
  projectId: "siap-c5a9b",
  storageBucket: "siap-c5a9b.firebasestorage.app",
  messagingSenderId: "911282185125",
  appId: "1:911282185125:web:280ef6d7bc0cf64ac33e4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };