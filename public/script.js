// ---------------- Token Check ----------------
const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

// ---------------- Logout ----------------
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// ---------------- Load Files ----------------
let allFiles = [];

async function loadFiles() {
  try {
    const res = await fetch("/api/files", {
      headers: { Authorization: `Bearer ${token}` },
    });
    allFiles = await res.json();

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    if (allFiles.length === 0) {
      list.innerHTML = "<p>No files uploaded yet.</p>";
      return;
    }

    allFiles.forEach((file) => {
      const div = document.createElement("div");
      div.className = "file-item";
      div.innerHTML = `
        <span>${file.originalName}</span>
        <div>
          <button onclick="downloadFile('${file._id}')">⬇️</button>
          <button onclick="deleteFile('${file._id}')">🗑️</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading files:", err);
    alert("Failed to load files");
  }
}

// ---------------- Upload File ----------------
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files[0]) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch("/api/files/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // DO NOT set Content-Type manually
    });
    const data = await res.json();
    alert(data.message);
    fileInput.value = "";
    loadFiles();
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed");
  }
});

// ---------------- Download File ----------------
async function downloadFile(id) {
  try {
    const res = await fetch(`/api/files/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return alert("Failed to download");

    const blob = await res.blob();
    const file = allFiles.find((f) => f._id === id);
    const fileName = file ? file.originalName : "downloaded_file";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Download failed:", err);
    alert("Download failed");
  }
}

// ---------------- Delete File ----------------
async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;

  try {
    const res = await fetch(`/api/files/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.message);
    loadFiles();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Delete failed");
  }
}

// ---------------- Initial Load ----------------
loadFiles();
