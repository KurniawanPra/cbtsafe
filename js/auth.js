// ============================================================
// AUTH.JS - Autentikasi & Manajemen Sesi (Firestore Custom)
// ============================================================

/**
 * Hitung path relatif ke login (index.html di root)
 */
function getLoginPath() {
  const path = window.location.pathname;
  if (/\/(admin|guru|siswa|soal)\//i.test(path)) {
    return '../index.html';
  }
  return 'index.html';
}

/**
 * Hitung path relatif ke halaman role tertentu
 */
function getRolePath(role) {
  const path = window.location.pathname;
  const isSubdir = /\/(admin|guru|siswa|soal)\//i.test(path);
  const prefix = isSubdir ? '../' : '';
  if (role === 'admin') return prefix + 'admin/index.html';
  if (role === 'guru')  return prefix + 'guru/index.html';
  if (role === 'siswa') return prefix + 'siswa/index.html';
  return getLoginPath();
}

/**
 * Get User Data dari LocalStorage
 */
function getUserLocal() {
    const data = localStorage.getItem("cbt_user");
    return data ? JSON.parse(data) : null;
}

/**
 * Cek status login saat halaman dimuat
 * @param {string} requiredRole - "admin", "guru", atau "siswa"
 */
function checkAuth(requiredRole = null) {
    const user = getUserLocal();

    if (!user || !user.uid) {
        // Tidak ada sesi tersimpan
        if (requiredRole) {
            window.location.href = getLoginPath();
        }
        return;
    }

    // Verifikasi user masih ada di Firestore
    db.collection("users").doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists) {
                // Data terhapus dari DB, paksa logout
                _clearSession();
                return;
            }

            const userData = doc.data();

            // Perbarui localStorage dengan data terbaru
            const now = new Date().getTime();
            localStorage.setItem("cbt_user", JSON.stringify({
                uid: user.uid,
                nama: userData.nama,
                role: userData.role,
                username: userData.username,
                rombelId: userData.rombelId || "",
                rombelNama: userData.rombelNama || "",
                loginTime: user.loginTime || now // Pertahankan loginTime lama jika ada
            }));

            // Cek Sesi 1 Hari (24 jam = 86400000 ms)
            if (user.loginTime && (now - user.loginTime > 86400000)) {
                _clearSession();
                return;
            }

            // Redirect guard
            if (requiredRole && userData.role !== requiredRole) {
                Swal.fire({
                    title: 'Akses Ditolak',
                    text: "Anda tidak memiliki hak akses sebagai " + requiredRole,
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                }).then(() => {
                    window.location.href = getRolePath(userData.role);
                });
            } else if (!requiredRole) {
                // Halaman login → redirect jika sudah login
                const pth = window.location.pathname;
                const isLoginPage = pth.endsWith("/") ||
                    (pth.endsWith("index.html") && !pth.includes("/admin/") && !pth.includes("/guru/") && !pth.includes("/siswa/"));
                if (isLoginPage) {
                    window.location.href = getRolePath(userData.role);
                }
            }

            // Update status online
            updateOnlineStatus(user.uid, true);

        }).catch((err) => {
            console.error("checkAuth error:", err);
        });
}

/**
 * Logout dengan konfirmasi SweetAlert2 (dipanggil dari tombol UI)
 */
function logoutWithSwal() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Keluar Aplikasi?',
            text: "Anda akan keluar dari sesi ini",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) logout();
        });
    } else {
        if (confirm('Keluar?')) logout();
    }
}

/**
 * Logout System (Internal)
 */
function logout() {
    const user = getUserLocal();
    const loginPath = getLoginPath();
    if (user && user.uid) {
        db.collection('logs').add({
            action: 'LOGOUT',
            userId: user.uid,
            nama: user.nama || 'User',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        updateOnlineStatus(user.uid, false).catch(() => {}).finally(() => {
            _clearSession();
        });
    } else {
        _clearSession();
    }
}

function _clearSession() {
    localStorage.removeItem("cbt_user");
    window.location.href = getLoginPath();
}

/**
 * Update online status di Firestore
 */
function updateOnlineStatus(uid, isOnline) {
    return db.collection("users").doc(uid).update({
        isOnline: isOnline,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Heartbeat untuk mempertahankan status online
setInterval(() => {
    const user = getUserLocal();
    if (user && user.uid) {
        updateOnlineStatus(user.uid, true).catch(() => {});
    }
}, 30000); // 30 detik sekali
