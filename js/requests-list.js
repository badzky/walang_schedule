// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const logoutBtn = document.getElementById("logoutBtn");
const pendingRequestsList = document.getElementById("pendingRequestsList");
const approvedRequestsList = document.getElementById("approvedRequestsList");
const rejectedRequestsList = document.getElementById("rejectedRequestsList");

const pendingCountEl = document.getElementById("pendingCount");
const approvedCountEl = document.getElementById("approvedCount");
const rejectedCountEl = document.getElementById("rejectedCount");

const pendingSection = document.getElementById("pendingListSection");
const approvedSection = document.getElementById("approvedListSection");
const rejectedSection = document.getElementById("rejectedListSection");

const viewPendingBtn = document.getElementById("viewPendingBtn");
const viewApprovedBtn = document.getElementById("viewApprovedBtn");
const viewRejectedBtn = document.getElementById("viewRejectedBtn");

// 🔹 Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    updateCounts();
  } else {
    window.location.href = "index.html";
  }
});

// 🔹 Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Show/Hide Sections
function hideAllSections() {
  pendingSection.classList.add("hidden");
  approvedSection.classList.add("hidden");
  rejectedSection.classList.add("hidden");
}

// 🔹 Display loading indicator
function showLoading(listEl) {
  listEl.innerHTML = `
    <li class="p-3 border rounded text-gray-500 flex justify-center items-center">
      <svg class="animate-spin h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3 3 3h-4z"></path>
      </svg>
      Loading...
    </li>
  `;
}

// 🔹 Render requests dynamically
function renderRequests(status) {
  let listEl;
  switch (status) {
    case "Pending": listEl = pendingRequestsList; break;
    case "Approved": listEl = approvedRequestsList; break;
    case "Rejected": listEl = rejectedRequestsList; break;
    default: return;
  }

  showLoading(listEl);

  const q = query(collection(db, "fundRequests"));
  onSnapshot(q, (snapshot) => {
    listEl.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      if (item.status !== status) return;

      const li = document.createElement("li");
      li.className = "p-3 border rounded flex justify-between items-center";
      li.innerHTML = `<span>${item.email} - ₱${item.amount} - ${item.reason}</span>`;

      if (status === "Pending") {
        const actions = document.createElement("div");
        actions.innerHTML = `
          <button class="approve bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
          <button class="reject bg-red-500 text-white px-2 py-1 rounded">Reject</button>
        `;

        actions.querySelector(".approve").addEventListener("click", async () => {
          await updateDoc(doc(db, "fundRequests", docSnap.id), { status: "Approved" });
        });

        actions.querySelector(".reject").addEventListener("click", async () => {
          await updateDoc(doc(db, "fundRequests", docSnap.id), { status: "Rejected" });
        });

        li.appendChild(actions);

      } else if (status === "Approved") {
        const actions = document.createElement("div");

        if (item.moneyTakenBy) {
          // Display the person's name as a label if already recorded
          actions.innerHTML = `<span class="text-green-600 font-semibold">${item.moneyTakenBy}</span>`;
        } else {
          // Show Done button if moneyTakenBy not set
          actions.innerHTML = `<button class="done bg-blue-500 text-white px-2 py-1 rounded">Done</button>`;

          actions.querySelector(".done").addEventListener("click", async () => {
            const { value: personName } = await Swal.fire({
              title: 'Money Released',
              input: 'text',
              inputLabel: 'Enter name of person who took the money',
              inputPlaceholder: 'Full name',
              showCancelButton: true,
              confirmButtonText: 'Submit',
              cancelButtonText: 'Cancel',
              inputValidator: (value) => !value && 'Please enter a name!'
            });

            if (personName) {
              await updateDoc(doc(db, "fundRequests", docSnap.id), {
                moneyTakenBy: personName,
                doneAt: new Date()
              });

              Swal.fire({
                icon: 'success',
                title: 'Recorded!',
                text: `${personName} has taken the money.`,
                timer: 2000,
                showConfirmButton: false
              });

              // Replace Done button with the person's name
              actions.innerHTML = `<span class="text-green-600 font-semibold">${personName}</span>`;
            }
          });
        }

        li.appendChild(actions);

      } else if (status === "Rejected") {
        li.innerHTML += `<span class="ml-4 text-red-600 font-semibold">[Rejected]</span>`;
      }

      listEl.appendChild(li);
    });
    if (listEl.children.length === 0) {
      listEl.innerHTML = `<li class="p-2 text-gray-500">No ${status.toLowerCase()} requests found.</li>`;
    }
  });
}


// 🔹 Update counts
function updateCounts() {
  const q = query(collection(db, "fundRequests"));
  onSnapshot(q, (snapshot) => {
    let pending = 0, approved = 0, rejected = 0;

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      if (item.status === "Pending") pending++;
      else if (item.status === "Approved") approved++;
      else if (item.status === "Rejected") rejected++;
    });

    pendingCountEl.textContent = pending;
    approvedCountEl.textContent = approved;
    rejectedCountEl.textContent = rejected;
  });
}

// 🔹 Button Click Events
viewPendingBtn.addEventListener("click", () => {
  hideAllSections();
  pendingSection.classList.remove("hidden");
  renderRequests("Pending");
  pendingSection.scrollIntoView({ behavior: "smooth" });
});

viewApprovedBtn.addEventListener("click", () => {
  hideAllSections();
  approvedSection.classList.remove("hidden");
  renderRequests("Approved");
  approvedSection.scrollIntoView({ behavior: "smooth" });
});

viewRejectedBtn.addEventListener("click", () => {
  hideAllSections();
  rejectedSection.classList.remove("hidden");
  renderRequests("Rejected");
  rejectedSection.scrollIntoView({ behavior: "smooth" });
});
