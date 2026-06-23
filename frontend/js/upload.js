const API = '/api';
let fileToDelete = null;

function getFileIcon(mimetype) {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return '🗜️';
  if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
  return '📁';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadFiles() {
  const filesList = document.getElementById('filesList');
  const fileCount = document.getElementById('fileCount');

  try {
    const res = await fetch(`${API}/files`);
    const files = await res.json();

    fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;

    if (files.length === 0) {
      filesList.innerHTML =
        '<div class="no-files">No files uploaded yet. Upload your first file above!</div>';
      return;
    }

    filesList.innerHTML = files
      .map(
        (file) => `
        <div class="file-card" id="card-${file._id}">
          <div class="file-icon">${getFileIcon(file.mimetype)}</div>
          <div class="file-name">${file.originalName}</div>
          <div class="file-meta">${formatSize(file.size)} · ${formatDate(file.uploadedAt)}</div>
          ${file.description ? `<div class="file-desc">${file.description}</div>` : ''}
          ${file.shareCode ? `<div class="file-desc">Share code: <strong>${file.shareCode}</strong></div>` : ''}
          <div class="file-actions">
            <button class="btn btn-secondary" onclick="viewFile('${file._id}')">Details</button>
            <button class="btn btn-primary" onclick="openShare('${file._id}')">Share</button>
            <button class="btn btn-danger" onclick="deleteFile('${file._id}')">Delete</button>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    filesList.innerHTML = '<div class="loading">Error loading files.</div>';
  }
}

function showStatus(message, type) {
  const uploadStatus = document.getElementById('uploadStatus');
  uploadStatus.textContent = message;
  uploadStatus.className = 'upload-status ' + type;
  uploadStatus.classList.remove('hidden');
}

async function viewFile(id) {
  try {
    const res = await fetch(`${API}/files/${id}`);
    const file = await res.json();
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
      <h3>${getFileIcon(file.mimetype)} ${file.originalName}</h3>
      <div class="modal-meta">Size: ${formatSize(file.size)}</div>
      <div class="modal-meta">Type: ${file.mimetype}</div>
      <div class="modal-meta">Uploaded: ${formatDate(file.uploadedAt)}</div>
      <div class="edit-form">
        <label for="editDesc">Description</label>
        <input type="text" id="editDesc" value="${file.description || ''}" placeholder="Add description..." />
        <button class="btn btn-primary" onclick="updateFile('${file._id}')">Save</button>
      </div>
    `;
    modal.classList.remove('hidden');
  } catch (err) {
    alert('Error loading file details');
  }
}

async function updateFile(id) {
  const desc = document.getElementById('editDesc').value;
  try {
    await fetch(`${API}/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc }),
    });
    document.getElementById('modal').classList.add('hidden');
    loadFiles();
  } catch (err) {
    alert('Error updating file');
  }
}

function deleteFile(id) {
  fileToDelete = id;
  document.getElementById('deleteModal').classList.remove('hidden');
}

function openShare(id) {
  window.location.href = `share.html?fileId=${id}`;
}

window.viewFile = viewFile;
window.updateFile = updateFile;
window.deleteFile = deleteFile;
window.openShare = openShare;

document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const selectedFile = document.getElementById('selectedFile');
  const dropZone = document.getElementById('dropZone');

  document.getElementById('chooseFileBtn').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      selectedFile.textContent = `Selected: ${fileInput.files[0].name}`;
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      selectedFile.textContent = `Selected: ${file.name}`;
    }
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!fileInput.files[0]) {
      showStatus('Please select a file first!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append(
      'description',
      document.getElementById('description').value
    );

    showStatus('Uploading...', '');

    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showStatus('✅ File uploaded successfully!', 'success');
        uploadForm.reset();
        selectedFile.textContent = '';
        loadFiles();
      } else {
        showStatus('❌ Upload failed: ' + data.error, 'error');
      }
    } catch (err) {
      showStatus('❌ Upload failed: ' + err.message, 'error');
    }
  });

  document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.add('hidden');
    fileToDelete = null;
  });

  document
    .getElementById('confirmDelete')
    .addEventListener('click', async () => {
      if (!fileToDelete) return;
      document.getElementById('deleteModal').classList.add('hidden');
      try {
        await fetch(`${API}/files/${fileToDelete}`, { method: 'DELETE' });
        fileToDelete = null;
        loadFiles();
      } catch (err) {
        alert('Error deleting file');
      }
    });

  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
  });

  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) {
      document.getElementById('modal').classList.add('hidden');
    }
  });

  loadFiles();
});
