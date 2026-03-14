// ============================================================
// SISWA.JS - Modul Dashboard Siswa
// ============================================================

let mConfirm, mChangePass;
let activeTugas = null;
let userRombelId = null; // Global cache for filtering

document.addEventListener("DOMContentLoaded", () => {
    checkAuth("siswa");
    const user = getUserLocal();
    if(user) {
        document.getElementById("siswaName").textContent = user.nama;
        document.getElementById("siswaProfileName").textContent = user.nama;
        
        // Ambil data profile lengkap dari Firestore
        db.collection("users").doc(user.uid).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                userRombelId = data.rombelId; // Set global cache
                document.getElementById("siswaProfileNis").textContent = data.nis || "Belum Diatur";
                document.getElementById("siswaProfileKelas").textContent = data.namaKelas || data.rombelNama || "Belum Diatur";
                document.getElementById("siswaProfileGender").textContent = data.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-Laki';
                
                // Refresh tugas list once we have rombelId
                loadTugas();
                
                // Cari info wali kelas berdasarkan Rombel yang tersimpan
                if(data.rombelId) {
                    db.collection("rombel").doc(data.rombelId).get().then(rDoc => {
                        if(rDoc.exists && rDoc.data().waliKelasNama) {
                            document.getElementById("siswaProfileWali").textContent = rDoc.data().waliKelasNama;
                        } else {
                            document.getElementById("siswaProfileWali").textContent = "Belum Terhubung";
                        }
                    });
                } else {
                    document.getElementById("siswaProfileWali").textContent = "-";
                }
            }
        });
    }

    const modalConfirmEl = document.getElementById('modalConfirmUjian');
    if(modalConfirmEl) mConfirm = new bootstrap.Modal(modalConfirmEl);
    
    const modalChangeEl = document.getElementById('modalChangePassword');
    if(modalChangeEl) mChangePass = new bootstrap.Modal(modalChangeEl);
    
    // Auto load tugas
    setTimeout(() => { loadTugas() }, 1000);
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
    document.querySelectorAll('.siswa-page').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');
    
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active', 'text-primary', 'fw-bold', 'border-bottom', 'border-primary', 'border-2');
        el.classList.add('text-muted', 'fw-medium');
        el.style.borderBottom = "none";
    });
    
    navElement.classList.remove('text-muted', 'fw-medium');
    navElement.classList.add('active', 'text-primary', 'fw-bold');
    navElement.style.borderBottom = "2px solid #0066FF";
    navElement.style.borderRadius = "0";

    if(pageId === 'riwayat') loadRiwayat();
}

function showChangePasswordModal() {
    document.getElementById("newPassword").value = "";
    mChangePass.show();
}

async function handleGantiPassword() {
    const newPass = document.getElementById("newPassword").value;
    if(newPass.length < 6) return Swal.fire('Error', 'Password minimal 6 karakter', 'error');

    try {
        const user = firebase.auth().currentUser;
        await user.updatePassword(newPass);
        Swal.fire('Berhasil!', 'Password akun Anda telah diperbarui.', 'success');
        mChangePass.hide();
    } catch (err) {
        Swal.fire('Gagal', err.message, 'error');
    }
}

// ---------------------------------------------------------
// PANEL ASESMENT (LOADING PENUGASAN AKTIF)
// ---------------------------------------------------------
function loadTugas() {
    const sem = document.getElementById("filterSemester").value;
    const jns = document.getElementById("filterJenis").value;
    const user = getUserLocal();

    const container = document.getElementById("paketContainer");
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Mencari tugas...</p></div>`;

    // 1. Ambil Penugasan Aktif sesuai Semester & Jenis
    db.collection("penugasan")
        .where("aktif", "==", true)
        .where("semester", "==", sem)
        .where("jenis", "==", jns)
        .get().then(async (tugasSnap) => {
            
            if(tugasSnap.empty) {
                container.innerHTML = `<div class="col-12 text-center text-muted mt-5"><i class="bi bi-x-circle fs-1"></i><p class="mt-2">Tidak ada penugasan aktif untuk filter ini.</p></div>`;
                return;
            }

            // 2. Ambil Riwayat Ujian milik user ini untuk mengecek status (Selesai/Menunggu Koreksi)
            const historySnap = await db.collection("hasilUjian")
                .where("siswaId", "==", user.uid)
                .get();
                
            const historyMap = {};
            historySnap.forEach(h => {
                historyMap[h.data().penugasanId] = h.data().status; // status: "Selesai" atau "Menunggu Koreksi"
            });

            let html = '';
            tugasSnap.forEach(tDoc => {
                const t = tDoc.data();
                t.id = tDoc.id;
                
                // FILTER ROMBEL: Jika target bukan 'all' dan tidak sama dengan user.rombelId, skip
                const rID = userRombelId || user.rombelId;
                if(t.rombelTarget && t.rombelTarget !== 'all' && t.rombelTarget !== rID) {
                    return;
                }
                
                // Cari riwayat
                const riwayat = historyMap[t.id]; // Ini dari getRiwayat
                let statusBadge = '';
                let aksiBtn = '';
                let scoreHtml = '';

                // CEK JADWAL
                const now = new Date();
                const start = t.mulai ? new Date(t.mulai) : null;
                const end = t.selesai ? new Date(t.selesai) : null;

                let isOpen = true;
                let scheduleBadge = '';

                if(start && now < start) {
                    isOpen = false;
                    scheduleBadge = `<span class="badge bg-secondary-subtle text-secondary border ms-2"><i class="bi bi-clock"></i> Belum Dimulai</span>`;
                } else if(end && now > end) {
                    isOpen = false;
                    scheduleBadge = `<span class="badge bg-danger-subtle text-danger border ms-2"><i class="bi bi-calendar-x"></i> Berakhir</span>`;
                }

                if (riwayat) {
                    const rData = typeof riwayat === 'object' ? riwayat : { status: riwayat };
                    const statusVal = (rData.status || '').toLowerCase();

                    if (statusVal === "selesai") {
                        statusBadge = `<span class="badge rounded-pill bg-success-subtle text-success px-3 py-2 border border-success border-opacity-25"><i class="bi bi-check-circle-fill me-1"></i>Selesai</span>`;
                        aksiBtn = `<button class="btn btn-light btn-sm text-primary fw-bold px-4 py-2 border disabled rounded-pill">SUDAH DIKERJAKAN</button>`;
                        
                        // TAMPIL NILAI: Hanya jika di-set true oleh guru dan status Selesai
                        if(t.tampilNilai) {
                            // Find the actual document to get the final score
                            const hDoc = historySnap.docs.find(d => d.data().penugasanId === t.id);
                            const hData = hDoc ? hDoc.data() : {};
                            const nilaiFinal = hData.nilaiAkhir ?? hData.nilaiPG ?? 0;
                            scoreHtml = `<div class="mt-2"><span class="badge bg-primary fs-6 px-3 py-2 mb-2 shadow-sm">Nilai: ${nilaiFinal}</span></div>`;
                        }
                    } else {
                        statusBadge = `<span class="badge rounded-pill bg-warning-subtle text-warning px-3 py-2 border border-warning border-opacity-25"><i class="bi bi-hourglass-split me-1"></i>Menunggu Koreksi</span>`;
                        aksiBtn = `<button class="btn btn-light btn-sm text-muted px-4 py-2 border disabled rounded-pill">SEDANG DINILAI</button>`;
                    }
                } else {
                    if(!isOpen) {
                        statusBadge = scheduleBadge;
                        aksiBtn = `<button class="btn btn-light btn-sm text-muted px-4 py-2 border disabled rounded-pill">UJIAN TUTUP</button>`;
                    } else {
                        statusBadge = `<span class="badge rounded-pill bg-primary-subtle text-primary px-3 py-2 border border-primary border-opacity-25">Tersedia</span>`;
                        aksiBtn = `<button class="btn btn-primary btn-sm px-4 py-2 shadow-sm fw-bold rounded-pill" onclick='bukaKonfirmasi(${JSON.stringify(t)})'>MULAI ASESMEN</button>`;
                    }
                }
                
                // Add scoreHtml below bankNama
                const infoUjian = `
                    <h5 class="fw-bold text-dark mb-1">${t.bankNama}</h5>
                    ${scoreHtml}
                `;

                html += `
                    <div class="card border-0 shadow-sm mb-3 cbt-card-premium overflow-hidden">
                        <div class="card-body p-4">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <div class="bg-primary bg-opacity-10 p-3 rounded-4 text-primary">
                                        <i class="bi bi-file-earmark-text-fill fs-3"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="text-uppercase small fw-bold text-muted letter-spacing-1">${t.jenis} • ${t.semester}</span>
                                        ${statusBadge}
                                    </div>
                                    ${infoUjian}
                                    <div class="d-flex align-items-center text-muted small gap-3 flex-wrap">
                                        <span><i class="bi bi-clock me-1"></i> ${t.durasi} Menit</span>
                                        ${t.mulai ? `<span class="text-primary"><i class="bi bi-calendar-event me-1"></i> ${t.mulai.replace('T', ' ')}</span>` : ''}
                                        ${t.selesai ? `<span class="text-danger"><i class="bi bi-calendar-x me-1"></i> S/D ${t.selesai.replace('T', ' ')}</span>` : ''}
                                    </div>
                                </div>
                                <div class="col-md-auto text-end mt-3 mt-md-0">
                                    ${aksiBtn}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html || `<div class="col-12 text-center text-muted mt-5 py-4"><i class="bi bi-info-circle fs-1"></i><p class="mt-2">Tidak ada asesmen aktif untuk rombel Anda saat ini.</p></div>`;
        });
}

// ---------------------------------------------------------
// KONFIRMASI UJIAN
// ---------------------------------------------------------
function bukaKonfirmasi(tugasData) {
    activeTugas = tugasData;
    document.getElementById("confNamaPaket").textContent = `${tugasData.bankKode} - ${tugasData.bankNama}`;
    document.getElementById("confDurasi").textContent = tugasData.durasi;
    const kipsEl = document.getElementById("confKips");
    if(tugasData.kipsEnabled) kipsEl.style.display = 'block';
    else kipsEl.style.display = 'none';

    mConfirm.show();
}

function mulaiUjian() {
    // Siapkan data ujian ke sessionStorage untuk dieksekusi oleh ujian.html
    const sessionData = {
        penugasanId: activeTugas.id,
        bankId: activeTugas.bankId,
        durasi: activeTugas.durasi,
        acak: activeTugas.acakSingkat,
        kips: activeTugas.kipsEnabled
    };
    sessionStorage.setItem("cbt_active_exam", JSON.stringify(sessionData));
    
    window.location.href = "../ujian.html";
}

// ---------------------------------------------------------
// RIWAYAT UJIAN
// ---------------------------------------------------------
function loadRiwayat() {
    const user = getUserLocal();
    db.collection("hasilUjian").where("siswaId", "==", user.uid).orderBy("waktuSelesai", "desc").get().then(async (snapshot) => {
        let html = '';
        if(snapshot.empty) {
            document.getElementById("riwayatTableBody").innerHTML = `<tr><td colspan="4" class="text-center">Belum ada riwayat ujian</td></tr>`;
            return;
        }

        // Kumpulkan semua penugasan ID untuk memeriksa izin tampilNilai
        const taskIds = new Set();
        snapshot.forEach(doc => taskIds.add(doc.data().penugasanId));
        
        const penugasanInfo = {};
        for(let tid of Array.from(taskIds)) {
            const p = await db.collection("penugasan").doc(tid).get();
            if(p.exists) penugasanInfo[tid] = p.data().tampilNilai;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const showScore = penugasanInfo[data.penugasanId] === true;
            
            const badgeClass = data.status === 'Selesai' ? 'bg-success' : 'bg-warning text-dark';
            
            let nilaiText = '';
            if(!showScore) {
                nilaiText = '<span class="text-muted"><i class="bi bi-eye-slash me-1"></i>Menunggu Rilis</span>';
            } else {
                if(data.status === 'Selesai' && data.nilaiEssay !== null && data.nilaiEssay !== undefined) {
                    const avg = ((data.nilaiPG + data.nilaiEssay) / 2).toFixed(1);
                    nilaiText = `<span class="fw-bold text-success">${avg}</span> <small class="text-muted">/ 100</small>`;
                } else {
                    nilaiText = `<span class="fw-bold">${data.nilaiPG}</span> <small class="text-muted">(PG)</small>`;
                }
            }

            html += `
                <tr>
                    <td><strong>${data.bankKode}</strong><br><small>${data.bankNama}</small></td>
                    <td><span class="badge ${badgeClass}">${data.status}</span></td>
                    <td>${nilaiText}</td>
                    <td>${formatWaktuUjian(data.waktuBerapaLama)}</td>
                </tr>
            `;
        });
        document.getElementById("riwayatTableBody").innerHTML = html;
    });
}

function formatWaktuUjian(seconds) {
    if(!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m} mnt ${s} dtk`;
}
