// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export const firebaseConfig = {
  apiKey: "AIzaSyCpHs1OeVsL_Y-zVWQCNuMwFOwzpxQvQ5o",
  authDomain: "auditing-system-d7eb5.firebaseapp.com",
  projectId: "auditing-system-d7eb5",
  storageBucket: "auditing-system-d7eb5.appspot.com", // ✅ must be appspot.com
  messagingSenderId: "415205814788",
  appId: "1:415205814788:web:c78c45a4230557d7387b51",
  measurementId: "G-8WZM8J7EKY"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);