const API = '/api';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US');
}

function setResult(el, html, statusClass = 'status-success') {
  el.innerHTML = `<div class="${statusClass}">${html}</div>`;
  el.classList.remove('hidden');
}

async function loadFiles(selectedFileId) {
  const select = document.getElementById('fileSelect');
  const res = await fetch(`${API}/files`);
  const files = await res.json();

  if (!Array.isArray(files) || files.length === 0) {
    select.innerHTML = `<option value="">No files uploaded yet</option>`;
    return;
  }

  select.innerHTML = files
    .map((file) => {
      const selected = selectedFileId === file._id ? 'selected' : '';
      return `<option value="${file._id}" ${selected}>${file.originalName}</option>`;
    })
    .join('');
}

async function generateShareCode(e) {
  e.preventDefault();
  const fileId = document.getElementById('fileSelect').value;
  const expiresInHours = Number(
    document.getElementById('expiresInHours').value
  );
  const resultEl = document.getElementById('generatedResult');

  if (!fileId) {
    setResult(resultEl, 'Please select a file first.', 'status-error');
    return;
  }

  const res = await fetch(`${API}/files/${fileId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresInHours }),
  });
  const data = await res.json();

  if (!res.ok) {
    setResult(
      resultEl,
      data.error || 'Failed to generate share code.',
      'status-error'
    );
    return;
  }

  setResult(
    resultEl,
    `
      <p><strong>Share Code:</strong> ${data.shareCode}</p>
      <p><strong>Share Link:</strong> <a href="${data.shareLink}" target="_blank" rel="noreferrer">${data.shareLink}</a></p>
      <p><strong>Expires At:</strong> ${formatDate(data.expiresAt)}</p>
    `
  );
}

async function lookupCode(e) {
  e.preventDefault();
  const code = document.getElementById('shareCodeInput').value.trim();
  const resultEl = document.getElementById('lookupResult');
  if (!code) {
    setResult(resultEl, 'Please enter a share code.', 'status-error');
    return;
  }

  const res = await fetch(`${API}/share/${encodeURIComponent(code)}`);
  const data = await res.json();

  if (!res.ok) {
    setResult(resultEl, data.error || 'Share code is invalid.', 'status-error');
    return;
  }

  setResult(
    resultEl,
    `
      <p><strong>File Name:</strong> ${data.originalName}</p>
      <p><strong>File Size:</strong> ${formatSize(data.size)}</p>
      <p><strong>Description:</strong> ${data.description || 'No description'}</p>
      <p><strong>Uploaded At:</strong> ${formatDate(data.uploadedAt)}</p>
      <p><strong>Expires At:</strong> ${formatDate(data.expiresAt)}</p>
      <p><strong>Downloads:</strong> ${data.downloadCount}</p>
      <p><a class="btn btn-primary" href="${API}/share/${encodeURIComponent(data.shareCode)}/download">Download File</a></p>
    `
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const prefillCode = params.get('code');
  const selectedFileId = params.get('fileId');

  document
    .getElementById('generateShareForm')
    .addEventListener('submit', generateShareCode);
  document.getElementById('lookupForm').addEventListener('submit', lookupCode);

  try {
    await loadFiles(selectedFileId);
  } catch (err) {
    setResult(
      document.getElementById('generatedResult'),
      'Unable to load files.',
      'status-error'
    );
  }

  if (prefillCode) {
    document.getElementById('shareCodeInput').value = prefillCode;
    document.getElementById('lookupForm').dispatchEvent(new Event('submit'));
  }
});
