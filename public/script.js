// 🌐 Backend API base URL (auto detects local or Render)
const API_BASE =
  window.location.hostname.includes("localhost")
    ? "http://localhost:5000/api"
    : "/api";

// ✅ Load user from localStorage (token-based auth)
let token = localStorage.getItem("token");

// 🧭 DOM Elements
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const activityList = document.getElementById("activityList");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Handle Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    location.reload();
  });
}

// ✅ Function: Fetch all files
async function fetchFiles(searchQuery = "") {
  try {
    const res = await fetch(`${API_BASE}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await res.json();

    fileList.innerHTML = "";
    let filteredFiles = files;

    // 🔍 Search filter
    if (searchQuery) {
      filteredFiles = files.filter((f) =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 🕓 Sort by recent uploads
    filteredFiles.sort(
      (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
    );

    // 🖼️ Display file list
    filteredFiles.forEach((file) => {
      const item = document.createElement("div");
      item.className = "file-item";

      // Thumbnail preview (if image/pdf)
      let preview = "";
      if (file.mimetype.startsWith("image/")) {
        preview = `<img src="/uploads/${file.filename}" alt="Preview" />`;
      } else if (file.mimetype === "application/pdf") {
        preview = `<embed src="/uploads/${file.filename}" type="application/pdf" />`;
      } else {
        preview = `<img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" alt="File" />`;
      }

      item.innerHTML = `
        ${preview}
        <span>${file.originalName}</span>
        <div>
          <button onclick="downloadFile('${file.filename}')">⬇️ Download</button>
          <button onclick="deleteFile('${file._id}')">🗑️ Delete</button>
        </div>
      `;
      fileList.appendChild(item);
    });

    updateStorageUsage(files);
  } catch (err) {
    console.error("Error fetching files:", err);
  }
}

// ✅ Upload File
uploadForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file to upload!");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
    fileInput.value = "";
    addActivity(`📤 Uploaded: ${file.name}`);
    fetchFiles();
  } catch (err) {
    console.error("Upload error:", err);
  }
});

// ✅ Download File
async function downloadFile(filename) {
  window.open(`/uploads/${filename}`, "_blank");
  addActivity(`⬇️ Downloaded: ${filename}`);
}

// ✅ Delete File
async function deleteFile(id) {
  if (!confirm("Are you sure you want to delete this file?")) return;
  try {
    const res = await fetch(`${API_BASE}/files/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.message);
    addActivity(`🗑️ Deleted file ID: ${id}`);
    fetchFiles();
  } catch (err) {
    console.error("Delete error:", err);
  }
}

// ✅ Search Event
searchInput?.addEventListener("input", (e) => {
  fetchFiles(e.target.value);
});

// ✅ Activity Log (Local only)
function addActivity(message) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  activityList.prepend(li);
  if (activityList.children.length > 100) {
    activityList.removeChild(activityList.lastChild);
  }
}

// ✅ Storage Usage Bar
function updateStorageUsage(files) {
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitMB = 50;
  const percent = Math.min((usedMB / limitMB) * 100, 100);

  document.getElementById("storageText").textContent = `${usedMB} MB / ${limitMB} MB`;
  document.getElementById("storageBar").style.width = `${percent}%`;
  document.getElementById("storageBar").style.background =
    percent > 90 ? "#ef4444" : "#60a5fa";
}

// ✅ Initial load
fetchFiles();
