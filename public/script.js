const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// Fetch files
async function loadFiles() {
  const res = await fetch("/api/files", {
    headers: { Authorization: `Bearer ${token}` }
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
        <button class="download" onclick="downloadFile('${file._id}')">⬇️</button>
        <button onclick="deleteFile('${file._id}')">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  });
}

async function downloadFile(id) {
  try {
    const response = await fetch(`/api/files/download/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    // Get the file name from response headers (if available)
    const contentDisposition = response.headers.get("content-disposition");
    const fileName = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : "downloaded_file";

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Error: " + err.message);
  }
}
  


async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;
  await fetch(`/api/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
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
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  loadFiles();
});

// Initial load
loadFiles();
