// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js"; 

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Elements
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// ✅ Login Handler
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      message.textContent = "❌ Please enter both email and password.";
      message.className = "text-red-600 text-center mt-4";
      return;
    }

    try {
      // 🔹 Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Fetch user role from Firestore (users collection, UID = doc id)
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role || "user"; // default role if missing

        message.textContent = "✅ Login successful!";
        message.className = "text-green-600 text-center mt-4";

        // 🔹 Role-based redirection
        if (role === "admin") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "user-dashboard.html";
        }
      } else {
        message.textContent = "❌ User record not found in Firestore.";
        message.className = "text-red-600 text-center mt-4";
      }

    } catch (error) {
      console.error("Login Error:", error.code, error.message);
      let errorMsg = "❌ " + error.message;

      if (error.code === "auth/invalid-credential") {
        errorMsg = "❌ Invalid email or password.";
      } else if (error.code === "auth/user-not-found") {
        errorMsg = "❌ No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMsg = "❌ Incorrect password.";
      }

      message.textContent = errorMsg;
      message.className = "text-red-600 text-center mt-4";
    }
  });
}
