// ============================================================
// ADMIN.JS - Modul Dashboard Admin
// ============================================================

let mSiswa, mGuru, mAdmin, mRombel, mImport;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth("admin");
    const user = getUserLocal();
    if(user) {
        document.getElementById("adminName").textContent = user.nama;
        // Mobile topbar
        const mob = document.getElementById("adminNameMobile");
        if(mob) mob.textContent = user.nama;
        const drop = document.getElementById("adminNameDropdown");
        if(drop) drop.textContent = user.nama;
    }

    mSiswa = new bootstrap.Modal(document.getElementById('modalSiswa'));
    mGuru = new bootstrap.Modal(document.getElementById('modalGuru'));
    mAdmin = new bootstrap.Modal(document.getElementById('modalAdmin'));
    mRombel = new bootstrap.Modal(document.getElementById('modalRombel'));
    mImport = new bootstrap.Modal(document.getElementById('modalImportSiswa'));
    // Initial Load
    loadDashboardStats();
    startUiClock("uiClockAdmin");
    
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

// ---- Generic Sort Utility ----
const sortState = { siswa: { col:'nama', dir:'asc' }, guru: { col:'nama', dir:'asc' }, admin: { col:'nama', dir:'asc' }, rombel: { col:'nama', dir:'asc' } };

function sortList(arr, col, dir) {
    return [...arr].sort((a, b) => {
        const av = String(a[col] || '').toLowerCase();
        const bv = String(b[col] || '').toLowerCase();
        return dir === 'asc' ? av.localeCompare(bv, 'id') : bv.localeCompare(av, 'id');
    });
}

function sortIcon(table, col) {
    const s = sortState[table];
    if(s.col !== col) return '<i class="bi bi-arrow-down-up text-muted ms-1" style="font-size:0.7rem"></i>';
    return s.dir === 'asc'
        ? '<i class="bi bi-sort-alpha-down text-primary ms-1" style="font-size:0.7rem"></i>'
        : '<i class="bi bi-sort-alpha-up text-primary ms-1" style="font-size:0.7rem"></i>';
}

function toggleSort(table, col, renderFn) {
    const s = sortState[table];
    if(s.col === col) s.dir = s.dir === 'asc' ? 'desc' : 'asc';
    else { s.col = col; s.dir = 'asc'; }
    renderFn();
}

// -- SISWA --
let siswaFilterKelas = '';

function renderSiswaTable(list) {
    const filtered = siswaFilterKelas
        ? list.filter(s => (s.rombelId || '') === siswaFilterKelas || (s.rombelNama || '').toLowerCase() === siswaFilterKelas.toLowerCase())
        : list;

    const sorted = sortList(filtered, sortState.siswa.col, sortState.siswa.dir);

    let html = '';
    sorted.forEach(data => {
        html += `
            <tr>
                <td>${data.nama}</td>
                <td>${data.nis || '<span class="badge bg-light text-muted border">Tidak ada NIS</span>'}</td>
                <td><span class="badge ${data.rombelId ? 'bg-primary' : 'bg-secondary'}">${data.rombelNama || 'Belum Diatur'}</span></td>
                <td>${data.jenisKelamin || '-'}</td>
                <td>${data.email || '<span class="badge bg-warning-subtle text-warning border"><i class="bi bi-envelope-slash me-1"></i>Tidak ada email</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editSiswa('${data.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${data.id}', 'siswa')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });
    const tbody = document.getElementById("siswaTableBody");
    tbody.innerHTML = html || `<tr><td colspan="6" class="text-center text-muted py-4">
        <i class="bi bi-inbox fs-3 d-block mb-2"></i>
        ${ siswaFilterKelas ? 'Tidak ada siswa di kelas ini' : 'Tidak ada data siswa'}
    </td></tr>`;

    // Update sort header icons
    const thNama = document.getElementById('siswaTh_nama');
    if(thNama) thNama.innerHTML = `Nama Lengkap ${sortIcon('siswa','nama')}`;

    // Update counter
    document.getElementById("siswaFilterCount").textContent = `${filtered.length} siswa`;
}

function loadSiswa(keepFilter = false) {
    if(!keepFilter) siswaFilterKelas = '';
    document.getElementById("siswaTableBody").innerHTML = `<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Memuat...</td></tr>`;

    // Populate filter dropdown
    populateRombelSelects().then(() => {
        const filterSel = document.getElementById("siswaKelasFilter");
        if(filterSel && rombelList.length) {
            filterSel.innerHTML = '<option value="">Semua Kelas</option>'
                + rombelList.map(r => `<option value="${r.id}">${r.nama}</option>`).join('');
            if(siswaFilterKelas) filterSel.value = siswaFilterKelas;
        }
    });

    db.collection("users").where("role", "==", "siswa").get().then((snapshot) => {
        siswaList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            siswaList.push(data);
        });
        renderSiswaTable(siswaList);
    });
}

function setSiswaFilter(val) {
    siswaFilterKelas = val;
    renderSiswaTable(siswaList);
}

async function deleteAllSiswa() {
    const total = siswaFilterKelas
        ? siswaList.filter(s => (s.rombelId || '') === siswaFilterKelas).length
        : siswaList.length;
    const label = siswaFilterKelas
        ? rombelList.find(r => r.id === siswaFilterKelas)?.nama || 'kelas terpilih'
        : 'SEMUA KELAS';

    const res = await Swal.fire({
        title: 'Hapus Semua Siswa?',
        html: `<div class="text-start">
            <p>Ini akan menghapus <b>${total} siswa</b> dari <b>${label}</b>.</p>
            <div class="alert alert-danger p-2" style="font-size:0.85rem;">
                <i class="bi bi-exclamation-octagon-fill me-1"></i> Aksi ini <b>tidak dapat dibatalkan!</b>
            </div>
            <p class="mb-1">Ketik <b>HAPUS</b> untuk konfirmasi:</p>
            <input id="confirmHapus" class="form-control" placeholder="HAPUS">
        </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Hapus Sekarang',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            if(document.getElementById('confirmHapus').value !== 'HAPUS') {
                Swal.showValidationMessage('Ketik HAPUS dengan huruf kapital!');
                return false;
            }
        }
    });
    if(!res.isConfirmed) return;

    try {
        const toDelete = siswaFilterKelas
            ? siswaList.filter(s => (s.rombelId || '') === siswaFilterKelas)
            : siswaList;

        // Batch delete in chunks of 490
        for(let i = 0; i < toDelete.length; i += 490) {
            const batch = db.batch();
            toDelete.slice(i, i+490).forEach(s => batch.delete(db.collection('users').doc(s.id)));
            await batch.commit();
        }
        Swal.fire({ toast: true, position: 'top-end', icon: 'success',
            title: `${toDelete.length} siswa dihapus`, showConfirmButton: false, timer: 2000 });
        loadSiswa();
    } catch(err) {
        Swal.fire('Gagal', err.message, 'error');
    }
}


// -- GURU --
function renderGuruTable() {
    const sorted = sortList(guruListObj, sortState.guru.col, sortState.guru.dir);
    let html = '';
    sorted.forEach(data => {
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
    document.getElementById("guruTableBody").innerHTML = html || '<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-inbox fs-3 d-block mb-2"></i>Tidak ada data guru</td></tr>';
    const th = document.getElementById('guruTh_nama');
    if(th) th.innerHTML = `Nama Lengkap ${sortIcon('guru','nama')}`;
}

function loadGuru() {
    document.getElementById("guruTableBody").innerHTML = `<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Memuat...</td></tr>`;
    db.collection("users").where("role", "==", "guru").get().then((snapshot) => {
        guruListObj = [];
        snapshot.forEach(doc => { const d = doc.data(); d.id = doc.id; guruListObj.push(d); });
        renderGuruTable();
    });
}

// -- ADMIN --
function renderAdminTable() {
    const sorted = sortList(adminList, sortState.admin.col, sortState.admin.dir);
    let html = '';
    sorted.forEach(data => {
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
    document.getElementById("adminTableBody").innerHTML = html || '<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-inbox fs-3 d-block mb-2"></i>Tidak ada data admin</td></tr>';
    const th = document.getElementById('adminTh_nama');
    if(th) th.innerHTML = `Nama Lengkap ${sortIcon('admin','nama')}`;
}

function loadAdmin() {
    document.getElementById("adminTableBody").innerHTML = `<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Memuat...</td></tr>`;
    db.collection("users").where("role", "==", "admin").get().then((snapshot) => {
        adminList = [];
        snapshot.forEach(doc => { const d = doc.data(); d.id = doc.id; adminList.push(d); });
        renderAdminTable();
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

function renderRombelTable() {
    const sorted = sortList(rombelList, sortState.rombel.col, sortState.rombel.dir);
    let html = '';
    sorted.forEach(data => {
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
    const th = document.getElementById('rombelTh_nama');
    if(th) th.innerHTML = `Nama Rombel / Kelas ${sortIcon('rombel','nama')}`;
}

function loadRombel() {
    document.getElementById("rombelTableBody").innerHTML = `<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Memuat...</td></tr>`;
    db.collection("rombel").orderBy("nama").get().then((snapshot) => {
        rombelList = [];
        snapshot.forEach(doc => { const d = doc.data(); d.id = doc.id; rombelList.push(d); });
        renderRombelTable();
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
    const nama = document.getElementById("rombelNama").value.trim();
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
        let oldNama = null, oldWaliId = null;
        if(id) {
            const oldDoc = await db.collection("rombel").doc(id).get();
            if(oldDoc.exists) {
                oldNama   = oldDoc.data().nama || null;
                oldWaliId = oldDoc.data().waliKelasId || null;
            }
        }

        // Simpan / Update Rombel
        let rombelDocId = id;
        if(id) {
            await db.collection("rombel").doc(id).update({
                nama, waliKelasId: waliId, waliKelasNama: waliNama
            });
        } else {
            const newRef = await db.collection("rombel").add({
                nama, waliKelasId: waliId, waliKelasNama: waliNama,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            rombelDocId = newRef.id;
        }

        const batch = db.batch();

        // Jika nama rombel berubah → update semua siswa di rombel ini
        if(id && oldNama && oldNama !== nama) {
            const siswaSnap = await db.collection("users")
                .where("rombelId", "==", id)
                .where("role", "==", "siswa").get();
            siswaSnap.forEach(d => batch.update(d.ref, { rombelNama: nama }));
        }

        // Sync wali kelas guru (lama → clear, baru → set)
        if(oldWaliId && oldWaliId !== waliId) {
            batch.update(db.collection("users").doc(oldWaliId), { rombelId: "", rombelNama: "" });
        }
        if(waliId) {
            batch.update(db.collection("users").doc(waliId), { rombelId: rombelDocId, rombelNama: nama });
        }

        await batch.commit();

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Rombel tersimpan', showConfirmButton: false, timer: 1500 });
        mRombel.hide();
        loadRombel();
        if(document.getElementById('page-guru') && !document.getElementById('page-guru').classList.contains('d-none')) {
            loadGuru();
        }
    } catch(err) {
        Swal.fire('Gagal Menyimpan', err.message, 'error');
    }
}

async function deleteRombel(id) {
    // Cek berapa siswa yang ada di rombel ini
    const siswaSnap = await db.collection("users")
        .where("rombelId", "==", id)
        .where("role", "==", "siswa").get();
    const jmlSiswa = siswaSnap.size;

    const rombelData = rombelList.find(r => r.id === id);
    const rombelNama = rombelData ? rombelData.nama : 'ini';

    Swal.fire({
        title: 'Hapus Rombel?',
        html: jmlSiswa > 0
            ? `<div class="text-start">
                <p>Anda akan menghapus rombel <b>${rombelNama}</b>.</p>
                <div class="alert alert-danger p-2" style="font-size:0.85rem;">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    <b>${jmlSiswa} siswa</b> di rombel ini akan <b>IKUT TERHAPUS</b> dari database!
                </div>
               </div>`
            : `Hapus rombel <b>${rombelNama}</b>? Tidak ada siswa yang terdampak.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: jmlSiswa > 0 ? `Hapus + ${jmlSiswa} Siswa` : 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
            const batch = db.batch();
            // Hapus semua siswa di rombel ini
            siswaSnap.forEach(d => batch.delete(d.ref));
            // Hapus rombel sendiri
            batch.delete(db.collection("rombel").doc(id));
            await batch.commit();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success',
                title: `Rombel + ${jmlSiswa} siswa dihapus`, showConfirmButton: false, timer: 2000 });
            loadRombel();
            if(!document.getElementById('page-siswa').classList.contains('d-none')) loadSiswa();
        } catch(err) {
            Swal.fire('Gagal', err.message, 'error');
        }
    });
}

// Sinkronisasi: link siswa yang hanya punya rombelNama (tidak ada rombelId) ke data rombel
async function sinkronisasiRombel() {
    const res = await Swal.fire({
        title: 'Sinkronisasi Siswa ↔ Rombel',
        html: `<div class="text-start small">
            <p>Fitur ini akan:</p>
            <ul>
                <li>Mencocokkan <b>nama rombel</b> siswa yang belum terhubung ke data rombel</li>
                <li>Mengisi <b>rombelId</b> dan <b>waliKelasNama</b> secara otomatis</li>
            </ul>
            <p class="text-muted">Siswa yang sudah punya rombelId tidak akan diubah.</p>
        </div>`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Mulai Sinkronisasi',
        cancelButtonText: 'Batal'
    });
    if (!res.isConfirmed) return;

    try {
        // Load semua rombel
        const rombelSnap = await db.collection("rombel").get();
        const rombelMap = {}; // namaLower → {id, nama, waliKelasNama}
        rombelSnap.forEach(d => {
            const r = d.data();
            rombelMap[String(r.nama || '').toLowerCase().trim()] = {
                id: d.id,
                nama: r.nama,
                waliKelasNama: r.waliKelasNama || ''
            };
        });

        // Load siswa tanpa rombelId
        const siswaSnap = await db.collection("users")
            .where("role", "==", "siswa").get();

        const batch = db.batch();
        let updated = 0, notFound = 0;

        siswaSnap.forEach(d => {
            const s = d.data();
            if(s.rombelId) return; // sudah terhubung, skip
            const key = String(s.rombelNama || '').toLowerCase().trim();
            if(!key) return;
            const match = rombelMap[key];
            if(match) {
                batch.update(d.ref, {
                    rombelId: match.id,
                    rombelNama: match.nama,
                    waliKelasNama: match.waliKelasNama
                });
                updated++;
            } else {
                notFound++;
            }
        });

        await batch.commit();

        Swal.fire('Sinkronisasi Selesai!',
            `<b>${updated}</b> siswa berhasil ditautkan ke rombel.<br>`
            + (notFound > 0 ? `<span class="text-warning">${notFound} siswa tidak ditemukan pasangan rombelnya.</span>` : ''),
            'success');
        loadSiswa();
    } catch(err) {
        Swal.fire('Gagal', err.message, 'error');
    }
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

// ---------------------------------------------------------
// UI CLOCK UTILITY
// ---------------------------------------------------------
function startUiClock(elementId) {
    const el = document.getElementById(elementId);
    if(!el) return;
    setInterval(() => {
        const now = new Date();
        const str = now.toLocaleTimeString('id-ID', { hour12: false });
        el.textContent = str;
    }, 1000);
}

// ---------------------------------------------------------
// MONITORING & LOGS
// ---------------------------------------------------------
let unsubAdminOnline = null;

function loadMonitor() {
    const listEl = document.getElementById("onlineUsersList");
    const countEl = document.getElementById("countOnlineCard");
    if(!listEl || !countEl) return;
    
    if(unsubAdminOnline) { unsubAdminOnline(); unsubAdminOnline = null; }
    addSystemLog('INFO', 'Memulai monitoring siswa aktif seluruh sekolah...');

    unsubAdminOnline = db.collection("hasilUjian")
        .where("status", "==", "Mengerjakan")
        .onSnapshot(snapshot => {
            const count = snapshot.size;
            countEl.textContent = count;
            
            if(count === 0) {
                listEl.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">Tidak ada siswa ujian aktif</td></tr>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const d = doc.data();
                const kips = d.pelanggaranTab || 0;
                const kipsColor = kips >= 3 ? 'danger' : kips >= 1 ? 'warning' : 'success';
                html += `
                    <tr>
                        <td class="align-middle">
                            <i class="bi bi-person-fill text-primary me-1"></i>
                            <strong>${d.siswaNama || 'N/A'}</strong>
                        </td>
                        <td class="align-middle text-muted" style="font-size:0.75rem;">${d.bankNama || '-'}</td>
                        <td class="align-middle">
                            <span class="badge bg-${kipsColor} rounded-pill shadow-sm" title="Pelanggaran KIPS">${kips}x KIPS</span>
                        </td>
                    </tr>
                `;
            });
            listEl.innerHTML = html;
            addSystemLog('LIVE', `${count} siswa sedang ujian (Realtime)`);
        }, err => {
            addSystemLog('ERROR', 'Gagal memuat monitoring realtime: ' + err.message);
        });

    // Load recent logs
    db.collection("logs")
        .orderBy("timestamp", "desc")
        .limit(40)
        .get()
        .then(snap => {
            // Kita proses dari yang paling lama ke paling baru jika ingin menambahkan di bawah, 
            // tapi addSystemLog kita prepend, jadi kita proses data normal saja.
            snap.forEach(doc => {
                const d = doc.data();
                const ts = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleTimeString('id-ID') : "--:--";
                const msg = formatLogMessage(d);
                addSystemLog(d.action || 'LOG', msg, false, ts);
            });
        });
}

/**
 * Memetakan aksi log menjadi kalimat manusiawi
 */
function formatLogMessage(d) {
    const nama = d.nama || d.userId?.substring(0,8) || 'User';
    const kode = d.bankKode || '';
    const score = d.nilaiPG !== undefined ? ` (Skor: ${d.nilaiPG})` : '';
    const count = d.count ? ` (${d.count}x)` : '';

    switch(d.action) {
        case 'LOGIN': return `<strong>${nama}</strong> telah masuk ke sistem`;
        case 'LOGOUT': return `<strong>${nama}</strong> telah keluar dari sistem`;
        case 'MULAI_UJIAN': return `<strong>${nama}</strong> mulai mengerjakan [${kode}]`;
        case 'SELESAI_UJIAN': return `<strong>${nama}</strong> selesai mengerjakan [${kode}]${score}`;
        case 'TAB_SWITCH': return `<strong>${nama}</strong> terdeteksi pindah tab${count}`;
        default: return `<strong>${nama}</strong> — ${d.action || 'Aktivitas'}`;
    }
}

function addSystemLog(type, message, prepend = true, customTime = null) {
    const box = document.getElementById("systemLogBox");
    if(!box) return;

    const colors = { 
        'ERROR': '#f38ba8', 'WARN': '#fab387', 'INFO': '#89dceb', 
        'LIVE': '#a6e3a1', 'LOG': '#cdd6f4', 'TAB_SWITCH': '#f9e2af',
        'LOGIN': '#cba6f7', 'LOGOUT': '#eba0ac', 'MULAI_UJIAN': '#a6e3a1', 'SELESAI_UJIAN': '#89b4fa'
    };
    const color = colors[type] || '#cdd6f4';
    const time = customTime || new Date().toLocaleTimeString('id-ID');
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid #313244';
    entry.style.padding = '4px 0';
    entry.style.fontSize = '0.85rem';
    entry.innerHTML = `<span style="color:#6c7086;">[${time}]</span> <span style="color:${color};font-weight:bold;display:inline-block;width:110px;">[${type}]</span> <span>${message}</span>`;
    
    if(prepend && box.firstChild) {
        box.insertBefore(entry, box.firstChild);
    } else {
        box.appendChild(entry);
    }
    
    // Limit log entries to 60
    while(box.children.length > 60) box.removeChild(box.lastChild);
}

function clearSystemLog() {
    const box = document.getElementById("systemLogBox");
    if(box) box.innerHTML = '<span style="color:#6c7086;">[System] Log dibersihkan.</span>';
}
