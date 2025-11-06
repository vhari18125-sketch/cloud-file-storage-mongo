const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// Fetch files
async function loadFiles() {
  try {
    const res = await fetch("/api/files", {
      headers: { Authorization: `Bearer ${token}` } // backticks are required
    });
    const files = await res.json();

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    if (files.length === 0) {
      list.innerHTML = "<p>No files uploaded yet.</p>";
      return;
    }

    files.forEach((file) => {
      const div = document.createElement("div");
      div.className = "file-item";
      div.innerHTML = `
        <span>${file.originalName}</span>
        <div>
          <button class="download" onclick="downloadFile('${file._id}')">⬇</button>
          <button onclick="deleteFile('${file._id}')">🗑</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading files:", err);
    alert("Failed to load files");
  }
}

// Download file
async function downloadFile(id) {
  window.open(`/api/files/download/${id}?token=${token}`, "_blank"); // backticks
}

// Delete file
async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;
  try {
    await fetch(`/api/files/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` } // backticks
    });
    loadFiles();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete file");
  }
}

// Upload file
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch("/api/files/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // DO NOT set content-type
      body: formData
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || "Upload failed");

    fileInput.value = "";
    alert(data.message || "File uploaded successfully!");
    loadFiles();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed");
  }
});

// Initial load
loadFiles();
