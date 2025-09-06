import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secret code for admin registration
const ADMIN_CODE = "SECRET123"; // ⚠️ Change this to your own secure code

// Register Form
const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  // Validate Admin Code if role is "admin"
  if (role === "admin") {
    const adminCode = document.getElementById("adminCode").value.trim();
    if (adminCode !== ADMIN_CODE) {
      alert("Invalid Administrative Code!");
      return; // stop registration
    }
  }

  try {
    // Register user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save extra data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role
    });

    alert("Account registered successfully!");
    window.location.href = "dashboard.html"; // redirect after success
  } catch (error) {
    console.error("Firebase Error:", error);
    alert(error.message);
  }
});
