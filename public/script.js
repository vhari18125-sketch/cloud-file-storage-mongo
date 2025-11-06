const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

let allFiles = [];

// Load all files
async function loadFiles() {
  const res = await fetch("/api/files", {
    headers: { Authorization: `Bearer ${token}` },
  });
  allFiles = await res.json();

  renderFiles(allFiles);
  showStorageUsage();
  loadActivity();
}

// Render files (with preview + search)
function renderFiles(files) {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  if (files.length === 0) {
    list.innerHTML = "<p>No files uploaded yet.</p>";
    return;
  }

  files.forEach((file) => {
    const isImage = /\.(png|jpg|jpeg|gif)$/i.test(file.originalName);
    const isPDF = /\.pdf$/i.test(file.originalName);

    const div = document.createElement("div");
    div.classList.add("file-item");
    div.innerHTML = `
      ${isImage ? `<img src="/${file.path}" width="60">` : ""}
      ${isPDF ? `<embed src="/${file.path}" width="80" height="80">` : ""}
      <span>${file.originalName}</span>
      <div>
        <button onclick="downloadFile('${file._id}')">⬇️</button>
        <button onclick="deleteFile('${file._id}')">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// Upload
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("file", document.getElementById("fileInput").files[0]);

  await fetch("/api/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  document.getElementById("fileInput").value = "";
  loadFiles();
});

// Download
async function downloadFile(id) {
  const res = await fetch(`/api/files/download/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return alert("Failed to download");

  const blob = await res.blob();
  const contentDisposition = res.headers.get("content-disposition");
  const fileName = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : "downloaded_file";

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Delete
async function deleteFile(id) {
  await fetch(`/api/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  loadFiles();
}

// Storage bar
async function showStorageUsage() {
  const totalUsed = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const usedMB = (totalUsed / (1024 * 1024)).toFixed(2);
  const maxMB = 500;
  const percent = Math.min((usedMB / maxMB) * 100, 100).toFixed(1);

  document.getElementById("storageUsage").innerHTML = `
    <b>Storage Used:</b> ${usedMB} MB / ${maxMB} MB
    <div style="background:#ddd;width:250px;border-radius:6px;">
      <div style="width:${percent}%;background:#4caf50;height:10px;"></div>
    </div>
  `;
}

// Activity
async function loadActivity() {
  const res = await fetch("/api/files/activity", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const activities = await res.json();
  const list = document.getElementById("activityList");
  list.innerHTML = "";
  activities.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.action.toUpperCase()} - ${a.fileName} (${new Date(a.timestamp).toLocaleString()})`;
    list.appendChild(li);
  });
}

// Search filter
document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allFiles.filter((f) =>
    f.originalName.toLowerCase().includes(searchTerm)
  );
  renderFiles(filtered);
});

loadFiles();
