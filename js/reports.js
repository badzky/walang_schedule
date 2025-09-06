// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const logoutBtn = document.getElementById("logoutBtn");
const exportBtn = document.getElementById("exportBtn");
const statusFilter = document.getElementById("statusFilter");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const applyFilterBtn = document.getElementById("applyFilter");
const reportTable = document.getElementById("reportTable");

let reportData = [];

// 🔹 Auth Check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadReport("all");
  }
});

// 🔹 Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Load Report Data
async function loadReport(status, startDate = null, endDate = null) {
  reportTable.innerHTML = "";
  reportData = [];

  let q = query(collection(db, "fundRequests"), orderBy("createdAt", "desc"));

  // Status filter
  if (status !== "all") {
    q = query(collection(db, "fundRequests"), where("status", "==", status), orderBy("createdAt", "desc"));
  }

  const querySnap = await getDocs(q);

  querySnap.forEach((docSnap) => {
    const item = docSnap.data();
    if (!item.createdAt) return;

    const createdDate = item.createdAt.toDate();

    // 🔹 Date filter
    if (startDate && createdDate < new Date(startDate)) return;
    if (endDate && createdDate > new Date(endDate + "T23:59:59")) return;

    const row = {
      User: item.email,
      Amount: item.amount,
      Reason: item.reason,
      Status: item.status,
      Date: createdDate.toLocaleString(),
      MoneyTakenBy: item.moneyTakenBy || "-" // Added field
    };

    reportData.push(row);

    // Add to table
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2 border">${row.User}</td>
      <td class="p-2 border">₱${row.Amount}</td>
      <td class="p-2 border">${row.Reason}</td>
      <td class="p-2 border">${row.Status}</td>
      <td class="p-2 border">${row.Date}</td>
      <td class="p-2 border">${row.MoneyTakenBy}</td>
    `;
    reportTable.appendChild(tr);
  });

  if (reportData.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="p-2 text-gray-500 text-center">No records found.</td>`;
    reportTable.appendChild(tr);
  }
}

// 🔹 Apply Filter
applyFilterBtn.addEventListener("click", () => {
  const status = statusFilter.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  loadReport(status, startDate, endDate);
});

// 🔹 Export Excel
exportBtn.addEventListener("click", () => {
  if (reportData.length === 0) {
    alert("No data available to export!");
    return;
  }

  // Map data to match Excel headers
  const exportData = reportData.map(row => ({
    User: row.User,
    Amount: row.Amount,
    Reason: row.Reason,
    Status: row.Status,
    Date: row.Date,
    "Money Taken By": row.MoneyTakenBy
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fund Requests");

  let filename = "FundRequests_Report.xlsx";
  if (statusFilter.value !== "all") {
    filename = `FundRequests_${statusFilter.value}.xlsx`;
  }
  if (startDateInput.value || endDateInput.value) {
    filename = `FundRequests_${statusFilter.value}_${startDateInput.value || "Start"}_${endDateInput.value || "End"}.xlsx`;
  }

  XLSX.writeFile(workbook, filename);
});
