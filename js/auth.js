// ============================================================
// AUTH.JS - Autentikasi & Manajemen Sesi (Firebase)
// ============================================================

/**
 * Cek status login saat halaman dimuat
 * @param {string} requiredRole - "admin", "guru", atau "siswa"
 */
function checkAuth(requiredRole = null) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in.
      // Ambil data dari firestore untuk cek role
      db.collection("users").doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            console.log("Logged in as:", userData.role);

            // Simpan data dasar di localStorage untuk akses cepat UI
            localStorage.setItem("cbt_user", JSON.stringify({
              uid: user.uid,
              nama: userData.nama,
              role: userData.role,
              username: userData.username,
              rombelId: userData.rombelId || ""
            }));

            // Redirect guard
            if (requiredRole && userData.role !== requiredRole) {
              Swal.fire({
                title: 'Akses Ditolak',
                text: "Anda tidak memiliki hak akses sebagai " + requiredRole,
                icon: 'error',
                confirmButtonColor: '#ef4444'
              }).then(() => {
                if (userData.role === 'admin') window.location.href = "/admin/index.html";
                else if (userData.role === 'guru') window.location.href = "/guru/index.html";
                else if (userData.role === 'siswa') window.location.href = "/siswa/index.html";
                else window.location.href = "/index.html";
              });
            } else if (!requiredRole) {
              // Jika ini di halaman login (index.html root)
              if (window.location.pathname.endsWith("/") || window.location.pathname.endsWith("index.html") && !window.location.pathname.includes("admin") && !window.location.pathname.includes("guru") && !window.location.pathname.includes("siswa")) {
                if (userData.role === 'admin') window.location.href = "admin/index.html";
                else if (userData.role === 'guru') window.location.href = "guru/index.html";
                else if (userData.role === 'siswa') window.location.href = "siswa/index.html";
              }
            }

            // Update status online
            updateOnlineStatus(user.uid, true);

          } else {
            console.log("No user data found in Database!");
            firebase.auth().signOut();
          }
        }).catch((error) => {
          console.log("Error getting user data:", error);
        });
    } else {
      // User is signed out.
      localStorage.removeItem("cbt_user");
      if (requiredRole) {
        window.location.href = "/index.html";
      }
    }
  });
}

/**
 * Logout fungsi dengan SweetAlert2 (Terpusat)
 */
function logoutWithSwal() {
  if (typeof Swal !== 'undefined') {
      Swal.fire({
          title: 'Keluar Aplikasi?',
          text: "Anda akan keluar dari sesi PPLG47",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Ya, Keluar'
      }).then((result) => {
          if (result.isConfirmed) {
              logout();
          }
      });
  } else {
      if(confirm('Keluar dari sesi PPLG47?')) {
          logout();
      }
  }
}

/**
 * Logout System (Internal)
 */
function logout() {
  const user = firebase.auth().currentUser;
  if(user) {
    updateOnlineStatus(user.uid, false).then(() => {
        firebase.auth().signOut().then(() => {
            window.location.href = "/index.html";
        });
    });
  } else {
      window.location.href = "/index.html";
  }
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
    const user = firebase.auth().currentUser;
    if (user) {
        updateOnlineStatus(user.uid, true);
    }
}, 30000); // 30 detik sekali

/**
 * Get User Data Sinkron dari LocalStorage untuk UI render cepat
 */
function getUserLocal() {
    const data = localStorage.getItem("cbt_user");
    return data ? JSON.parse(data) : null;
}
