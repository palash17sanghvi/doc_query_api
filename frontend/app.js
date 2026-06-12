// Configuration
const API_BASE = 'http://127.0.0.1:8000/api';

// State Management
let currentToken = localStorage.getItem('docquery_token');
let currentUsername = localStorage.getItem('docquery_user');

// DOM Elements
const viewAuth = document.getElementById('view-auth');
const viewDashboard = document.getElementById('view-dashboard');
const userControls = document.getElementById('user-controls');
const displayUsername = document.getElementById('display-username');
const alertBox = document.getElementById('alert-box');
const documentList = document.getElementById('document-list');

// --- INITIALIZATION ---
function init() {
    if (currentToken) {
        showDashboard();
    } else {
        showAuth();
    }
}

// --- UI HELPERS ---
function showAuth() {
    viewDashboard.classList.add('d-none');
    userControls.classList.add('d-none');
    viewAuth.classList.remove('d-none');
}

function showDashboard() {
    viewAuth.classList.add('d-none');
    displayUsername.innerText = currentUsername;
    userControls.classList.remove('d-none');
    viewDashboard.classList.remove('d-none');
    fetchDocuments(); // Load docs automatically
}

function showAlert(message, type = 'success') {
    alertBox.className = `alert alert-${type} shadow-lg`;
    alertBox.innerText = message;
    alertBox.classList.remove('d-none');
    setTimeout(() => alertBox.classList.add('d-none'), 3000);
}

// Fetch helper that automatically attaches your token
async function apiFetch(endpoint, method, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Token ${currentToken}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    if (!response.ok && response.status !== 204) throw await response.json();
    return response.status === 204 ? null : response.json();
}

// --- USER AUTHENTICATION & MANAGEMENT ---

// Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    try {
        const data = await apiFetch('/login/', 'POST', { username: user, password: pass });
        currentToken = data.token;
        currentUsername = user;
        localStorage.setItem('docquery_token', currentToken);
        localStorage.setItem('docquery_user', currentUsername);
        document.getElementById('form-login').reset();
        showAlert('Login successful!');
        showDashboard();
    } catch (err) { showAlert('Login failed. Check credentials.', 'danger'); }
});

// Register
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    try {
        await apiFetch('/register/', 'POST', { username: user, password: pass });
        document.getElementById('form-register').reset();
        showAlert('Account created! You can now log in.');
    } catch (err) { showAlert('Registration failed. Username may exist.', 'danger'); }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    currentToken = null;
    currentUsername = null;
    localStorage.removeItem('docquery_token');
    localStorage.removeItem('docquery_user');
    showAuth();
    showAlert('Logged out successfully.', 'info');
});

// Update Username
document.getElementById('btn-update-user').addEventListener('click', async () => {
    const newUsername = document.getElementById('update-username-input').value;
    if (!newUsername) return;
    try {
        await apiFetch('/register/', 'PUT', { username: newUsername });
        currentUsername = newUsername;
        localStorage.setItem('docquery_user', currentUsername);
        displayUsername.innerText = currentUsername;
        document.getElementById('update-username-input').value = '';
        showAlert('Username updated successfully!');
    } catch (err) { showAlert('Failed to update username.', 'danger'); }
});

// Delete User
document.getElementById('btn-delete-user').addEventListener('click', async () => {
    if (!confirm('Are you absolutely sure? This deletes your account and ALL documents.')) return;
    try {
        await apiFetch('/register/', 'DELETE');
        document.getElementById('btn-logout').click(); // trigger logout logic
        showAlert('Account completely deleted.', 'warning');
    } catch (err) { showAlert('Error deleting account.', 'danger'); }
});

// --- DOCUMENT CRUD ---

async function fetchDocuments() {
    try {
        const docs = await apiFetch('/documents/', 'GET');
        documentList.innerHTML = '';
        if (docs.length === 0) {
            documentList.innerHTML = '<p class="text-secondary">Your vault is empty.</p>';
            return;
        }
        docs.forEach(doc => {
            documentList.innerHTML += `
                <div class="col-12">
                    <div class="card doc-item border-secondary">
                        <div class="card-body">
                            <h5 class="card-title text-primary">${doc.title}</h5>
                            <p class="card-text text-light" style="white-space: pre-wrap;">${doc.content}</p>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-info me-2" onclick="editDoc(${doc.id}, '${doc.title.replace(/'/g, "\\'")}', '${doc.content.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')">Edit</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteDoc(${doc.id})">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        if (err.detail) showAlert('Session expired. Please log in.', 'danger');
        document.getElementById('btn-logout').click();
    }
}

// Create or Update Document
document.getElementById('form-doc').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('doc-id').value;
    const title = document.getElementById('doc-title').value;
    const content = document.getElementById('doc-content').value;
    const payload = { title, content };

    try {
        if (id) {
            await apiFetch(`/documents/${id}/`, 'PUT', payload);
            showAlert('Document updated!');
        } else {
            await apiFetch('/documents/', 'POST', payload);
            showAlert('Document created!');
        }
        resetDocForm();
        fetchDocuments();
    } catch (err) { showAlert('Failed to save document.', 'danger'); }
});

// Setup Form for Editing
window.editDoc = function (id, title, content) {
    document.getElementById('editor-title').innerText = 'Edit Document';
    document.getElementById('doc-id').value = id;
    document.getElementById('doc-title').value = title;
    document.getElementById('doc-content').value = content;
    document.getElementById('btn-cancel-edit').classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete Document
window.deleteDoc = async function (id) {
    if (!confirm('Delete this document?')) return;
    try {
        await apiFetch(`/documents/${id}/`, 'DELETE');
        showAlert('Document deleted.', 'warning');
        fetchDocuments();
    } catch (err) { showAlert('Failed to delete document.', 'danger'); }
};

// Cancel Edit
document.getElementById('btn-cancel-edit').addEventListener('click', resetDocForm);

function resetDocForm() {
    document.getElementById('editor-title').innerText = 'New Document';
    document.getElementById('form-doc').reset();
    document.getElementById('doc-id').value = '';
    document.getElementById('btn-cancel-edit').classList.add('d-none');
}

// Boot up
init();