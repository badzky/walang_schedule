import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const logoutBtn = document.getElementById("logoutBtn");
const fundForm = document.getElementById("fundRequestForm");
const requestsTableBody = document.getElementById("myFundRequests");
const statusFilter = document.getElementById("statusFilter"); // dropdown filter

// Logout
logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Failed to log out. Try again.");
  }
});

// Auth state
let currentUser = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  await loadRequests();
});

// Submit fund request with loading indicator
fundForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("fundAmount").value);
  const reason = document.getElementById("fundReason").value.trim();
  const submitBtn = fundForm.querySelector("button[type='submit']");

  if (!amount || !reason) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Submitting...";
  submitBtn.disabled = true;

  try {
    await addDoc(collection(db, "fundRequests"), {
      uid: currentUser.uid,
      email: currentUser.email.toLowerCase(),
      amount,
      reason,
      status: "Pending",
      moneyTakenBy: "", // default empty
      createdAt: serverTimestamp()
    });

    fundForm.reset();
    await loadRequests();
  } catch (err) {
    console.error("Fund request error:", err);
    alert("❌ Failed to submit request. Try again.");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Filter change event
statusFilter?.addEventListener("change", () => {
  loadRequests();
});

// Load requests from fundRequests collection for this user
async function loadRequests() {
  if (!requestsTableBody) return;

  requestsTableBody.innerHTML = "<tr><td colspan='5' class='text-gray-500 p-2'>Loading...</td></tr>";

  try {
    const q = query(
      collection(db, "fundRequests"),
      where("email", "==", currentUser.email.toLowerCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      requestsTableBody.innerHTML = "<tr><td colspan='5' class='text-gray-500 p-2 text-center'>No requests found.</td></tr>";
      return;
    }

    const requests = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.createdAt?.toDate) data.createdAtDate = data.createdAt.toDate();
      requests.push(data);
    });

    // Sort descending by createdAt
    requests.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));

    // Apply status filter
    const filterValue = statusFilter?.value || "all";
    const filteredRequests = filterValue === "all"
      ? requests
      : requests.filter(r => r.status?.toLowerCase() === filterValue);

    // Render table rows
    requestsTableBody.innerHTML = "";
    if (filteredRequests.length === 0) {
      requestsTableBody.innerHTML = "<tr><td colspan='5' class='text-gray-500 p-2 text-center'>No requests match the filter.</td></tr>";
      return;
    }

    filteredRequests.forEach(data => {
      const date = data.createdAtDate ? data.createdAtDate.toLocaleString() : "-";
      let statusColor = "text-yellow-600"; // Pending
      if (data.status?.toLowerCase() === "approved") statusColor = "text-green-600";
      else if (data.status?.toLowerCase() === "rejected") statusColor = "text-red-600";

      const tr = document.createElement("tr");
      tr.className = "border-b";
      tr.innerHTML = `
        <td class="p-2">₱${data.amount}</td>
        <td class="p-2">${data.reason}</td>
        <td class="p-2 capitalize ${statusColor}">${data.status}</td>
        <td class="p-2">${date}</td>
        <td class="p-2">${data.moneyTakenBy || "-"}</td>
      `;
      requestsTableBody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load requests error:", err);
    requestsTableBody.innerHTML = "<tr><td colspan='5' class='text-red-500 p-2 text-center'>❌ Failed to load requests.</td></tr>";
  }
}
