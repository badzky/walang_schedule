// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const logoutBtn = document.getElementById("logoutBtn");
const fundRequestForm = document.getElementById("fundRequestForm");
const myRequestsList = document.getElementById("myRequestsList");

let currentUser = null;

// 🔹 Auth State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loadUserRequests();
  } else {
    window.location.href = "index.html";
  }
});

// 🔹 Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Submit Fund Request
if (fundRequestForm) {
  fundRequestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = document.getElementById("amount").value;
    const reason = document.getElementById("reason").value;

    await addDoc(collection(db, "fundRequests"), {
      uid: currentUser.uid,
      email: currentUser.email,
      amount,
      reason,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    alert("Request submitted!");
    fundRequestForm.reset();
    loadUserRequests();
  });
}

// 🔹 Load User Requests
async function loadUserRequests() {
  myRequestsList.innerHTML = "";
  const q = query(collection(db, "fundRequests"), where("uid", "==", currentUser.uid));
  const querySnap = await getDocs(q);

  querySnap.forEach((docSnap) => {
    const item = docSnap.data();
    const li = document.createElement("li");
    li.className = "p-3 border rounded";
    li.textContent = `₱${item.amount} - ${item.reason} [${item.status}]`;
    myRequestsList.appendChild(li);
  });
}
