// ============================================================
// GURU.JS - Modul Dashboard Guru
// ============================================================

let mBank, mTugas, mSoalPG, mSoalEssay, mImport;
let bankList = [];
let tugasList = [];

let activeBankId = null;
let activeBankData = null;
let rombelNames = {}; // Global Map: ID -> Nama

document.addEventListener("DOMContentLoaded", () => {
    checkAuth("guru");
    const user = getUserLocal();
    if(user) document.getElementById("guruName").textContent = user.nama;

    const elBank = document.getElementById('modalBank');
    if(elBank) mBank = new bootstrap.Modal(elBank);
    
    const elTugas = document.getElementById('modalTugas');
    if(elTugas) mTugas = new bootstrap.Modal(elTugas);
    
    const elSoalPG = document.getElementById('modalSoalPG');
    if(elSoalPG) mSoalPG = new bootstrap.Modal(elSoalPG);
    
    const elSoalEssay = document.getElementById('modalSoalEssay');
    if(elSoalEssay) mSoalEssay = new bootstrap.Modal(elSoalEssay);
    
    const elImport = document.getElementById('modalImportSoal');
    if(elImport) mImport = new bootstrap.Modal(elImport);

    loadDashboardStats();

    const fBank = document.getElementById("bankForm");
    if(fBank) fBank.addEventListener("submit", handleBankForm);
    
    const fTugas = document.getElementById("tugasForm");
    if(fTugas) fTugas.addEventListener("submit", handleTugasForm);
    
    const fSoalPG = document.getElementById("soalPGForm");
    if(fSoalPG) fSoalPG.addEventListener("submit", handleSoalPGForm);
    
    const fSoalEssay = document.getElementById("soalEssayForm");
    if(fSoalEssay) fSoalEssay.addEventListener("submit", handleSoalEssayForm);
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

// ---------------------------------------------------------
// GANTI PASSWORD GURU (Self-Service)
// ---------------------------------------------------------
let mChangePassGuru;

function initChangePasswordModal() {
    const el = document.getElementById('modalChangePasswordGuru');
    if (el && !mChangePassGuru) mChangePassGuru = new bootstrap.Modal(el);
}

function showChangePasswordModalGuru() {
    initChangePasswordModal();
    const inp = document.getElementById("newPasswordGuru");
    const inp2 = document.getElementById("confirmPasswordGuru");
    if (inp) inp.value = "";
    if (inp2) inp2.value = "";
    if (mChangePassGuru) mChangePassGuru.show();
}

async function handleGantiPasswordGuru() {
    const newPass = document.getElementById("newPasswordGuru")?.value || "";
    const confPass = document.getElementById("confirmPasswordGuru")?.value || "";

    if (newPass.length < 6) {
        return Swal.fire('Error', 'Password minimal 6 karakter!', 'error');
    }
    if (newPass !== confPass) {
        return Swal.fire('Error', 'Konfirmasi password tidak cocok!', 'error');
    }

    try {
        const user = getUserLocal();
        if (!user || !user.uid) {
            return Swal.fire('Error', 'Sesi tidak ditemukan. Silakan login ulang.', 'error');
        }
        await db.collection("users").doc(user.uid).update({ passwordPlain: newPass });
        Swal.fire('Berhasil!', 'Password Anda telah diperbarui.', 'success');
        if (mChangePassGuru) mChangePassGuru.hide();
    } catch (err) {
        Swal.fire('Gagal', err.message, 'error');
    }
}

function showPage(pageId, navElement) {
    document.querySelectorAll('.guru-page').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');
    
    document.querySelectorAll('.cbt-sidebar-link').forEach(el => el.classList.remove('active'));
    navElement.classList.add('active');

    if(pageId === 'beranda') loadDashboardStats();
    if(pageId === 'banksoal') loadBankSoal();
    if(pageId === 'penugasan') {
        loadBankSoalDropdown();
        loadPenugasan();
    }
    if(pageId === 'hasil') {
        loadHasilRombelCards();
    }
}

// ---------------------------------------------------------
// BERANDA
// ---------------------------------------------------------
let unsubOnline = null;

function loadDashboardStats() {
    const user = getUserLocal();
    if(!user) return;

    db.collection("bankSoal").where("guruId", "==", user.uid).get().then(snap => {
        document.getElementById("countBank").textContent = snap.size;
    });

    db.collection("penugasan").where("guruId", "==", user.uid).get().then(snap => {
        document.getElementById("countTugas").textContent = snap.size;
        renderTugasDashboard(snap);
    }).catch(err => {
        console.error("Error stats:", err);
        document.getElementById("tugasDashboardTableBody").innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>`;
    });
    
    // Monitoring: Start realtime listener
    loadOnlineMonitoring();
}

function loadOnlineMonitoring() {
    const listEl = document.getElementById("onlineUsersList");
    const countEl = document.getElementById("countOnline");
    if(!listEl || !countEl) return;
    
    // Unsubscribe previous listener if exists
    if(unsubOnline) { unsubOnline(); unsubOnline = null; }
    
    addSystemLog('INFO', 'Memulai monitoring siswa aktif...');

    unsubOnline = db.collection("hasilUjian")
        .where("status", "==", "Mengerjakan")
        .onSnapshot(snapshot => {
            const count = snapshot.size;
            countEl.textContent = count;
            
            if(count === 0) {
                listEl.innerHTML = '<div class="text-center text-muted py-3"><i class="bi bi-emoji-smile"></i> Tidak ada siswa aktif</div>';
                return;
            }
            
            let html = '<ul class="list-group list-group-flush">';
            snapshot.forEach(doc => {
                const d = doc.data();
                const kips = d.pelanggaranTab || 0;
                const kipsColor = kips >= 3 ? 'danger' : kips >= 1 ? 'warning' : 'success';
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                        <div>
                            <i class="bi bi-person-fill text-primary me-1"></i>
                            <strong>${d.siswaNama || 'N/A'}</strong>
                            <div class="text-muted" style="font-size:0.75rem;">${d.bankNama || ''}</div>
                        </div>
                        <span class="badge bg-${kipsColor} rounded-pill" title="Pelanggaran KIPS">${kips}x KIPS</span>
                    </li>
                `;
            });
            html += '</ul>';
            listEl.innerHTML = html;
            
            addSystemLog('LIVE', `${count} siswa sedang mengerjakan ujian`);
        }, err => {
            addSystemLog('ERROR', 'Gagal memuat monitoring: ' + err.message);
        });
    
    // Load recent logs from Firestore
    db.collection("logs")
        .orderBy("timestamp", "desc")
        .limit(30)
        .get()
        .then(snap => {
            snap.forEach(doc => {
                const d = doc.data();
                const ts = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleTimeString('id-ID') : "--:--";
                addSystemLog(d.action || 'LOG', `[${ts}] ${d.userId?.substring(0,8)}... — ${d.action} (${d.count ?? ''})`, false);
            });
        });
}

function addSystemLog(type, message, prepend = true) {
    const box = document.getElementById("systemLogBox");
    if(!box) return;
    
    const colors = { 'ERROR': '#f38ba8', 'WARN': '#fab387', 'INFO': '#89dceb', 'LIVE': '#a6e3a1', 'LOG': '#cdd6f4', 'TAB_SWITCH': '#f9e2af' };
    const color = colors[type] || '#cdd6f4';
    const time = new Date().toLocaleTimeString('id-ID');
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid #313244';
    entry.style.paddingBottom = '2px';
    entry.style.marginBottom = '2px';
    entry.innerHTML = `<span style="color:#6c7086;">[${time}]</span> <span style="color:${color};font-weight:bold;">[${type}]</span> <span>${message}</span>`;
    
    if(prepend && box.firstChild) {
        box.insertBefore(entry, box.firstChild);
    } else {
        box.appendChild(entry);
    }
    
    // Limit log entries to 50
    while(box.children.length > 50) box.removeChild(box.lastChild);
}

function clearSystemLog() {
    const box = document.getElementById("systemLogBox");
    if(box) box.innerHTML = '<span style="color:#6c7086;">[System] Log dibersihkan.</span>';
}

function renderTugasDashboard(snapshot) {
    let html = '';
    if(snapshot.empty) {
        document.getElementById("tugasDashboardTableBody").innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada tugas aktif</td></tr>`;
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        html += `
            <tr>
                <td><strong>${data.bankKode}</strong><br><small class="text-muted">${data.bankNama}</small></td>
                <td><span class="badge bg-light text-dark text-uppercase border">${data.semester} - ${data.jenis}</span><br><small class="text-primary fw-bold" style="font-size:0.7rem;">Target: ${data.rombelTarget === 'all' ? 'Semua' : (rombelNames[data.rombelTarget] || data.rombelTarget || '-')}</small></td>
                <td>${data.durasi}m</td>
                <td><span class="badge ${data.aktif ? 'bg-success' : 'bg-danger'} shadow-sm">${data.aktif ? 'Aktif' : 'Non'}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary border" onclick="showPage('penugasan', document.querySelector('.cbt-sidebar-link:nth-child(3)'))"><i class="bi bi-chevron-right"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById("tugasDashboardTableBody").innerHTML = html;
}

// ---------------------------------------------------------
// BANK SOAL
// ---------------------------------------------------------
function loadBankSoal() {
    const user = getUserLocal();
    db.collection("bankSoal").where("guruId", "==", user.uid).orderBy("createdAt", "desc").get().then((snapshot) => {
        bankList = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            bankList.push(data);
            
            const pgCount = data.soalPG ? data.soalPG.length : 0;
            const essayCount = data.soalEssay ? data.soalEssay.length : 0;

            html += `
                <tr>
                    <td><strong>${data.kode}</strong></td>
                    <td class="fw-bold text-primary">${data.nama}</td>
                    <td><small class="text-muted">${data.deskripsi || '-'}</small></td>
                    <td><span class="badge bg-secondary rounded-pill py-2 px-3">${pgCount} PG, ${essayCount} Essay</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-info text-white me-1 shadow-sm" onclick="bukaManajemenSoal('${data.id}')"><i class="bi bi-list-check"></i> Kelola Soal</button>
                        <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="editBank('${data.id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger shadow-sm ms-1" onclick="deleteBank('${data.id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("bankTableBody").innerHTML = html || `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada bank soal, silakan buat.</td></tr>`;
    });
}

function showBankModal() {
    document.getElementById("bankForm").reset();
    document.getElementById("bankId").value = "";
    document.getElementById("modalBankTitle").textContent = "Buat Bank Soal Baru";
    mBank.show();
}

function editBank(id) {
    const data = bankList.find(b => b.id === id);
    if(!data) return;

    document.getElementById("bankId").value = data.id;
    document.getElementById("bankKode").value = data.kode;
    document.getElementById("bankNama").value = data.nama;
    document.getElementById("bankDeskripsi").value = data.deskripsi;
    document.getElementById("modalBankTitle").textContent = "Edit Informasi Bank Soal";

    mBank.show();
}

async function handleBankForm(e) {
    e.preventDefault();
    const id = document.getElementById("bankId").value;
    const kode = document.getElementById("bankKode").value;
    const nama = document.getElementById("bankNama").value;
    const deskripsi = document.getElementById("bankDeskripsi").value;

    const payload = {
        kode, nama, deskripsi,
        guruId: getUserLocal().uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if(id) {
            await db.collection("bankSoal").doc(id).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            payload.soalPG = [];
            payload.soalEssay = [];
            await db.collection("bankSoal").add(payload);
        }
        mBank.hide();
        loadBankSoal();
        Swal.fire('Tersimpan!', 'Informasi Bank Soal berhasil disimpan.', 'success');
    } catch(e) {
        Swal.fire('Gagal Menyimpan', e.message, 'error');
    }
}

function deleteBank(id) {
    Swal.fire({
        title: 'Hapus Bank Soal?',
        text: "Seluruh penugasan yang memakai soal ini mungkin akan ikut rusak!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection("bankSoal").doc(id).delete().then(() => loadBankSoal());
        }
    });
}

// ---------------------------------------------------------
// MANAJEMEN SOAL (CRUD INDIVIDUAL)
// ---------------------------------------------------------

async function bukaManajemenSoal(id) {
    activeBankId = id;
    const data = bankList.find(b => b.id === id);
    if(!data) return;
    activeBankData = data;
    
    document.getElementById("manajemenBankTitle").textContent = `Kelola Soal: ${data.kode} - ${data.nama}`;
    renderDaftarSoal();
    
    // Pindah ke sub-page manajemen soal
    showPage('manajemen-soal', document.querySelector('.cbt-sidebar-link:nth-child(2)'));
}

function renderDaftarSoal() {
    if(!activeBankData) return;
    
    // Render PG
    const pg = activeBankData.soalPG || [];
    let htmlPG = '';
    pg.forEach((item, index) => {
        const charKunci = String.fromCharCode(65 + parseInt(item.jawaban));
        const opsiText = (item.opsi || []).map((o, i) => {
            let t = typeof o === 'object' ? o.text : o;
            let imgBadge = (typeof o === 'object' && o.img) ? ' <i class="bi bi-image text-success" title="Ada Gambar"></i>' : '';
            return `${String.fromCharCode(65+i)}: ${t}${imgBadge}`;
        }).join(' | ');

        let qImgBadge = item.gambar ? '<span class="badge bg-info mt-1"><i class="bi bi-image"></i> Gambar</span>' : '';

        htmlPG += `
            <tr>
                <td class="text-center fw-bold text-muted">${index + 1}</td>
                <td>
                    <div class="mb-1">${item.pertanyaan} <br>${qImgBadge}</div>
                    <small class="text-muted d-block mt-1">${opsiText}</small>
                </td>
                <td class="fw-bold text-success">Opsi ${charKunci}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary" onclick="editSoalPG(${index})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteSoalPG(${index})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById("soalPGTableBody").innerHTML = htmlPG || `<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada soal PG.</td></tr>`;

    // Render Essay
    const essay = activeBankData.soalEssay || [];
    let htmlEssay = '';
    essay.forEach((item, index) => {
        let eImgBadge = item.gambar ? '<span class="badge bg-info mt-1"><i class="bi bi-image"></i> Gambar</span>' : '';
        htmlEssay += `
            <tr>
                <td class="text-center fw-bold text-muted">${index + 1}</td>
                <td><div class="text-wrap">${item.pertanyaan} <br>${eImgBadge}</div></td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary" onclick="editSoalEssay(${index})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteSoalEssay(${index})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById("soalEssayTableBody").innerHTML = htmlEssay || `<tr><td colspan="3" class="text-center py-4 text-muted">Belum ada soal Essay.</td></tr>`;
}

// -- ACTION PG DINAMIS --
let currentOpsiCount = 0;

function renderOpsiInputs(opsiArray = []) {
    const container = document.getElementById("pgOpsiContainer");
    const select = document.getElementById("pgJawaban");
    if(!container || !select) return;
    
    container.innerHTML = "";
    select.innerHTML = "";
    
    currentOpsiCount = opsiArray.length;

    if (currentOpsiCount === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "-- Belum ada opsi ditambahkan --";
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
    }
    
    opsiArray.forEach((val, i) => {
        const char = String.fromCharCode(65 + i);
        // Input Opsi
        const div = document.createElement("div");
        div.className = "mb-3 p-2 border rounded bg-light";
        
        // Cek kalau valualunya adalah object { text, img } vs text doang
        let textVal = typeof val === 'object' ? (val.text || '') : val;
        let imgVal = typeof val === 'object' ? (val.img || '') : '';

        div.innerHTML = `
            <label class="form-label fw-medium text-muted small">Opsi ${char}</label>
            <input type="text" class="form-control cbt-input pg-opsi-input mb-2" data-index="${i}" value="${textVal}" required>
            
            <label class="form-label text-muted small" style="font-size:0.75rem;"><i class="bi bi-image"></i> Gambar Opsi (Opsional)</label>
            <div class="input-group input-group-sm">
                <input type="text" id="pgOpsiImg_${i}" class="form-control pg-opsi-img-input" value="${imgVal}" placeholder="URL/Base64">
                <input type="file" id="pgOpsiFile_${i}" class="d-none" accept="image/*" onchange="encodeImgToBase64(this, 'pgOpsiImg_${i}')">
                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('pgOpsiFile_${i}').click()"><i class="bi bi-folder2-open"></i></button>
            </div>
        `;
        container.appendChild(div);
        
        // Option di Kunci Jawaban
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `Opsi ${char}`;
        select.appendChild(opt);
    });
}

function tambahInputOpsi() {
    if(currentOpsiCount >= 26) return; 
    const container = document.getElementById("pgOpsiContainer");
    const select = document.getElementById("pgJawaban");
    if(!container || !select) return;
    
    if(currentOpsiCount === 0) select.innerHTML = "";

    const i = currentOpsiCount;
    const char = String.fromCharCode(65 + i);
    
    const div = document.createElement("div");
    div.className = "mb-3 p-2 border rounded bg-light";
    div.innerHTML = `
        <label class="form-label fw-medium text-muted small">Opsi ${char}</label>
        <input type="text" class="form-control cbt-input pg-opsi-input mb-2" data-index="${i}" required>
        
        <label class="form-label text-muted small" style="font-size:0.75rem;"><i class="bi bi-image"></i> Gambar Opsi (Opsional)</label>
        <div class="input-group input-group-sm">
            <input type="text" id="pgOpsiImg_${i}" class="form-control pg-opsi-img-input" placeholder="URL/Base64">
            <input type="file" id="pgOpsiFile_${i}" class="d-none" accept="image/*" onchange="encodeImgToBase64(this, 'pgOpsiImg_${i}')">
            <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('pgOpsiFile_${i}').click()"><i class="bi bi-folder2-open"></i></button>
        </div>
    `;
    container.appendChild(div);
    
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Opsi ${char}`;
    select.appendChild(opt);
    
    currentOpsiCount++;
}

function hapusInputOpsiTerakhir() {
    if(currentOpsiCount <= 0) return; 
    const container = document.getElementById("pgOpsiContainer");
    const select = document.getElementById("pgJawaban");
    if(!container || !select) return;
    
    container.removeChild(container.lastChild);
    select.removeChild(select.lastChild);
    
    currentOpsiCount--;

    if(currentOpsiCount === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "-- Belum ada opsi ditambahkan --";
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
    }
}

function showSoalPGModal() {
    const f = document.getElementById("soalPGForm");
    if(f) f.reset();
    const elIdx = document.getElementById("soalPGIndex");
    if(elIdx) elIdx.value = "";
    document.getElementById("pgPertanyaanImg").value = "";
    renderOpsiInputs([]); // Start with 0 options
    if(mSoalPG) mSoalPG.show();
}

function editSoalPG(index) {
    if(!activeBankData || !activeBankData.soalPG) return;
    const item = activeBankData.soalPG[index];
    if(!item) return;

    const elIdx = document.getElementById("soalPGIndex");
    const elPert = document.getElementById("pgPertanyaan");
    const elPertImg = document.getElementById("pgPertanyaanImg");
    const elJawaban = document.getElementById("pgJawaban");

    if(elIdx) elIdx.value = index;
    if(elPert) elPert.value = item.pertanyaan;
    if(elPertImg) elPertImg.value = item.gambar || "";
    
    renderOpsiInputs(item.opsi || []);
    if(elJawaban) elJawaban.value = item.jawaban;
    
    if(mSoalPG) mSoalPG.show();
}

function deleteSoalPG(index) {
    Swal.fire({ title: 'Hapus soal PG ini?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya' }).then(async (result) => {
        if(result.isConfirmed) {
            let newPG = [...activeBankData.soalPG];
            newPG.splice(index, 1);
            await db.collection("bankSoal").doc(activeBankId).update({ soalPG: newPG });
            activeBankData.soalPG = newPG;
            renderDaftarSoal();
        }
    });
}

// -- ACTION ESSAY --
function showSoalEssayModal() {
    const f = document.getElementById("soalEssayForm");
    if(f) f.reset();
    const elIdx = document.getElementById("soalEssayIndex");
    if(elIdx) elIdx.value = "";
    document.getElementById("essayPertanyaanImg").value = "";
    if(mSoalEssay) mSoalEssay.show();
}

function editSoalEssay(index) {
    const item = activeBankData.soalEssay[index];
    const elIdx = document.getElementById("soalEssayIndex");
    const elPert = document.getElementById("essayPertanyaan");
    const elPertImg = document.getElementById("essayPertanyaanImg");
    if(elIdx) elIdx.value = index;
    if(elPert) elPert.value = item.pertanyaan;
    if(elPertImg) elPertImg.value = item.gambar || "";
    if(mSoalEssay) mSoalEssay.show();
}

function deleteSoalEssay(index) {
    Swal.fire({ title: 'Hapus soal Essay ini?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya' }).then(async (result) => {
        if(result.isConfirmed) {
            let newEssay = [...activeBankData.soalEssay];
            newEssay.splice(index, 1);
            await db.collection("bankSoal").doc(activeBankId).update({ soalEssay: newEssay });
            activeBankData.soalEssay = newEssay;
            renderDaftarSoal();
        }
    });
}

async function handleSoalPGForm(e) {
    e.preventDefault();
    const idx = document.getElementById("soalPGIndex").value;
    
    // Ambil semua value dari input opsi
    const opsiInputs = document.querySelectorAll(".pg-opsi-input");
    const opsiImgInputs = document.querySelectorAll(".pg-opsi-img-input");
    const opsi = [];
    
    opsiInputs.forEach((inp, idx) => {
        const textVal = inp.value;
        const imgVal = opsiImgInputs[idx] ? opsiImgInputs[idx].value : "";
        
        // Simpan sebagai object kalau ada gambar
        if (imgVal.trim() !== "") {
            opsi.push({ text: textVal, img: imgVal });
        } else {
            opsi.push(textVal); // Tetap string untuk back-compatibility
        }
    });

    const item = {
        id: document.getElementById("soalPGId")?.value || Math.random().toString(36).substring(7),
        pertanyaan: document.getElementById("pgPertanyaan").value,
        gambar: document.getElementById("pgPertanyaanImg").value,
        opsi: opsi,
        jawaban: parseInt(document.getElementById("pgJawaban").value)
    };

    let newPG = [...(activeBankData.soalPG || [])];
    if(idx !== "") {
        newPG[parseInt(idx)] = item; // Edit
    } else {
        newPG.push(item); // Tambah
    }

    try {
        await db.collection("bankSoal").doc(activeBankId).update({ soalPG: newPG });
        activeBankData.soalPG = newPG;
        mSoalPG.hide();
        renderDaftarSoal();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Soal PG disimpan', showConfirmButton: false, timer: 1500 });
    } catch(err) {
        Swal.fire('Gagal Menyimpan', err.message, 'error');
    }
}

async function handleSoalEssayForm(e) {
    e.preventDefault();
    const idx = document.getElementById("soalEssayIndex").value;
    const item = {
        id: document.getElementById("soalEssayId")?.value || Math.random().toString(36).substring(7),
        pertanyaan: document.getElementById("essayPertanyaan").value,
        gambar: document.getElementById("essayPertanyaanImg").value
    };

    let newEssay = [...(activeBankData.soalEssay || [])];
    if(idx !== "") {
        newEssay[parseInt(idx)] = item;
    } else {
        newEssay.push(item);
    }

    try {
        await db.collection("bankSoal").doc(activeBankId).update({ soalEssay: newEssay });
        activeBankData.soalEssay = newEssay;
        mSoalEssay.hide();
        renderDaftarSoal();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Soal Essay disimpan', showConfirmButton: false, timer: 1500 });
    } catch(err) {
        Swal.fire('Gagal Menyimpan', err.message, 'error');
    }
}

// -- HELPER: IMAGE URL to BASE64 --
function encodeImgToBase64(fileInput, targetId) {
    const file = fileInput.files[0];
    if(!file) return;

    // Validate size (max 1 MB) -> To avoid huge document sizes slowing firestore
    if(file.size > 1024 * 1024) {
        Swal.fire('File Terlalu Besar', 'Maksimal ukuran gambar 1 MB.', 'warning');
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        const targetEl = document.getElementById(targetId);
        if(targetEl) targetEl.value = base64;
    };
    reader.readAsDataURL(file);
}

// -- ACTION IMPORT EXCEL --
function showImportSoalModal() {
    const elFile = document.getElementById("fileExcelSoal");
    if(elFile) elFile.value = "";
    if(mImport) mImport.show();
}

async function prosesImportExcel() {
    const fileNode = document.getElementById("fileExcelSoal");
    const file = fileNode.files[0];
    if(!file) {
        Swal.fire('Pilih File', 'Silakan pilih file Excel terlebih dahulu.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        let newPG = [...(activeBankData.soalPG || [])];
        let newEssay = [...(activeBankData.soalEssay || [])];
        let importedCount = 0;

        // Ekspektasi Kolom: Tipe (PG/ESSAY), Pertanyaan, Opsi_A, Opsi_B, Opsi_C, Opsi_D, Jawaban_Index
        jsonData.forEach(row => {
            const tipe = (row.Tipe || '').toString().toUpperCase().trim();
            const qId = Math.random().toString(36).substring(7);
            if(tipe === 'PG') {
                newPG.push({
                    id: qId,
                    pertanyaan: row.Pertanyaan || '',
                    opsi: [row.Opsi_A || '', row.Opsi_B || '', row.Opsi_C || '', row.Opsi_D || ''],
                    jawaban: parseInt(row.Jawaban_Index) || 0
                });
                importedCount++;
            } else if(tipe === 'ESSAY') {
                newEssay.push({
                    id: qId,
                    pertanyaan: row.Pertanyaan || ''
                });
                importedCount++;
            }
        });

        if(importedCount === 0) {
            Swal.fire('Format Salah', 'Tidak ada data valid yang bisa diimport. Pastikan format kolom sesuai.', 'error');
            return;
        }

        try {
            await db.collection("bankSoal").doc(activeBankId).update({
                soalPG: newPG,
                soalEssay: newEssay
            });
            activeBankData.soalPG = newPG;
            activeBankData.soalEssay = newEssay;
            
            if(mImport) mImport.hide();
            renderDaftarSoal();
            Swal.fire('Import Berhasil!', `${importedCount} soal telah ditambahkan.`, 'success');
        } catch(err) {
            Swal.fire('Gagal Simpan', err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

// ---------------------------------------------------------
// PENUGASAN (TUGAS UJIAN)
// ---------------------------------------------------------
function loadBankSoalDropdown() {
    const user = getUserLocal();
    db.collection("bankSoal").where("guruId", "==", user.uid).get().then(snap => {
        let h = '<option value="">-- Pilih Bank Soal --</option>';
        snap.forEach(doc => {
            h += `<option value="${doc.id}">[${doc.data().kode}] ${doc.data().nama}</option>`;
        });
        document.getElementById("tugasBankId").innerHTML = h;
    });

    // Juga load Rombel untuk Target
    db.collection("rombel").get().then(snap => {
        let h = '<option value="all">Semua Rombel</option>';
        rombelNames = {}; // Reset/Refresh mapping
        snap.forEach(doc => {
            const data = doc.data();
            const n = data.nama || data.rombelNama || "Tanpa Nama";
            rombelNames[doc.id] = n;
            h += `<option value="${doc.id}">${n}</option>`;
        });
        const el = document.getElementById("tugasRombel");
        if(el) el.innerHTML = h;
    });
}

function showTugasModal() {
    document.getElementById("tugasForm").reset();
    mTugas.show();
}

function loadPenugasan() {
    const user = getUserLocal();
    db.collection("penugasan").where("guruId", "==", user.uid).get().then((snapshot) => {
        tugasList = [];
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            tugasList.push(data);
            
            html += `
                <tr>
                    <td><strong>${data.bankKode}</strong><br><small>${data.bankNama}</small></td>
                    <td><span class="badge bg-secondary text-uppercase">${data.semester} - ${data.jenis}</span></td>
                    <td><span class="badge bg-info text-white text-uppercase shadow-sm">${data.rombelTarget === 'all' ? 'Semua Rombel' : (rombelNames[data.rombelTarget] || data.rombelTarget || '-')}</span></td>
                    <td>
                        <div class="small fw-bold text-dark"><i class="bi bi-calendar-event me-1"></i> ${data.mulai ? data.mulai.replace('T', ' ') : '-'}</div>
                        <div class="small text-muted"><i class="bi bi-calendar-x me-1"></i> ${data.selesai ? data.selesai.replace('T', ' ') : '-'}</div>
                    </td>
                    <td>${data.durasi}m</td>
                    <td>
                        <div class="form-check form-switch d-flex justify-content-center mt-1">
                            <input class="form-check-input" style="cursor:pointer;" type="checkbox" onchange="toggleTampilNilai('${data.id}', this.checked)" ${data.tampilNilai ? 'checked' : ''}>
                        </div>
                    </td>
                <td>
                    <button class="btn btn-sm ${data.aktif ? 'btn-danger' : 'btn-success'} w-100" onclick="toggleTugas('${data.id}', ${!data.aktif})">
                        <i class="bi ${data.aktif ? 'bi-stop-circle' : 'bi-play-circle'}"></i> Set ${data.aktif ? '  Off' : '  On'}
                    </button>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTugas('${data.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
            `;
        });
        document.getElementById("tugasTableBody").innerHTML = html || `<tr><td colspan="6" class="text-center">Belum ada penugasan</td></tr>`;
    }).catch(err => {
        console.error(err);
        document.getElementById("tugasTableBody").innerHTML = `<tr><td colspan="6" class="text-center text-danger">Gagal memuat: ${err.message}</td></tr>`;
    });
}

async function handleTugasForm(e) {
    e.preventDefault();
    const bankId = document.getElementById("tugasBankId").value;
    
    // Ambil detail bank soal agar tersimpan di riwayat
    const bankDoc = await db.collection("bankSoal").doc(bankId).get();
    if(!bankDoc.exists) return;
    const b = bankDoc.data();

    const payload = {
        guruId: getUserLocal().uid,
        bankId: bankId,
        bankKode: b.kode,
        bankNama: b.nama,
        semester: document.getElementById("tugasSemester").value,
        jenis: document.getElementById("tugasJenis").value,
        durasi: parseInt(document.getElementById("tugasDurasi").value),
        acakSingkat: document.getElementById("tugasAcak").value === 'true',
        kipsEnabled: document.getElementById("tugasKips").checked,
        aktif: document.getElementById("tugasAktif").checked,
        tampilNilai: document.getElementById("tugasTampilNilai").value === "true",
        mulai: document.getElementById("tugasMulai").value, // ISO string from datetime-local
        selesai: document.getElementById("tugasSelesai").value,
        rombelTarget: document.getElementById("tugasRombel")?.value || 'all',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Cek duplikasi
        const existing = await db.collection("penugasan")
            .where("guruId", "==", payload.guruId)
            .where("bankId", "==", payload.bankId)
            .where("semester", "==", payload.semester)
            .where("jenis", "==", payload.jenis)
            .get();

        if(!existing.empty) {
            // Jika sudah ada, update saja daripada duplikat
             const docId = existing.docs[0].id;
             await db.collection("penugasan").doc(docId).update({
                 durasi: payload.durasi,
                 acakSingkat: payload.acakSingkat,
                 kipsEnabled: payload.kipsEnabled,
                 aktif: payload.aktif,
                 tampilNilai: payload.tampilNilai
             });
             Swal.fire('Tugas Diperbarui!', 'Hanya informasi jadwal yang diperbarui karena paket yang sama sudah ditugaskan.', 'success');
        } else {
             await db.collection("penugasan").add(payload);
             Swal.fire('Tugas Dipublikasikan!', 'Siswa sekarang dapat melihat asesmen ini.', 'success');
        }

        mTugas.hide();
        loadPenugasan();
        loadDashboardStats(); // Refresh beranda
    } catch (e) {
        Swal.fire('Gagal Menerbitkan', e.message, 'error');
    }
}

function toggleTugas(id, isActive) {
    db.collection("penugasan").doc(id).update({ aktif: isActive }).then(() => loadPenugasan());
}

function toggleTampilNilai(id, isShow) {
    db.collection("penugasan").doc(id).update({ tampilNilai: isShow }).then(() => {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Visibilitas Nilai Diperbarui', showConfirmButton: false, timer: 1500 });
    });
}

function deleteTugas(id) {
    Swal.fire({
        title: 'Hapus Penugasan?',
        text: "Tugas ini tidak akan muncul lagi di panel siswa.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection("penugasan").doc(id).delete().then(() => loadPenugasan());
        }
    });
}

// ---------------------------------------------------------
// HASIL (NILAI) & ROMBEL CARDS
// ---------------------------------------------------------
let activeRombelIdHasil = null;

function loadHasilRombelCards() {
    const container = document.getElementById("hasilRombelCards");
    container.innerHTML = '<div class="col-12 text-center text-muted"><div class="spinner-border text-primary"></div><p>Memuat Rombel...</p></div>';
    
    // Fetch semua rombel
    db.collection("rombel").get().then(snap => {
        if(snap.empty) {
            container.innerHTML = '<div class="col-12 text-center text-muted">Belum ada kelas/rombel yang terdaftar</div>';
            return;
        }
        
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            // Optional: Count students async, but for simplicity we just render the cards.
            html += `
                <div class="col-md-4 col-sm-6">
                    <div class="card shadow-sm border-0 h-100" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="openRombelHasil('${doc.id}', '${data.nama}')">
                        <div class="card-body text-center p-4">
                            <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style="width: 60px; height: 60px;">
                                <i class="bi bi-people-fill text-primary fs-3"></i>
                            </div>
                            <h5 class="fw-bold mb-1">${data.nama}</h5>
                            <p class="text-muted small mb-0">Klik untuk melihat hasil ujian</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }).catch(err => {
        container.innerHTML = `<div class="col-12 text-center text-danger">Gagal memuat rombel: ${err.message}</div>`;
    });
}

function showHasilRombelCards() {
    activeRombelIdHasil = null;
    document.getElementById("hasilTitle").textContent = "Hasil Ujian: Pilih Rombel";
    document.getElementById("hasilFilterAction").classList.add("d-none");
    document.getElementById("hasilTabelCard").classList.add("d-none");
    document.getElementById("hasilRombelCards").classList.remove("d-none");
    loadHasilRombelCards();
}

function openRombelHasil(rombelId, rombelNama) {
    activeRombelIdHasil = rombelId;
    document.getElementById("hasilTitle").textContent = `Hasil Ujian: ${rombelNama}`;
    document.getElementById("hasilRombelCards").classList.add("d-none");
    document.getElementById("hasilFilterAction").classList.remove("d-none");
    document.getElementById("hasilTabelCard").classList.remove("d-none");
    
    // Reset dropdown and table
    document.getElementById("filterTugasHasil").innerHTML = '<option value="">-- Pilih Penugasan --</option>';
    document.getElementById("hasilTableBody").innerHTML = `<tr><td colspan="7" class="text-center">Pilih penugasan dulu</td></tr>`;
    
    loadPenugasanDropdownHasil();
}

function loadPenugasanDropdownHasil() {
    const user = getUserLocal();
    db.collection("penugasan").where("guruId", "==", user.uid).get().then(snap => {
        let h = '<option value="">-- Pilih Penugasan --</option>';
        snap.forEach(doc => {
            const sd = doc.data();
            const label = `[${sd.jenis.toUpperCase()} - ${sd.semester}] ${sd.bankNama}`;
            h += `<option value="${doc.id}">${label}</option>`;
        });
        document.getElementById("filterTugasHasil").innerHTML = h;
    });
}

async function loadHasilByRombel() {
    const tugasId = document.getElementById("filterTugasHasil").value;
    const body = document.getElementById("hasilTableBody");
    
    if(!tugasId || !activeRombelIdHasil) {
        body.innerHTML = `<tr><td colspan="7" class="text-center">Pilih penugasan dulu</td></tr>`;
        return;
    }

    body.innerHTML = `<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary spinner-border-sm"></div> Memuat data siswa...</td></tr>`;

    try {
        // Ambil semua siswa di rombel ini
        const siswaSnap = await db.collection("users")
            .where("role", "==", "siswa")
            .where("rombelId", "==", activeRombelIdHasil)
            .get();
            
        if(siswaSnap.empty) {
            body.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Tidak ada siswa di rombel ini.</td></tr>`;
            return;
        }

        const listSiswa = [];
        siswaSnap.forEach(s => {
            listSiswa.push({ id: s.id, nama: s.data().nama });
        });
        
        // Ambil hasil ujian di penugasan ini
        const hasilSnap = await db.collection("hasilUjian")
            .where("penugasanId", "==", tugasId)
            .get();
            
        const dictHasil = {};
        hasilSnap.forEach(h => {
            const data = h.data();
            dictHasil[data.siswaId] = Object.assign(data, { docId: h.id });
        });
        
        // Render Gabungan (Semua Siswa Rombel)
        let html = '';
        listSiswa.forEach(siswa => {
            const hasil = dictHasil[siswa.id];
            
            if(!hasil) {
                // Belum Mengerjakan
                html += `
                    <tr>
                        <td><strong>${siswa.nama}</strong></td>
                        <td><span class="badge bg-secondary">Belum</span></td>
                        <td class="text-muted">-</td>
                        <td class="text-muted">-</td>
                        <td class="text-muted fw-bold">-</td>
                        <td class="text-muted">-</td>
                        <td class="text-muted">-</td>
                        <td>-</td>
                    </tr>
                `;
            } else {
                // Mengerjakan atau Selesai
                const nilaiPG = hasil.nilaiPG ?? 0;
                const nilaiEssay = hasil.nilaiEssay;
                const nilaiAkhir = hasil.nilaiAkhir;
                
                // Threshold kelulusan pada nilai akhir 60
                const scoreClassAkhir = (nilaiAkhir !== null && nilaiAkhir !== undefined)
                    ? (nilaiAkhir >= 60 ? 'text-success' : 'text-danger')
                    : '';
                
                let statusBadge = '';
                if(hasil.status === 'Selesai') statusBadge = 'bg-success';
                else if(hasil.status === 'Mengerjakan') statusBadge = 'bg-primary';
                else statusBadge = 'bg-warning text-dark';
                
                const maxEssay = hasil.maxNilaiEssay ?? (hasil.totalEssay && hasil.nilaiPerSoal ? hasil.totalEssay * hasil.nilaiPerSoal : '-');
                
                let actionBtns = '';
                if(hasil.status === 'Selesai' || hasil.status === 'Menunggu Koreksi') {
                     actionBtns += `<button class="btn btn-sm btn-outline-primary me-1" onclick="koreksiEssay('${hasil.docId}')" title="Koreksi Essay"><i class="bi bi-pencil-square"></i> Koreksi</button>`;
                     actionBtns += `<button class="btn btn-sm btn-outline-danger" onclick="resetUjianSiswa('${hasil.docId}')" title="Reset Total"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>`;
                } else if(hasil.status === 'Mengerjakan' || hasil.status === 'Waktu Habis') {
                     actionBtns += `<button class="btn btn-sm btn-danger" onclick="resetUjianSiswa('${hasil.docId}')" title="Force Reset"><i class="bi bi-x-circle"></i> Force Reset</button>`;
                }

                html += `
                    <tr>
                        <td><strong>${siswa.nama}</strong></td>
                        <td><span class="badge ${statusBadge}">${hasil.status}</span></td>
                        <td>${nilaiPG}</td>
                        <td>${nilaiEssay !== null && nilaiEssay !== undefined ? nilaiEssay + ' / ' + maxEssay : '<span class="text-warning small">Belum dikoreksi</span>'}</td>
                        <td class="fw-bold fs-6 ${scoreClassAkhir}">${nilaiAkhir !== null && nilaiAkhir !== undefined ? nilaiAkhir : '-'}</td>
                        <td>${formatWaktuUjian(hasil.waktuBerapaLama)}</td>
                        <td><span class="badge bg-danger">${hasil.pelanggaranTab || 0}x</span></td>
                        <td>${actionBtns}</td>
                    </tr>
                `;
            }
        });
        
        body.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        body.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Gagal memuat hasil: ${err.message}</td></tr>`;
    }
}

function formatWaktuUjian(seconds) {
    if(seconds === undefined || seconds === null) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m} mnt ${s} dtk`;
}

function resetUjianSiswa(hasilId) {
    Swal.fire({
        title: 'Reset Total Ujian Siswa?',
        text: 'Tindakan ini akan MENGHAPUS SELURUH JAWABAN yang sudah dibuat siswa ini untuk penugasan ini. Siswa akan dipaksa mengulang dari awal (jika ujian masih aktif).',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Reset Total Pengerjaan',
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Batal'
    }).then((res) => {
        if(res.isConfirmed) {
            db.collection("hasilUjian").doc(hasilId).delete().then(() => {
                Swal.fire('Terhapus', 'Riwayat pengerjaan siswa telah direset dari nol.', 'success');
                loadHasilByRombel();
            }).catch(err => {
                Swal.fire('Gagal Reset', err.message, 'error');
            });
        }
    });
}

function exportHasilExcel() {
    const tbl = document.getElementById("tabelHasil");
    const ws = XLSX.utils.table_to_sheet(tbl);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil");
    XLSX.writeFile(wb, "Hasil_Ujian.xlsx");
}

let activeHasilId = null;
let activeMksHasilModal = null; // untuk modal bootstrap

async function koreksiEssay(hasilId) {
    activeHasilId = hasilId;
    if(!activeMksHasilModal) activeMksHasilModal = new bootstrap.Modal(document.getElementById('modalKoreksiEssay'));
    
    document.getElementById("koreksiBody").innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    document.getElementById("inputNilaiEssay").value = "";
    document.getElementById("previewTotalNilai").textContent = "Total Akhir: -";
    document.getElementById("skorPGAku").textContent = "PG: -";
    
    activeMksHasilModal.show();
    
    try {
        const hasilDoc = await db.collection("hasilUjian").doc(hasilId).get();
        if(!hasilDoc.exists) throw new Error("Data ujian tidak ditemukan.");
        const dataHasil = hasilDoc.data();
        
        // Cari Bank Soal untuk dapat pertanyaan asli
        const penugasanDoc = await db.collection("penugasan").doc(dataHasil.penugasanId).get();
        if(!penugasanDoc.exists) throw new Error("Penugasan sudah dihapus.");
        const bankId = penugasanDoc.data().bankId;
        
        const bankDoc = await db.collection("bankSoal").doc(bankId).get();
        if(!bankDoc.exists) throw new Error("File bank soal terkait sudah tidak ada.");
        
        const soalListEssay = bankDoc.data().soalEssay || [];
        const jawabanRaw = dataHasil.jawaban || {};
        
        const maxEssay = dataHasil.maxNilaiEssay ?? (dataHasil.totalEssay && dataHasil.nilaiPerSoal ? Math.round(dataHasil.totalEssay * dataHasil.nilaiPerSoal * 10) / 10 : 0);
        document.getElementById("skorPGAku").textContent = `Skor PG: ${dataHasil.nilaiPG} | Maks Essay: ${maxEssay}`;
        
        // Set max value pada input essay tetap 100 karena guru input skala 0-100
        const inputEssay = document.getElementById("inputNilaiEssay");
        inputEssay.max = 100;
        inputEssay.placeholder = `Skala 0-100`;
        
        const infoMaxEl = document.getElementById("infoMaxEssay");
        if(infoMaxEl) infoMaxEl.textContent = `Input skala 0-100 (akan dikonversi ke maks ${maxEssay})`;
        
        if(soalListEssay.length === 0 && (dataHasil.totalEssay === 0 || !dataHasil.totalEssay)) {
            document.getElementById("koreksiBody").innerHTML = `<div class="alert alert-info">Tidak ada soal Essay. Nilai akhir = nilai PG (${dataHasil.nilaiPG}).</div>`;
            return;
        }

        // Mapping Jawaban (berhubung di ujian.js kita simpan urutan index sebagai object key dari index)
        // Tunggu, ujian.js menyimpan jawaban sebagai { [idAsli]: jawabanText } tapi di sini idAsli-nya adalah Random (Math.random())
        // Wow! Waktu disiapkan, idAsli adalah "s.id || Math.random()". Kalau di JSON awal dia gapunya id, maka di-generate.
        // Wait, mari kita baca urutan jawaban yang tersimpan di dataHasil.jawaban.
        // Berhubung kita save payload menggunakan idAsli, kita butuh parse object jawabanUser.
    
        // Render Jawaban matched with Question
        let isHasEssayAnswer = false;
        let htmlAns = ``;
        let counter = 1;
        
        // Loop through the Bank's essay list
        soalListEssay.forEach((soal, idx) => {
            // Find the answer in the results payload by ID
            // or by searching for value that is likely an essay if IDs are missing (older data)
            let answerText = jawabanRaw[soal.id] || "";
            
            // If ID match fails (older data), try to find by index or iterate
            if (!answerText) {
                // We'll iterate the raw answers and pick one that hasn't been used? 
                // That's complex. Let's just try to match by index if it's a small set.
                // But safer: just show what's available if ID fails.
            }

            if(answerText || soal.pertanyaan) {
               htmlAns += `
                 <div class="mb-4 p-3 bg-light rounded border border-primary border-opacity-10 shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary text-uppercase">Soal Essay ${counter}</span>
                    </div>
                    
                    <div class="question-box mb-3 p-2 bg-white rounded border-start border-4 border-primary">
                        ${soal.gambar ? `<img src="${soal.gambar}" class="img-fluid rounded mb-2 d-block" style="max-height:150px;">` : ''}
                        <div class="fw-bold text-dark">${soal.pertanyaan}</div>
                    </div>

                    <div class="answer-box">
                        <div class="text-muted small fw-bold mb-1"><i class="bi bi-person-fill"></i> Jawaban Siswa:</div>
                        <div class="text-dark bg-white p-3 rounded border shadow-sm" style="min-height:60px; word-break: break-word;">
                            ${answerText || '<i class="text-muted">Siswa tidak menjawab soal ini.</i>'}
                        </div>
                    </div>
                 </div>
               `;
               counter++;
               if(answerText) isHasEssayAnswer = true;
            }
        });

        if(htmlAns === '') {
             htmlAns = `<div class="alert alert-danger">Tidak ada data essay ditemukan untuk ditampilkan.</div>`;
        }
        
        document.getElementById("koreksiBody").innerHTML = `
            <div class="mb-3">
               <h6 class="fw-bold fs-5 text-secondary">Lembar Koreksi Essay:</h6>
               <hr class="opacity-10">
               ${htmlAns}
            </div>
        `;
        
        if(dataHasil.nilaiEssay !== null) {
            document.getElementById("inputNilaiEssay").value = dataHasil.nilaiEssay;
            updatePreviewNilai();
        }

        // Live Preview Total
        document.getElementById("inputNilaiEssay").addEventListener("input", updatePreviewNilai);

        // Binding to global function
        window.simpanKoreksiTertutup = async () => {
             const inputScore = parseFloat(document.getElementById("inputNilaiEssay").value);
             if(isNaN(inputScore) || inputScore < 0 || inputScore > 100) {
                 Swal.fire('Error', `Input nilai harus antara 0 dan 100`, 'warning'); return;
             }
             
             document.getElementById("btnSimpanKoreksi").disabled = true;
             
             try {
                // Konversi input 0-100 ke nilai proporsional
                const convertedEssay = Math.round((inputScore / 100) * maxEssay * 10) / 10;
                
                // Hitung nilaiAkhir
                const nilaiAkhir = Math.round((dataHasil.nilaiPG + convertedEssay) * 10) / 10;
                
                // Update firestore
                await db.collection("hasilUjian").doc(activeHasilId).update({
                    nilaiEssayInput: inputScore, // Simpan input asli guru
                    nilaiEssay: convertedEssay,   // Simpan nilai terkonversi
                    nilaiAkhir: nilaiAkhir,
                    status: 'Selesai'
                });
                
                activeMksHasilModal.hide();
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: `Tersimpan! Nilai Akhir: ${nilaiAkhir}`,
                    text: `PG: ${dataHasil.nilaiPG} + Essay: ${convertedEssay}`,
                    showConfirmButton: false, timer: 3000
                });
                loadHasilByRombel();
             } catch(ee) {
                Swal.fire('Error', ee.message, 'error');
             } finally {
                const btn = document.getElementById("btnSimpanKoreksi");
                if(btn) btn.disabled = false;
             }
        };

        function updatePreviewNilai() {
             const inputScore = parseFloat(document.getElementById("inputNilaiEssay").value) || 0;
             const convertedEssay = (inputScore / 100) * maxEssay;
             const akhir = Math.round((dataHasil.nilaiPG + convertedEssay) * 10) / 10;
             document.getElementById("previewTotalNilai").textContent = `Nilai Akhir: ${akhir}`;
        }

    } catch(err) {
        document.getElementById("koreksiBody").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
}

// ---------------------------------------------------------
// EXPOSE ALL FUNCTIONS TO WINDOW (FOR ONCLICK)
// ---------------------------------------------------------
window.showPage = showPage;
window.logoutWithSwal = logoutWithSwal;
window.showBankModal = showBankModal;
window.handleBankForm = handleBankForm;
window.deleteBank = deleteBank;
window.bukaManajemenSoal = bukaManajemenSoal;
window.showSoalPGModal = showSoalPGModal;
window.editSoalPG = editSoalPG;
window.deleteSoalPG = deleteSoalPG;
window.handleSoalPGForm = handleSoalPGForm;
window.showSoalEssayModal = showSoalEssayModal;
window.editSoalEssay = editSoalEssay;
window.deleteSoalEssay = deleteSoalEssay;
window.handleSoalEssayForm = handleSoalEssayForm;
window.showImportSoalModal = showImportSoalModal;
window.prosesImportExcel = prosesImportExcel;
window.tambahInputOpsi = tambahInputOpsi;
window.hapusInputOpsiTerakhir = hapusInputOpsiTerakhir;
window.showTugasModal = showTugasModal;
window.handleTugasForm = handleTugasForm;
window.toggleTugas = toggleTugas;
window.toggleTampilNilai = toggleTampilNilai;
window.deleteTugas = deleteTugas;
window.showHasilRombelCards = showHasilRombelCards;
window.loadHasilByRombel = loadHasilByRombel;
window.openRombelHasil = openRombelHasil;
window.exportHasilExcel = exportHasilExcel;
window.koreksiEssay = koreksiEssay;
window.renderOpsiInputs = renderOpsiInputs;
window.clearSystemLog = clearSystemLog;
window.resetUjianSiswa = resetUjianSiswa;
window.simpanKoreksiTertutup = async () => {}; // Temporary placeholder, will be redefined in koreksiEssay
