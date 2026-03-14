// ============================================================
// ADMIN.JS - Modul Dashboard Admin
// ============================================================

let mSiswa, mGuru, mAdmin, mRombel, mImport;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth("admin");
    const user = getUserLocal();
    if(user) document.getElementById("adminName").textContent = user.nama;

    mSiswa = new bootstrap.Modal(document.getElementById('modalSiswa'));
    mGuru = new bootstrap.Modal(document.getElementById('modalGuru'));
    mAdmin = new bootstrap.Modal(document.getElementById('modalAdmin'));
    mRombel = new bootstrap.Modal(document.getElementById('modalRombel'));
    mImport = new bootstrap.Modal(document.getElementById('modalImportSiswa'));
    
    // Initial Load
    loadDashboardStats();
    
    // Event Listeners
    document.getElementById("siswaForm").addEventListener("submit", handleSaveSiswa);
    document.getElementById("guruForm").addEventListener("submit", handleSaveGuru);
    document.getElementById("adminForm").addEventListener("submit", handleSaveAdmin);
    document.getElementById("rombelForm").addEventListener("submit", handleSaveRombel);
    document.getElementById("fileExcelSiswa").addEventListener("change", previewExcelSiswa);
});

// Logout menggunakan SweetAlert2
function logoutWithSwal() {
    Swal.fire({
        title: 'Keluar Aplikasi?',
        text: "Anda akan keluar dari sesi CBT SAFE",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Keluar'
    }).then((result) => {
        if (result.isConfirmed) {
            logout(); // Panggil dr auth.js
        }
    })
}

function showPage(pageId, navElement) {
    document.querySelectorAll('.admin-page').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');
    
    document.querySelectorAll('.cbt-sidebar-link').forEach(el => el.classList.remove('active'));
    if(navElement) navElement.classList.add('active');

    if(pageId === 'siswa') loadSiswa();
    if(pageId === 'guru') loadGuru();
    if(pageId === 'admin') loadAdmin();
    if(pageId === 'monitor') loadMonitor();
    if(pageId === 'beranda') loadDashboardStats();
    if(pageId === 'rombel') loadRombel();
}

// ---------------------------------------------------------
// BERANDA STATS
// ---------------------------------------------------------
function loadDashboardStats() {
    db.collection("users").get().then((snapshot) => {
        let guru = 0, siswa = 0, online = 0;
        const now = new Date().getTime();

        snapshot.forEach(doc => {
            const data = doc.data();
            if(data.role === 'guru') guru++;
            if(data.role === 'siswa') siswa++;
            
            // Cek online (isOnline true dan lastSeen < 1 menit yang lalu)
            if(data.isOnline && data.lastSeen) {
                const lastSeenTime = data.lastSeen.toMillis();
                if ((now - lastSeenTime) < 60000) online++;
            }
        });

        document.getElementById("countGuru").textContent = guru;
        document.getElementById("countSiswa").textContent = siswa;
        document.getElementById("countOnline").textContent = online;
    });
}

// ---------------------------------------------------------
// KELOLA PENGGUNA
// ---------------------------------------------------------
let siswaList = [];
let guruListObj = [];
let adminList = [];

// -- SISWA --
function loadSiswa() {
    document.getElementById("siswaTableBody").innerHTML = `<tr><td colspan="5" class="text-center">Memuat data...</td></tr>`;
    db.collection("users").where("role", "==", "siswa").get().then((snapshot) => {
        siswaList = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            siswaList.push(data);
            html += `
                <tr>
                    <td>${data.nama}</td>
                    <td>${data.nis || '-'}</td>
                    <td><span class="badge bg-secondary">${data.rombelNama || 'Belum Diatur'}</span></td>
                    <td>${data.jenisKelamin || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editSiswa('${data.id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${data.id}', 'siswa')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("siswaTableBody").innerHTML = html || '<tr><td colspan="5" class="text-center">Tidak ada data siswa</td></tr>';
    });
}

// -- GURU --
function loadGuru() {
    document.getElementById("guruTableBody").innerHTML = `<tr><td colspan="5" class="text-center">Memuat data...</td></tr>`;
    db.collection("users").where("role", "==", "guru").get().then((snapshot) => {
        guruListObj = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            guruListObj.push(data);
            html += `
                <tr>
                    <td>${data.nama}</td>
                    <td><span class="badge bg-secondary">${data.rombelNama || 'Bukan Wali'}</span></td>
                    <td>${data.jenisKelamin || '-'}</td>
                    <td>${data.email}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editGuru('${data.id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${data.id}', 'guru')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("guruTableBody").innerHTML = html || '<tr><td colspan="5" class="text-center">Tidak ada data guru</td></tr>';
    });
}

// -- ADMIN --
function loadAdmin() {
    document.getElementById("adminTableBody").innerHTML = `<tr><td colspan="5" class="text-center">Memuat data...</td></tr>`;
    db.collection("users").where("role", "==", "admin").get().then((snapshot) => {
        adminList = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            adminList.push(data);
            html += `
                <tr>
                    <td>${data.nama}</td>
                    <td>${data.username}</td>
                    <td>${data.email}</td>
                    <td>${data.jenisKelamin || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editAdmin('${data.id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${data.id}', 'admin')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("adminTableBody").innerHTML = html || '<tr><td colspan="5" class="text-center">Tidak ada data admin</td></tr>';
    });
}

// Populates Rombel options for user forms (Siswa & Guru)
function populateRombelSelects() {
    return db.collection("rombel").orderBy("nama").get().then(snap => {
        let htmlSiswa = '<option value="">-- Pilih Kelas --</option>';
        let htmlGuru = '<option value="">-- Tidak Menjadi Wali --</option>';
        
        rombelList = snap.docs.map(x => ({id: x.id, ...x.data()}));
        
        rombelList.forEach(r => {
            htmlSiswa += `<option value="${r.id}">${r.nama}</option>`;
            htmlGuru += `<option value="${r.id}">${r.nama}</option>`;
        });
        
        if(document.getElementById("siswaRombelId")) document.getElementById("siswaRombelId").innerHTML = htmlSiswa;
        if(document.getElementById("guruWaliRombelId")) document.getElementById("guruWaliRombelId").innerHTML = htmlGuru;
    });
}

function showUserModal(role) {
    if(role === 'siswa') {
        document.getElementById("siswaForm").reset();
        document.getElementById("siswaId").value = "";
        document.getElementById("modalSiswaTitle").textContent = "Tambah Siswa";
        document.getElementById("siswaEmail").disabled = false;
        document.getElementById("siswaPassword").required = true;
        populateRombelSelects().then(() => mSiswa.show());
    } else if (role === 'guru') {
        document.getElementById("guruForm").reset();
        document.getElementById("guruId").value = "";
        document.getElementById("modalGuruTitle").textContent = "Tambah Guru";
        document.getElementById("guruEmail").disabled = false;
        document.getElementById("guruPassword").required = true;
        populateRombelSelects().then(() => mGuru.show());
    } else {
        document.getElementById("adminForm").reset();
        document.getElementById("adminId").value = "";
        document.getElementById("modalAdminTitle").textContent = "Tambah Admin";
        document.getElementById("adminEmail").disabled = false;
        document.getElementById("adminPassword").required = true;
        mAdmin.show();
    }
}

function editSiswa(id) {
    const user = siswaList.find(u => u.id === id);
    if(!user) return;
    document.getElementById("siswaId").value = user.id;
    document.getElementById("siswaNama").value = user.nama;
    document.getElementById("siswaKelamin").value = user.jenisKelamin || 'L';
    document.getElementById("siswaNis").value = user.nis || '';
    document.getElementById("siswaUsername").value = user.username;
    document.getElementById("siswaEmail").value = user.email;
    document.getElementById("siswaEmail").disabled = true; 
    document.getElementById("siswaPassword").required = false;
    document.getElementById("modalSiswaTitle").textContent = "Edit Siswa";
    
    populateRombelSelects().then(() => {
        document.getElementById("siswaRombelId").value = user.rombelId || "";
        mSiswa.show();
    });
}

function editGuru(id) {
    const user = guruListObj.find(u => u.id === id);
    if(!user) return;
    document.getElementById("guruId").value = user.id;
    document.getElementById("guruNama").value = user.nama;
    document.getElementById("guruKelamin").value = user.jenisKelamin || 'L';
    document.getElementById("guruUsername").value = user.username;
    document.getElementById("guruEmail").value = user.email;
    document.getElementById("guruEmail").disabled = true; 
    document.getElementById("guruPassword").required = false;
    document.getElementById("modalGuruTitle").textContent = "Edit Guru";
    
    populateRombelSelects().then(() => {
        document.getElementById("guruWaliRombelId").value = user.rombelId || "";
        mGuru.show();
    });
}

function editAdmin(id) {
    const user = adminList.find(u => u.id === id);
    if(!user) return;
    document.getElementById("adminId").value = user.id;
    document.getElementById("adminNama").value = user.nama;
    document.getElementById("adminKelamin").value = user.jenisKelamin || 'L';
    document.getElementById("adminUsername").value = user.username;
    document.getElementById("adminEmail").value = user.email;
    document.getElementById("adminEmail").disabled = true; 
    document.getElementById("adminPassword").required = false;
    document.getElementById("modalAdminTitle").textContent = "Edit Admin";
    mAdmin.show();
}

async function handleSaveSiswa(e) {
    e.preventDefault();
    const payload = {
        role: "siswa",
        nama: document.getElementById("siswaNama").value,
        jenisKelamin: document.getElementById("siswaKelamin").value,
        nis: document.getElementById("siswaNis").value,
        username: document.getElementById("siswaUsername").value,
        email: document.getElementById("siswaEmail").value,
        rombelId: document.getElementById("siswaRombelId").value
    };
    
    if(payload.rombelId) {
        const r = rombelList.find(x => x.id === payload.rombelId);
        if(r) payload.rombelNama = r.nama;
    } else {
        payload.rombelNama = "";
    }

    const id = document.getElementById("siswaId").value;
    const password = document.getElementById("siswaPassword").value;
    saveUserToFirebase(id, payload, password, mSiswa, loadSiswa);
}

async function handleSaveGuru(e) {
    e.preventDefault();
    const payload = {
        role: "guru",
        nama: document.getElementById("guruNama").value,
        jenisKelamin: document.getElementById("guruKelamin").value,
        username: document.getElementById("guruUsername").value,
        email: document.getElementById("guruEmail").value,
        rombelId: document.getElementById("guruWaliRombelId").value
    };
    
    if(payload.rombelId) {
        const r = rombelList.find(x => x.id === payload.rombelId);
        if(r) payload.rombelNama = r.nama;
    } else {
        payload.rombelNama = "";
    }

    const id = document.getElementById("guruId").value;
    const password = document.getElementById("guruPassword").value;
    
    // Khusus guru, kita perlu mengupdate entitas rombel jika dia dijadikan wali kelas
    try {
        await saveUserToFirebase(id, payload, password, mGuru, loadGuru);
        // Post-save action: Update Rombel if selected
        if (id && payload.rombelId) {
             const prefix = payload.jenisKelamin === 'P' ? 'Ibu ' : (payload.jenisKelamin === 'L' ? 'Bapak ' : ''); 
             const waliNama = `${prefix}${payload.nama}`;
             await db.collection("rombel").doc(payload.rombelId).update({
                 waliKelasId: id,
                 waliKelasNama: waliNama
             });
        }
    } catch (e) { console.error(e) }
}

async function handleSaveAdmin(e) {
    e.preventDefault();
    const payload = {
        role: "admin",
        nama: document.getElementById("adminNama").value,
        jenisKelamin: document.getElementById("adminKelamin").value,
        username: document.getElementById("adminUsername").value,
        email: document.getElementById("adminEmail").value
    };

    const id = document.getElementById("adminId").value;
    const password = document.getElementById("adminPassword").value;
    saveUserToFirebase(id, payload, password, mAdmin, loadAdmin);
}

// Core Firebase Save Utility
async function saveUserToFirebase(id, payload, password, modalTarget, reloadCallback) {
    try {
        if(id) {
            // Edit
            await db.collection("users").doc(id).update(payload);
            Swal.fire('Diupdate!', 'Data pengguna berhasil diubah.', 'success');
            modalTarget.hide();
            reloadCallback();
        } else {
            // Add NEW
            await Swal.fire({
                title: 'Perhatian Firebase SDK',
                text: 'Membuat user baru via form akan otomatis me-logout Administrator saat ini karena limitasi keamanan. Anda harus login kembali setelah ini selesai.',
                icon: 'info'
            });
            const cred = await firebase.auth().createUserWithEmailAndPassword(payload.email, password);
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("users").doc(cred.user.uid).set(payload);
            
            // Return early if Guru because guru handleSave needs the ID to update Rombel
            // Wait, we need to return the ID so that handleSaveGuru can use it
            // if we are going to logout anyway, we should update rombel before reloading
            const idBaru = cred.user.uid;
            
            if (payload.role === 'guru' && payload.rombelId) {
                const prefix = payload.jenisKelamin === 'P' ? 'Ibu ' : (payload.jenisKelamin === 'L' ? 'Bapak ' : ''); 
                const waliNama = `${prefix}${payload.nama}`;
                await db.collection("rombel").doc(payload.rombelId).update({
                    waliKelasId: idBaru,
                    waliKelasNama: waliNama
                });
            }

            await Swal.fire('Berhasil Terdaftar!', 'User baru berhasil dibuat. Anda akan di-logout.', 'success');
            window.location.reload();
            return idBaru;
        }
    } catch (err) {
        Swal.fire('Proses Gagal', err.message, 'error');
        throw err;
    }
}

function deleteUser(id, requiredReload) {
    Swal.fire({
        title: 'Hapus User Database?',
        text: "Kredensial utamanya di Authentication Console harus Anda hapus manual.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus Data'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection("users").doc(id).delete().then(() => {
                if(requiredReload === 'siswa') loadSiswa();
                if(requiredReload === 'guru') loadGuru();
                if(requiredReload === 'admin') loadAdmin();
                Swal.fire('Terhapus', 'Profil user telah dihapus.', 'success');
            });
        }
    });
}

// ---------------------------------------------------------
// IMPORT EXCEL
// ---------------------------------------------------------
function showImportSiswaModal() {
    document.getElementById("fileExcelSiswa").value = "";
    document.getElementById("importPreviewArea").classList.add("d-none");
    document.getElementById("importPreviewTable").innerHTML = "";
    document.getElementById("btnProsesImportSiswa").disabled = true;
    mImport.show();
}

let excelDataReady = [];

function previewExcelSiswa(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        let validCount = 0;
        let htmlPreview = '';
        excelDataReady = [];

        jsonData.forEach(row => {
            // Cek kolom minimal
            if(row.nama_lengkap && row.kelas && row.username && row.password) {
                excelDataReady.push({
                    nama: row.nama_lengkap,
                    rombelNama: row.kelas,
                    kelamin: row.jenis_kelamin || 'L',
                    nis: row.nis || '',
                    hp: row.nomor_hp || '',
                    email: row.email || `${row.username}@cbtsafe.local`,
                    username: row.username,
                    password: row.password,
                    role: 'siswa'
                });
                
                if (validCount < 100) { // Tampilkan 100 baris pertama di preview
                    htmlPreview += `
                        <tr>
                            <td>${row.nama_lengkap}</td>
                            <td>${row.kelas}</td>
                            <td>${row.jenis_kelamin || ''}</td>
                            <td>${row.nis || ''}</td>
                            <td>${row.email || ''}</td>
                            <td>${row.username}</td>
                        </tr>
                    `;
                }
                validCount++;
            }
        });

        document.getElementById("previewCount").textContent = validCount;
        if(validCount > 0) {
            document.getElementById("importPreviewArea").classList.remove("d-none");
            document.getElementById("importPreviewTable").innerHTML = htmlPreview;
            document.getElementById("btnProsesImportSiswa").disabled = false;
        } else {
            Swal.fire('Format Salah', 'Data valid tidak ditemukan. Pastikan header kolom excel sama persis dengan instruksi.', 'error');
            document.getElementById("importPreviewArea").classList.add("d-none");
            document.getElementById("btnProsesImportSiswa").disabled = true;
        }
    };
    reader.readAsArrayBuffer(file);
}

// Untuk mass-create kita gunakan Batch Document Writing di Firestore.
// Namun perlu dicatat: kita tidak bisa bulk insert "Firebase Authentication Users" melalui frontend SDK.
// User yang login tidak bisa dibuat batchly. Oleh karena ini frontend-only, kita simpan plain-text pass dan handle custom login via rule if exist.
// (Disarankan pindah ke Cloud Function admin sdk di sistem prod)
async function prosesImportSiswa() {
    if(excelDataReady.length === 0) return;
    
    document.getElementById("btnProsesImportSiswa").disabled = true;
    document.getElementById("btnProsesImportSiswa").innerHTML = `<div class="spinner-border spinner-border-sm me-2"></div> Memproses...`;

    try {
        const batch = db.batch();
        let addedCount = 0;
        
        // Peringatan Keamanan Firebase Frontend!
        // Di aplikasi asli, buat user harus lewat Backend Admin SDK. Di sini kita membuat doc untuk validasi `custom login logic`.
        excelDataReady.forEach(user => {
            const newRef = db.collection("users").doc();
            batch.set(newRef, {
                nama: user.nama,
                rombelNama: user.rombelNama,
                jenisKelamin: user.kelamin,
                nis: user.nis,
                hp: user.hp,
                email: user.email,
                username: user.username,
                passwordPlain: user.password, // Only strictly needed since no backend auth API
                role: 'siswa',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            addedCount++;
        });

        await batch.commit();

        Swal.fire('Import Berhasil', `${addedCount} data siswa berhasil diimport. Pendaftaran autentikasi tertulis berhasil.`, 'success');
        mImport.hide();
        loadSiswa();
    } catch(err) {
        Swal.fire('Gagal Import', err.message, 'error');
    } finally {
        document.getElementById("btnProsesImportSiswa").disabled = false;
        document.getElementById("btnProsesImportSiswa").innerHTML = "Mulai Eksekusi Import";
    }
}

// ---------------------------------------------------------
// MANAJEMEN ROMBEL (KELAS)
// ---------------------------------------------------------
let rombelList = [];
let guruList = [];

function loadRombel() {
    document.getElementById("rombelTableBody").innerHTML = `<tr><td colspan="3" class="text-center">Memuat data...</td></tr>`;
    db.collection("rombel").orderBy("nama").get().then((snapshot) => {
        rombelList = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            rombelList.push(data);
            
            html += `
                <tr>
                    <td class="fw-bold">${data.nama}</td>
                    <td>${data.waliKelasNama || '- Belum Diatur -'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="editRombel('${data.id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger shadow-sm ms-1" onclick="deleteRombel('${data.id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("rombelTableBody").innerHTML = html || '<tr><td colspan="3" class="text-center text-muted">Belum ada rombel.</td></tr>';
    });
}

function fetchGuruForDropdown() {
    return db.collection("users").where("role", "==", "guru").get().then(snap => {
        guruList = [];
        let html = '<option value="">-- Pilih Guru / Wali --</option>';
        snap.forEach(doc => {
            const g = doc.data();
            g.id = doc.id;
            guruList.push(g);
            // Auto prefix Bapak/Ibu if want to be fancy, but let's assume raw name
            const prefix = g.jenisKelamin === 'P' ? 'Ibu ' : (g.jenisKelamin === 'L' ? 'Bapak ' : ''); 
            html += `<option value="${g.id}">${prefix}${g.nama}</option>`;
        });
        document.getElementById("rombelWaliKelas").innerHTML = html;
    });
}

function showRombelModal() {
    document.getElementById("rombelForm").reset();
    document.getElementById("rombelId").value = "";
    document.getElementById("modalRombelTitle").textContent = "Tambah Rombel (Kelas)";
    fetchGuruForDropdown().then(() => mRombel.show());
}

function editRombel(id) {
    const data = rombelList.find(r => r.id === id);
    if(!data) return;
    
    document.getElementById("rombelId").value = data.id;
    document.getElementById("rombelNama").value = data.nama;
    document.getElementById("modalRombelTitle").textContent = "Edit Rombel";
    
    fetchGuruForDropdown().then(() => {
        document.getElementById("rombelWaliKelas").value = data.waliKelasId || "";
        mRombel.show();
    });
}

async function handleSaveRombel(e) {
    e.preventDefault();
    const id = document.getElementById("rombelId").value;
    const nama = document.getElementById("rombelNama").value;
    const waliId = document.getElementById("rombelWaliKelas").value;
    
    let waliNama = "";
    if(waliId) {
        const wl = guruList.find(g => g.id === waliId);
        if(wl) {
            const prefix = wl.jenisKelamin === 'P' ? 'Ibu ' : (wl.jenisKelamin === 'L' ? 'Bapak ' : ''); 
            waliNama = `${prefix}${wl.nama}`;
        }
    }

    try {
        if(id) {
            await db.collection("rombel").doc(id).update({
                nama: nama,
                waliKelasId: waliId,
                waliKelasNama: waliNama
            });
        } else {
            await db.collection("rombel").add({
                nama: nama,
                waliKelasId: waliId,
                waliKelasNama: waliNama,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Rombel tersimpan', showConfirmButton: false, timer: 1500 });
        mRombel.hide();
        loadRombel();
    } catch(err) {
        Swal.fire('Gagal Menyimpan', err.message, 'error');
    }
}

function deleteRombel(id) {
    Swal.fire({ title: 'Hapus Rombel?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus' }).then((result) => {
        if (result.isConfirmed) {
            db.collection("rombel").doc(id).delete().then(() => loadRombel());
        }
    });
}

// ---------------------------------------------------------
// MONITORING
// ---------------------------------------------------------
function loadMonitor() {
    document.getElementById("monitorTableBody").innerHTML = `<tr><td colspan="4" class="text-center">Memuat data...</td></tr>`;
    
    // Listen realtime
    db.collection("users").where("isOnline", "==", true).onSnapshot((snapshot) => {
        let html = '';
        const now = new Date().getTime();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const lastSeenTime = data.lastSeen ? data.lastSeen.toMillis() : 0;
            
            // Cek jika last heartbeat kurang dari 2 menit
            if ((now - lastSeenTime) < 120000) {
                const dateActive = new Date(lastSeenTime).toLocaleTimeString('id-ID');
                html += `
                    <tr>
                        <td>${data.nama} <small class="text-muted">(${data.username})</small></td>
                        <td>${data.role}</td>
                        <td><span class="badge bg-success">Online</span></td>
                        <td>${dateActive}</td>
                    </tr>
                `;
            }
        });
        document.getElementById("monitorTableBody").innerHTML = html || '<tr><td colspan="4" class="text-center">Semua user offline</td></tr>';
    });
}
