// Shared auth helpers — included on every protected page

const API = '/api';

function getToken() {
    return sessionStorage.getItem('cmms_token');
}

function getUser() {
    try { return JSON.parse(sessionStorage.getItem('cmms_user')); }
    catch { return null; }
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = '/index.html';
    }
}

function logout() {
    sessionStorage.removeItem('cmms_token');
    sessionStorage.removeItem('cmms_user');
    window.location.href = '/index.html';
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });
    if (res.status === 401) { logout(); return; }
    return res;
}

function loadSidebar() {
    const user = getUser();
    if (!user) return;

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();

    if (user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    }

    // Highlight active page
    const page = document.body.dataset.page;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.dataset.page === page) link.classList.add('active');
    });
}