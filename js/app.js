// ============================================================
// APP.JS - Shared Logic (Session, Auth Guard, Utilities)
// ============================================================

const SESSION_KEY = "cbt_session";

/**
 * Simpan sesi login (nama peserta + paket yang dipilih)
 */
function setSession(data) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Ambil data sesi
 */
function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

/**
 * Hapus sesi (logout)
 */
function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Guard: redirect ke login jika tidak ada sesi
 */
function requireLogin(redirectTo = "index.html") {
    const sess = getSession();
    if (!sess || !sess.nama) {
        window.location.href = redirectTo;
        return null;
    }
    return sess;
}

/**
 * Guard: redirect ke dashboard jika sudah login
 */
function redirectIfLoggedIn(redirectTo = "dashboard.html") {
    const sess = getSession();
    if (sess && sess.nama) {
        window.location.href = redirectTo;
    }
}

/**
 * Format waktu (detik → MM:SS)
 */
function formatWaktu(detik) {
    const m = Math.floor(detik / 60).toString().padStart(2, "0");
    const s = (detik % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

/**
 * Escape HTML untuk keamanan
 */
function escapeHTML(str) {
    return String(str)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}
