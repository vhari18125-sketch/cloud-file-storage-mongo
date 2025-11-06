// 🌐 API Base
const API_BASE =
  window.location.hostname.includes("localhost")
    ? "http://localhost:5000/api"
    : "/api";

// ✅ Token
const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

// 🧭 DOM Elements
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const activityList = document.getElementById("activityList");
const logoutBtn = document.getElementById("logoutBtn");
const storageText = document.getElementById("storageText");
const storageBar = document.getElementById("storageBar");
const searchInput = document.getElementById("searchInput");

// ✅ Logout
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// ✅ Add activity
function addActivity(message) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  activityList.prepend(li);
  if (activityList.children.length > 100) {
    activityList.removeChild(activityList.lastChild);
  }
}

// ✅ Update storage usage
function updateStorageUsage(files) {
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitMB = 50;
  const percent = Math.min((usedMB / limitMB) * 100, 100);
  storageText.textContent = `${usedMB} MB / ${limitMB} MB`;
  storageBar.style.width = `${percent}%`;
  storageBar.style.background = percent > 90 ? "#ef4444" : "#60a5fa";
}

// ✅ Fetch files
async function loadFiles(searchQuery = "") {
  try {
    const res = await fetch(`${API_BASE}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await res.json();

    fileList.innerHTML = "";
    let filteredFiles = files;

    if (searchQuery) {
      filteredFiles = files.filter(f =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filteredFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredFiles.forEach(file => {
      const div = document.createElement("div");
      div.className = "file-item";

      let preview = "";
      if (file.mimetype?.startsWith("image/")) {
        preview = `<img src="/uploads/${file.filename}" alt="Preview" />`;
      } else if (file.mimetype === "application/pdf") {
        preview = `<embed src="/uploads/${file.filename}" type="application/pdf" />`;
      } else {
        preview = `<img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" alt="File" />`;
      }

      div.innerHTML = `
        ${preview}
        <span>${file.originalName}</span>
        <div>
          <button onclick="downloadFile('${file._id}')">⬇️ Download</button>
          <button onclick="deleteFile('${file._id}')">🗑️ Delete</button>
        </div>
      `;
      fileList.appendChild(div);
    });

    updateStorageUsage(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    alert("Failed to load files. Please try again.");
  }
}

// ✅ Upload file
uploadForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // Important: do NOT set Content-Type manually
    });
    const data = await res.json();
    alert(data.message);
    fileInput.value = "";
    addActivity(`📤 Uploaded: ${file.name}`);
    loadFiles();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed. Try again.");
  }
});

// ✅ Download file
async function downloadFile(id) {
  window.open(`${API_BASE}/files/download/${id}?token=${token}`, "_blank");
  addActivity(`⬇️ Downloaded file ID: ${id}`);
}

// ✅ Delete file
async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;
  try {
    const res = await fetch(`${API_BASE}/files/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.message);
    addActivity(`🗑️ Deleted file ID: ${id}`);
    loadFiles();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete failed. Try again.");
  }
}

// ✅ Search input
searchInput?.addEventListener("input", (e) => loadFiles(e.target.value));

// ✅ Initial load
loadFiles();
