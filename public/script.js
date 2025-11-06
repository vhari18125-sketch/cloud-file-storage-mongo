const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// Fetch files
async function loadFiles() {
  const res = await fetch("/api/files", {
    headers: { Authorization: Bearer ${token} }
  });
  const files = await res.json();

  const list = document.getElementById("fileList");
  list.innerHTML = "";
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
}

async function downloadFile(id) {
  window.open(/api/files/download/${id}?token=${token}, "_blank");
}

async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;
  await fetch(/api/files/${id}, {
    method: "DELETE",
    headers: { Authorization: Bearer ${token} },
  });
  loadFiles();
}

// Upload file
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("file", document.getElementById("fileInput").files[0]);

  await fetch("/api/files/upload", {
    method: "POST",
    headers: { Authorization: Bearer ${token} },
    body: formData
  });
  loadFiles();
});

// Initial load
loadFiles();
