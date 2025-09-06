// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const logoutBtn = document.getElementById("logoutBtn");
  const pendingCountEl = document.getElementById("pendingCount");
  const userBalanceEl = document.getElementById("userBalance");
  const myBalanceEl = document.getElementById("myBalance");
  const welcomeText = document.getElementById("welcomeText");
  const chartCanvas = document.getElementById("systemStatsChart");

  // Helpers
  const toNumber = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
    return Number.isNaN(n) ? 0 : n;
  };
  const fmtCurrency = (n) => `₱${toNumber(n).toLocaleString()}`;
  const normalizeEmail = (e) => (typeof e === "string" ? e.trim().toLowerCase() : "");

  // 🔹 Chart initialization
  let systemStatsChart = null;
  if (chartCanvas && typeof Chart !== "undefined") {
    try {
      systemStatsChart = new Chart(chartCanvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Users", "Requests", "Approved", "Pending", "Rejected"],
          datasets: [
            {
              label: "Count",
              data: [0, 0, 0, 0, 0],
              backgroundColor: [
                "#3B82F6", // Users
                "#10B981", // Requests
                "#F59E0B", // Approved
                "#EF4444", // Pending
                "#6B7280", // Rejected
              ],
              borderRadius: 6,
              barThickness: "flex",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#111827",
              titleColor: "#F9FAFB",
              bodyColor: "#E5E7EB",
              padding: 10,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { weight: "600" }, color: "#374151" },
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#374151" },
              grid: { color: "#E5E7EB" },
            },
          },
        },
      });
    } catch (err) {
      console.warn("⚠️ Chart init failed:", err);
      systemStatsChart = null;
    }
  }

  // 🔹 Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }

  // 🔹 Auth check & Firestore snapshot
  let unsubscribeRequests = null;
  let unsubscribeUsers = null;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const userEmail = normalizeEmail(user.email || "");
    if (welcomeText) welcomeText.textContent = `Welcome, ${user.email}`;

    // detach previous
    if (unsubscribeRequests) unsubscribeRequests();
    if (unsubscribeUsers) unsubscribeUsers();

    // --- Requests listener
    const q = query(collection(db, "fundRequests"));
    unsubscribeRequests = onSnapshot(
      q,
      (snapshot) => {
        let total = 0, pending = 0, approved = 0, rejected = 0;
        let departmentApprovedTotal = 0;
        let myApprovedTotal = 0;

        snapshot.forEach((docSnap) => {
          const item = docSnap.data() || {};
          total++;

          const status = item.status || "";
          const amount = toNumber(item.amount);
          const itemEmail = normalizeEmail(item.email);

          if (status === "Pending") {
            pending++;
          } else if (status === "Approved") {
            approved++;
            departmentApprovedTotal += amount;
            if (itemEmail === userEmail) {
              myApprovedTotal += amount;
            }
          } else if (status === "Rejected") {
            rejected++;
          }
        });

        // ✅ Update UI
        if (pendingCountEl) pendingCountEl.textContent = String(pending);
        if (userBalanceEl) userBalanceEl.textContent = fmtCurrency(myApprovedTotal);
        if (myBalanceEl) myBalanceEl.textContent = fmtCurrency(departmentApprovedTotal);

        // ✅ Update chart (requests-related stats only)
        if (systemStatsChart) {
          systemStatsChart.data.datasets[0].data[1] = total;   // Requests
          systemStatsChart.data.datasets[0].data[2] = approved;
          systemStatsChart.data.datasets[0].data[3] = pending;
          systemStatsChart.data.datasets[0].data[4] = rejected;
          systemStatsChart.update();
        }
      },
      (err) => {
        console.error("Firestore onSnapshot ERROR (requests):", err);
      }
    );

    // --- Users listener
    unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersCount = snapshot.size;

        if (systemStatsChart) {
          systemStatsChart.data.datasets[0].data[0] = usersCount; // Users
          systemStatsChart.update();
        }
      },
      (err) => {
        console.error("Firestore onSnapshot ERROR (users):", err);
      }
    );
  });
});
