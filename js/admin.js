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
                    <td>${data.nis || '<span class="badge bg-light text-muted border">Tidak ada NIS</span>'}</td>
                    <td><span class="badge bg-secondary">${data.rombelNama || 'Belum Diatur'}</span></td>
                    <td>${data.jenisKelamin || '-'}</td>
                    <td>${data.email || '<span class="badge bg-warning-subtle text-warning border"><i class="bi bi-envelope-slash me-1"></i>Tidak ada email</span>'}</td>
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
                    <td>${data.email || '<span class="badge bg-warning-subtle text-warning border"><i class="bi bi-envelope-slash me-1"></i>Tidak ada email</span>'}</td>
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
                    <td>${data.email || '<span class="badge bg-warning-subtle text-warning border"><i class="bi bi-envelope-slash me-1"></i>Tidak ada email</span>'}</td>
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
        document.getElementById("siswaPasswordHint").classList.add("d-none"); // Sembunyikan hint saat tambah
        populateRombelSelects().then(() => mSiswa.show());
    } else if (role === 'guru') {
        document.getElementById("guruForm").reset();
        document.getElementById("guruId").value = "";
        document.getElementById("modalGuruTitle").textContent = "Tambah Guru";
        document.getElementById("guruEmail").disabled = false;
        document.getElementById("guruPassword").required = true;
        document.getElementById("guruPasswordHint").classList.add("d-none"); // Sembunyikan hint saat tambah
        populateRombelSelects().then(() => mGuru.show());
    } else {
        document.getElementById("adminForm").reset();
        document.getElementById("adminId").value = "";
        document.getElementById("modalAdminTitle").textContent = "Tambah Admin";
        document.getElementById("adminEmail").disabled = false;
        document.getElementById("adminPassword").required = true;
        document.getElementById("adminPasswordHint").classList.add("d-none"); // Sembunyikan hint saat tambah
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
    document.getElementById("siswaPasswordHint").classList.remove("d-none"); // Tampilkan hint saat edit
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
    document.getElementById("guruPasswordHint").classList.remove("d-none");
    document.getElementById("modalGuruTitle").textContent = "Edit Guru";
    mGuru.show();
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
    document.getElementById("adminPasswordHint").classList.remove("d-none"); // Tampilkan hint saat edit
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
        email: document.getElementById("guruEmail").value
        // rombelId & rombelNama dikelola dari panel Rombel, tidak di-overwrite di sini
    };

    const id = document.getElementById("guruId").value;
    const password = document.getElementById("guruPassword").value;
    saveUserToFirebase(id, payload, password, mGuru, loadGuru);
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

// Core Firestore Save Utility (Tanpa Firebase Auth)
async function saveUserToFirebase(id, payload, password, modalTarget, reloadCallback) {
    try {
        if(id) {
            // Mode Edit: update profil saja, password hanya jika diisi
            if (password) payload.passwordPlain = password;
            await db.collection("users").doc(id).update(payload);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data berhasil diubah', showConfirmButton: false, timer: 1800 });
            modalTarget.hide();
            reloadCallback();
        } else {
            // Mode Tambah: Cek username tidak duplikat
            const existing = await db.collection("users").where("username", "==", payload.username).limit(1).get();
            if (!existing.empty) {
                return Swal.fire('Gagal', 'Username "' + payload.username + '" sudah digunakan.', 'error');
            }
            if (!password) {
                return Swal.fire('Gagal', 'Password wajib diisi saat menambah user baru.', 'error');
            }
            payload.passwordPlain = password;
            payload.isOnline = false;
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const newRef = db.collection("users").doc();
            await newRef.set(payload);
            const newId = newRef.id;
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'User berhasil ditambahkan', showConfirmButton: false, timer: 1800 });
            modalTarget.hide();
            reloadCallback();
            return newId;
        }
    } catch (err) {
        Swal.fire('Proses Gagal', err.message, 'error');
        throw err;
    }
}

function deleteUser(id, requiredReload) {
    Swal.fire({
        title: 'Hapus User?',
        text: 'Data user ini akan dihapus permanen dari database.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection("users").doc(id).delete().then(() => {
                if(requiredReload === 'siswa') loadSiswa();
                if(requiredReload === 'guru') loadGuru();
                if(requiredReload === 'admin') loadAdmin();
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'User dihapus', showConfirmButton: false, timer: 1500 });
            }).catch(err => Swal.fire('Gagal', err.message, 'error'));
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

// Normalize JK: berbagai format teks → 'L' atau 'P'
function normalizeJK(raw) {
    const v = String(raw || '').toLowerCase().trim().replace(/[-_\s]+/g, '');
    if (['l','lakilaki','laki','male','m','1','pria'].includes(v)) return 'L';
    if (['p','perempuan','wanita','female','f','0','cewek'].includes(v)) return 'P';
    return 'L'; // default
}

async function previewExcelSiswa(event) {
    const file = event.target.files[0];
    if(!file) return;

    // Load rombel dari Firestore untuk pencocokan nama
    const rombelSnap = await db.collection('rombel').get();
    const rombelData = []; // [{id, nama}]
    rombelSnap.forEach(d => rombelData.push({ id: d.id, nama: String(d.data().nama || '').toLowerCase().trim() }));

    function findRombel(namaExcel) {
        const key = String(namaExcel || '').toLowerCase().trim();
        return rombelData.find(r => r.nama === key) || null;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        if (rawRows.length < 2) {
            Swal.fire('File Kosong', 'File Excel tidak memiliki data.', 'error');
            return;
        }

        // Normalize header
        const headers = rawRows[0].map(h => String(h).toLowerCase().trim().replace(/[\s.]/g, ''));

        function getCol(row, ...keys) {
            for (const k of keys) {
                const idx = headers.indexOf(k.toLowerCase().replace(/[\s.]/g, ''));
                if (idx !== -1 && row[idx] !== undefined && String(row[idx]).trim() !== '') {
                    return String(row[idx]).trim();
                }
            }
            return '';
        }

        let validCount = 0, warnCount = 0;
        let htmlPreview = '';
        excelDataReady = [];

        for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (row.every(c => c === '' || c === undefined)) continue;

            const rombelRaw = getCol(row, 'Rombel', 'rombel', 'kelas', 'Kelas');
            const nama      = getCol(row, 'Nama', 'nama_lengkap', 'namalengkap');
            const username  = getCol(row, 'Username', 'username');
            const password  = getCol(row, 'Password', 'password');

            if (!rombelRaw || !nama || !username || !password) continue;

            // Cari rombel di Firestore
            const rombelMatch = findRombel(rombelRaw);
            const rombelId    = rombelMatch ? rombelMatch.id : '';
            const rombelNama  = rombelRaw; // tampilkan nama asli dari Excel

            // Normalize JK
            const jkRaw  = getCol(row, 'JK', 'jenis_kelamin', 'jeniskelamin', 'gender');
            const jk     = normalizeJK(jkRaw);

            const nis    = getCol(row, 'NIS', 'nis');
            const email  = getCol(row, 'Email', 'email') || '';
            const noHp   = getCol(row, 'NO.HP', 'nohp', 'nomor_hp', 'nomorhp', 'hp', 'telepon');

            if (!rombelMatch) warnCount++;

            excelDataReady.push({
                nama, rombelNama, rombelId, kelamin: jk,
                nis, hp: noHp, email, username, password, role: 'siswa'
            });

            if (validCount < 200) {
                const rombelBadge = rombelMatch
                    ? `<span class="badge bg-success-subtle text-success border">${rombelRaw}</span>`
                    : `<span class="badge bg-danger-subtle text-danger border" title="Rombel tidak ditemukan di database"><i class="bi bi-exclamation-triangle me-1"></i>${rombelRaw}</span>`;
                const emailBadge = email || '<span class="badge bg-secondary-subtle text-muted border">-</span>';
                htmlPreview += `
                    <tr>
                        <td>${nama}</td>
                        <td>${rombelBadge}</td>
                        <td><span class="badge ${jk==='L'?'bg-info-subtle text-info':'bg-pink-subtle text-danger'} border">${jk}</span></td>
                        <td>${nis || '-'}</td>
                        <td class="text-muted small">${emailBadge}</td>
                        <td>${username}</td>
                    </tr>
                `;
            }
            validCount++;
        }

        document.getElementById("previewCount").textContent = validCount;
        if (validCount > 0) {
            document.getElementById("importPreviewArea").classList.remove("d-none");
            document.getElementById("importPreviewTable").innerHTML = htmlPreview;
            document.getElementById("btnProsesImportSiswa").disabled = false;
            if (warnCount > 0) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'warning',
                    title: `${warnCount} rombel tidak ditemukan`,
                    text: 'Siswa tetap diimport tapi tanpa rombel ID. Periksa badge merah di preview.',
                    showConfirmButton: false, timer: 5000 });
            }
        } else {
            Swal.fire('Format Salah', 'Data valid tidak ditemukan. Pastikan kolom: <b>Rombel, Nama, Username, Password</b> terisi.', 'error');
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
        // Firestore batch max 500 docs — split jika perlu
        const chunks = [];
        for (let i = 0; i < excelDataReady.length; i += 490) {
            chunks.push(excelDataReady.slice(i, i + 490));
        }

        let addedCount = 0;
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(user => {
                const newRef = db.collection("users").doc();
                batch.set(newRef, {
                    nama: user.nama,
                    rombelNama: user.rombelNama,
                    rombelId: user.rombelId || '',
                    jenisKelamin: user.kelamin,
                    nis: user.nis || '',
                    hp: user.hp || '',
                    email: user.email || '',
                    username: user.username,
                    passwordPlain: user.password,
                    role: 'siswa',
                    isOnline: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                addedCount++;
            });
            await batch.commit();
        }

        Swal.fire('Import Berhasil! 🎉', `${addedCount} siswa berhasil diimport.`, 'success');
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
        // --- Ambil data rombel lama untuk deteksi perubahan wali kelas ---
        let oldWaliId = null;
        if(id) {
            const oldDoc = await db.collection("rombel").doc(id).get();
            if(oldDoc.exists) oldWaliId = oldDoc.data().waliKelasId || null;
        }

        // --- Simpan / Update Rombel ---
        if(id) {
            await db.collection("rombel").doc(id).update({
                nama, waliKelasId: waliId, waliKelasNama: waliNama
            });
        } else {
            await db.collection("rombel").add({
                nama, waliKelasId: waliId, waliKelasNama: waliNama,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // --- Sync user doc guru (agar tabel guru menampilkan wali otomatis) ---
        const batch = db.batch();

        // Jika wali lama diganti / dihapus → clear data rombelnya
        if(oldWaliId && oldWaliId !== waliId) {
            const oldGuruRef = db.collection("users").doc(oldWaliId);
            batch.update(oldGuruRef, { rombelId: "", rombelNama: "" });
        }

        // Set data rombel ke user guru yang baru dipilih
        if(waliId) {
            const newGuruRef = db.collection("users").doc(waliId);
            batch.update(newGuruRef, { rombelId: id || "", rombelNama: nama });
        }

        await batch.commit();

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Rombel tersimpan', showConfirmButton: false, timer: 1500 });
        mRombel.hide();
        loadRombel();
        // Refresh tabel guru jika sedang terbuka
        if(document.getElementById('page-guru') && !document.getElementById('page-guru').classList.contains('d-none')) {
            loadGuru();
        }

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
