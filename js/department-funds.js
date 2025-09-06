// js/department-funds.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const deptFundsTableBody = document.getElementById("departmentFundsBody");
const addDeptFundsBtn = document.getElementById("addDeptFundsBtn");
const addDeptFundsModal = document.getElementById("addDeptFundsModal");
const closeDeptFunds = document.getElementById("closeDeptFunds");
const cancelDeptFunds = document.getElementById("cancelDeptFunds");
const addDeptFundsForm = document.getElementById("addDeptFundsForm");
const totalDeptFundsElem = document.getElementById("totalDeptFunds");
const remainingBalanceElem = document.getElementById("remainingBalance");

// Show modal
addDeptFundsBtn?.addEventListener("click", () => {
  addDeptFundsModal.classList.remove("hidden");
  addDeptFundsModal.classList.add("flex");
});

// Close modal
[closeDeptFunds, cancelDeptFunds]?.forEach(btn => {
  btn?.addEventListener("click", () => {
    addDeptFundsModal.classList.add("hidden");
    addDeptFundsModal.classList.remove("flex");
    addDeptFundsForm.reset();
  });
});

// Render department funds table and return total
function renderDepartmentFundsTable(snapshot) {
  if (!deptFundsTableBody) return 0;

  if (snapshot.empty) {
    deptFundsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-gray-500 p-3 text-center">No funds added yet.</td>
      </tr>
    `;
    return 0;
  }

  let total = 0;
  deptFundsTableBody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : "-";
    total += Number(data.amount) || 0;

    const tr = document.createElement("tr");
    tr.className = "bg-white divide-y divide-gray-200";
    tr.innerHTML = `
      <td class="p-3 text-sm text-gray-700">₱${Number(data.amount).toLocaleString()}</td>
      <td class="p-3 text-sm text-gray-700">${data.addedBy}</td>
      <td class="p-3 text-sm text-gray-700">${data.reason || "-"}</td>
      <td class="p-3 text-sm text-gray-700">${date}</td>
    `;
    deptFundsTableBody.appendChild(tr);
  });

  totalDeptFundsElem.textContent = `Total: ₱${total.toLocaleString()}`;
  return total;
}

// Load department funds and calculate remaining balance
async function loadDepartmentFundsAndRemaining() {
  if (!totalDeptFundsElem || !remainingBalanceElem) return;

  try {
    // 1. Fetch all department funds
    const deptSnapshot = await getDocs(query(collection(db, "departmentFunds"), orderBy("createdAt", "desc")));
    const totalDeptFunds = renderDepartmentFundsTable(deptSnapshot);

    // 2. Fetch all approved fund requests
    const approvedSnapshot = await getDocs(collection(db, "fundRequests"));
    const totalApprovedRequests = approvedSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + ((data.status?.trim().toLowerCase() === "approved") ? Number(data.amount) || 0 : 0);
    }, 0);

    // 3. Calculate remaining balance
    const remaining = totalDeptFunds - totalApprovedRequests;
    remainingBalanceElem.textContent = `Remaining: ₱${remaining.toLocaleString()}`;

  } catch (err) {
    console.error("Error loading department funds:", err);
    deptFundsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-red-500 p-3 text-center">Failed to load funds.</td>
      </tr>
    `;
    totalDeptFundsElem.textContent = "Total: ₱0";
    remainingBalanceElem.textContent = "Remaining: ₱0";
  }
}

// Add new department fund
addDeptFundsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const addedBy = document.getElementById("deptFundAddedBy").value.trim();
  const amount = parseFloat(document.getElementById("deptFundAmount").value);
  const reason = document.getElementById("deptFundReason").value.trim();

  if (!addedBy || isNaN(amount) || amount <= 0) {
    alert("Please fill in required fields with a valid amount!");
    return;
  }

  try {
    await addDoc(collection(db, "departmentFunds"), {
      addedBy,
      amount,
      reason: reason || "",
      createdAt: serverTimestamp()
    });

    // Reset form and close modal
    addDeptFundsForm.reset();
    addDeptFundsModal.classList.add("hidden");
    addDeptFundsModal.classList.remove("flex");

    // Reload table and remaining balance
    await loadDepartmentFundsAndRemaining();

  } catch (err) {
    console.error("Error adding department fund:", err);
    alert("Failed to add fund. Try again.");
  }
});

// Initial load
onAuthStateChanged(auth, user => {
  if (!user) return;
  loadDepartmentFundsAndRemaining();
});



const approvedRequestsBody = document.getElementById("approvedRequestsBody");

async function loadApprovedRequests() {
  if (!approvedRequestsBody) return;

  // Clear previous rows
  approvedRequestsBody.innerHTML = '';

  try {
    // Fetch all fund requests
    const approvedSnapshot = await getDocs(collection(db, "fundRequests"));

    let hasApproved = false;

    approvedSnapshot.forEach(doc => {
      const data = doc.data();
      if ((data.status || "").trim().toLowerCase() === "approved") {
        hasApproved = true;

        // Format date approved
        const dateApproved = data.approvedAt?.toDate
          ? data.approvedAt.toDate().toLocaleString()
          : "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 text-sm text-gray-700">₱${Number(data.amount).toLocaleString()}</td>
          <td class="p-2 text-sm text-gray-700">${data.reason || "-"}</td>
          <td class="p-2 text-sm text-gray-700">${data.moneyTakenBy || "-"}</td>
         
        `;
        approvedRequestsBody.appendChild(tr);
      }
    });

    // Show "No approved requests" if none
    if (!hasApproved) {
      approvedRequestsBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-gray-500 p-2 text-center">No approved requests yet.</td>
        </tr>
      `;
    }

  } catch (err) {
    console.error("Error loading approved requests:", err);
    approvedRequestsBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-red-500 p-2 text-center">Failed to load approved requests.</td>
      </tr>
    `;
  }
}

// Call this function when you open the modal
document.getElementById("viewApprovedBtn")?.addEventListener("click", () => {
  loadApprovedRequests();
});

