// ============================================================
// UJIAN.JS v7 — Exam Engine
// Logika identik dengan versi asli.
// Penambahan: updateStats(), helper stripHtml() untuk essay.
// ============================================================

// --- CEGAH TOMBOL BACK BROWSER ---
history.pushState(null, null, location.href);
window.addEventListener('popstate', function () {
    history.pushState(null, null, location.href);
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true, position: 'top', icon: 'warning',
            title: 'Tombol kembali dinonaktifkan saat ujian!',
            showConfirmButton: false, timer: 3000
        });
    }
});

let examData    = null;
let bankData    = null;
let soalList    = [];
let jawabanUser = {};
let currentIdx  = 0;
let tabSwitchCount = 0;

let timerInterval;
let sisaWaktuDetik = 0;
let waktuMulai;

let activeHasilUjianId = null;
let unsubscribeHasil   = null;

// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    checkAuth("siswa");
    const user = getUserLocal();
    if (user) document.getElementById("siswaNameBar").textContent = user.nama;

    const activeStr = sessionStorage.getItem("cbt_active_exam");
    if (!activeStr) {
        Swal.fire('Akses Ditolak', 'Tidak ada ujian aktif. Kembali ke dashboard.', 'error').then(() => {
            window.location.href = "siswa/index.html";
        });
        return;
    }
    examData   = JSON.parse(activeStr);
    waktuMulai = new Date();

    if (examData.kips) initKIPS();

    try {
        // Fetch Bank Soal dari Firestore sesuai bankId ujian yang dipilih guru
        const bankDoc = await db.collection("bankSoal").doc(examData.bankId).get();
        if (!bankDoc.exists) throw new Error("Bank Soal tidak ditemukan!");
        bankData = bankDoc.data();

        document.getElementById("paketNameBar").textContent = bankData.nama;

        siapkanSoal();

        // Cari atau buat dokumen hasilUjian untuk Live Tracking
        const cekHasil = await db.collection("hasilUjian")
            .where("siswaId",     "==", user.uid)
            .where("penugasanId", "==", examData.penugasanId)
            .get();

        if (cekHasil.empty) {
            const payloadAwal = {
                siswaId:         user.uid,
                siswaNama:       user.nama,
                penugasanId:     examData.penugasanId,
                bankKode:        examData.bankKode || bankData.kode,
                bankNama:        bankData.nama,
                keterangan:      "Sedang Mengerjakan",
                jawaban:         {},
                nilaiPG:         0,
                nilaiEssay:      null,
                status:          "Mengerjakan",
                waktuBerapaLama: 0,
                pelanggaranTab:  0,
                waktuMulai:      firebase.firestore.FieldValue.serverTimestamp()
            };
            const addedDoc     = await db.collection("hasilUjian").add(payloadAwal);
            activeHasilUjianId = addedDoc.id;

            // SYSTEM LOG: Ujian Dimulai
            await db.collection("logs").add({
                action: 'MULAI_UJIAN',
                userId: user.uid,
                nama: user.nama,
                penugasanId: examData.penugasanId,
                bankKode: examData.bankKode || bankData.kode,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            activeHasilUjianId = cekHasil.docs[0].id;
        }

        // Realtime: deteksi reset paksa oleh guru
        unsubscribeHasil = db.collection("hasilUjian").doc(activeHasilUjianId).onSnapshot(docSnap => {
            if (!docSnap.exists) {
                if (timerInterval) clearInterval(timerInterval);
                Swal.fire({
                    title: 'Ujian Direset',
                    text:  'Sesi ujian Anda telah direset secara paksa oleh guru/admin. Anda akan dikembalikan ke dashboard.',
                    icon:  'warning',
                    allowOutsideClick: false
                }).then(() => {
                    sessionStorage.removeItem("cbt_active_exam");
                    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                    window.location.href = "siswa/index.html";
                });
            }
        });

        sisaWaktuDetik = examData.durasi * 60;
        startTimer();
        renderNavigasi();
        tampilkanSoal(0);

        document.getElementById("btnPrev").addEventListener("click", () => tampilkanSoal(currentIdx - 1));
        document.getElementById("btnNext").addEventListener("click", () => tampilkanSoal(currentIdx + 1));

    } catch (e) {
        Swal.fire('Error Inisiasi Ujian', e.message, 'error').then(() => {
            window.location.href = "siswa/index.html";
        });
    }
});

// ============================================================
// HELPER
// ============================================================
function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').trim();
}

// ============================================================
// PREPARASI SOAL
// ============================================================
function siapkanSoal() {
    let arr = [];

    if (bankData.soalPG && bankData.soalPG.length > 0) {
        bankData.soalPG.forEach(s => {
            arr.push({
                tipe:             'pg',
                idAsli:           s.id || Math.random().toString(),
                pertanyaan:       s.pertanyaan,
                gambar:           s.gambar || null,
                opsi:             s.opsi,
                jawabanBenarAsli: s.jawaban
            });
        });
    }

    if (bankData.soalEssay && bankData.soalEssay.length > 0) {
        bankData.soalEssay.forEach(s => {
            arr.push({
                tipe:       'essay',
                idAsli:     s.id || Math.random().toString(),
                pertanyaan: s.pertanyaan,
                gambar:     s.gambar || null
            });
        });
    }

    if (examData.acak) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    soalList = arr;
    soalList.forEach((s, idx) => {
        jawabanUser[idx] = s.tipe === 'pg' ? null : "";
    });
}

// ============================================================
// RENDER SOAL
// ============================================================
function tampilkanSoal(idx) {
    if (idx < 0 || idx >= soalList.length) return;
    currentIdx = idx;

    const soal  = soalList[idx];
    const total = soalList.length;

    document.getElementById("infoSoalAktif").textContent = `Soal ${idx + 1} / ${total}`;
    document.getElementById("progressFill").style.width  = `${((idx + 1) / total) * 100}%`;

    const tipeTag = document.getElementById("soalTipeTag");
    if (soal.tipe === 'pg') {
        tipeTag.textContent = "Pilihan Ganda";
        tipeTag.className   = "soal-tipe-tag tipe-pg";
    } else {
        tipeTag.textContent = "Essay";
        tipeTag.className   = "soal-tipe-tag tipe-essay";
    }

    let html = `
        <div class="soal-content soal-anim">
            <div class="soal-nomor-label">Pertanyaan ${idx + 1} dari ${total}</div>
            <div class="soal-teks">${soal.pertanyaan.replace(/\n/g, '<br>')}</div>
            ${soal.gambar ? `<div class="soal-gambar"><img src="${soal.gambar}" alt="Gambar Soal"></div>` : ''}
        </div>
    `;

    if (soal.tipe === 'pg') {
        html += `<div class="opsi-list">`;
        soal.opsi.forEach((opText, oIdx) => {
            const char      = String.fromCharCode(65 + oIdx);
            const isChecked = jawabanUser[idx] === oIdx ? 'checked' : '';
            const opObj = (typeof opText === 'object' && opText !== null) ? opText : { text: opText, img: null };

            html += `
                <div class="opsi-item">
                    <input type="radio" name="opsiSoal" id="opsi${oIdx}" value="${oIdx}"
                        onchange="simpanJawaban(${idx}, ${oIdx})" ${isChecked}>
                    <label for="opsi${oIdx}" class="opsi-label">
                        <span class="opsi-huruf">${char}</span>
                        <span style="font-size:1rem;">${opObj.text}</span>
                        ${opObj.img ? `<img src="${opObj.img}" class="opsi-gambar" alt="gambar opsi">` : ''}
                    </label>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        const val = jawabanUser[idx] || "";
        html += `
            <div class="essay-section">
                <div class="essay-head">
                    <i class="bi bi-pencil-square"></i> Jawaban Essay Anda:
                </div>
                <div class="essay-toolbar">
                    <button type="button" onclick="document.execCommand('bold')"               title="Bold"><i class="bi bi-type-bold"></i></button>
                    <button type="button" onclick="document.execCommand('italic')"             title="Italic"><i class="bi bi-type-italic"></i></button>
                    <button type="button" onclick="document.execCommand('underline')"          title="Underline"><i class="bi bi-type-underline"></i></button>
                    <div class="t-div"></div>
                    <button type="button" onclick="document.execCommand('insertOrderedList')"  title="Numbered List"><i class="bi bi-list-ol"></i></button>
                    <button type="button" onclick="document.execCommand('insertUnorderedList')" title="Bullet List"><i class="bi bi-list-ul"></i></button>
                </div>
                <div id="essayEditor_${idx}" class="essay-editor" contenteditable="true"
                    data-placeholder="Ketikkan jawaban essay Anda di sini..."
                    oninput="simpanJawaban(${idx}, document.getElementById('essayEditor_${idx}').innerHTML, true)"
                >${val}</div>
            </div>
        `;
    }

    document.getElementById("soalContainer").innerHTML = html;

    document.getElementById("btnPrev").disabled = (idx === 0);
    document.getElementById("btnNext").disabled = (idx === soalList.length - 1);

    cekSelesaiVisual();
    renderNavigasi();
    updateStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// SIMPAN JAWABAN
// ============================================================
function simpanJawaban(soalIdx, nilai, isEssay = false) {
    if (isEssay) {
        jawabanUser[soalIdx] = nilai;
    } else {
        jawabanUser[soalIdx] = parseInt(nilai);
    }

    const kotak = document.getElementById(`nav-kotak-${soalIdx}`);
    if (kotak) {
        const sudahDijawab = isEssay
            ? stripHtml(nilai) !== ""
            : (nilai !== null);
        kotak.classList.toggle('dijawab', sudahDijawab);
    }

    cekSelesaiVisual();
    updateStats();
}

// ============================================================
// CEK SEMUA TERJAWAB
// ============================================================
function cekSelesaiVisual() {
    let semuaTerjawab = true;
    for (let i = 0; i < soalList.length; i++) {
        const jawb = jawabanUser[i];
        if (soalList[i].tipe === 'pg') {
            if (jawb === null || jawb === undefined) { semuaTerjawab = false; break; }
        } else {
            if (!jawb || stripHtml(jawb) === "") { semuaTerjawab = false; break; }
        }
    }
    const btnSel = document.getElementById("btnSelesai");
    if (btnSel) btnSel.classList.toggle("d-none", !semuaTerjawab);
}

// ============================================================
// UPDATE STATISTIK
// ============================================================
function updateStats() {
    let dijawab = 0;
    soalList.forEach((s, i) => {
        const j = jawabanUser[i];
        if (s.tipe === 'pg'    && j !== null && j !== undefined) dijawab++;
        if (s.tipe === 'essay' && j && stripHtml(j) !== "")      dijawab++;
    });
    const elD = document.getElementById("statDijawab");
    const elS = document.getElementById("statSisa");
    if (elD) elD.textContent = dijawab;
    if (elS) elS.textContent = soalList.length - dijawab;
}

// ============================================================
// RENDER NAVIGASI GRID
// ============================================================
function renderNavigasi() {
    const grid = document.getElementById("navGrid");
    let html   = '';

    for (let i = 0; i < soalList.length; i++) {
        let cls    = 'nav-kotak';
        const jawb = jawabanUser[i];

        if (i === currentIdx) cls += ' aktif';
        if (soalList[i].tipe === 'pg'    && jawb !== null && jawb !== undefined) cls += ' dijawab';
        if (soalList[i].tipe === 'essay' && jawb && stripHtml(jawb) !== "")      cls += ' dijawab';

        html += `<div class="${cls}" id="nav-kotak-${i}" onclick="tampilkanSoal(${i})">${i + 1}</div>`;
    }

    grid.innerHTML = html;
}

// ============================================================
// TIMER
// ============================================================
function startTimer() {
    function tick() {
        if (sisaWaktuDetik <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timerDisplay").textContent = "00:00";
            autoSubmitUjian();
            return;
        }
        const m    = Math.floor(sisaWaktuDetik / 60).toString().padStart(2, '0');
        const s    = (sisaWaktuDetik % 60).toString().padStart(2, '0');
        const disp = document.getElementById("timerDisplay");
        disp.textContent = `${m}:${s}`;
        disp.className   = sisaWaktuDetik <= 300 ? 'timer-pill danger' : 'timer-pill';
        sisaWaktuDetik--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

// ============================================================
// ALARM
// ============================================================
function playAlarm() {
    try {
        const ctx          = new (window.AudioContext || window.webkitAudioContext)();
        const beepCount    = 3;
        const beepDuration = 0.35;
        const beepInterval = 0.5;

        for (let i = 0; i < beepCount; i++) {
            const osc      = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime + i * beepInterval);
            gainNode.gain.setValueAtTime(0.8, ctx.currentTime + i * beepInterval);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * beepInterval + beepDuration);
            osc.start(ctx.currentTime + i * beepInterval);
            osc.stop(ctx.currentTime + i * beepInterval + beepDuration);
        }
        setTimeout(() => ctx.close(), beepCount * beepInterval * 1000 + 500);
    } catch (e) {
        console.warn('Audio API not supported:', e);
    }
}

// ============================================================
// KIPS
// ============================================================
function initKIPS() {
    document.body.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn("Gagal fullscreen:", err);
            });
        }
    }, { once: true });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'hidden') {
            tabSwitchCount++;
            document.getElementById("kipsOverlay").classList.remove("d-none");

            const user = getUserLocal();
            db.collection("logs").add({
                userId:      user.uid,
                nama:        user.nama,
                penugasanId: examData.penugasanId,
                action:      "TAB_SWITCH",
                count:       tabSwitchCount,
                timestamp:   firebase.firestore.FieldValue.serverTimestamp()
            });

            if (activeHasilUjianId) {
                db.collection("hasilUjian").doc(activeHasilUjianId).update({
                    pelanggaranTab: tabSwitchCount
                });
            }

            if (tabSwitchCount === 3) {
                playAlarm();
                Swal.fire({
                    title:              '⚠️ PERINGATAN KERAS!',
                    html:               '<b>Ini pelanggaran ke-3!</b><br>Keluar lagi akan menyebabkan ujian otomatis dihentikan!',
                    icon:               'error',
                    confirmButtonColor: '#dc3545',
                    confirmButtonText:  'Saya Mengerti',
                    allowOutsideClick:  false
                }).then(() => {
                    document.getElementById("kipsOverlay").classList.add("d-none");
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    }
                });
            }

            if (tabSwitchCount > 3) {
                Swal.fire(
                    'PELANGGARAN BERAT',
                    'Anda telah keluar ujian melebihi batas maksimal. Ujian otomatis dihentikan dan diserahkan!',
                    'error'
                ).then(() => {
                    document.getElementById("kipsOverlay").classList.add("d-none");
                    autoSubmitUjian();
                });
            }
        }
    });
}

function kembaliKeUjian() {
    document.getElementById("kipsOverlay").classList.add("d-none");
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => { console.log(e); });
    }
}

// ============================================================
// SUBMIT
// ============================================================
function submitUjianManual() {
    let belumPG = 0, belumEssay = 0;
    soalList.forEach((s, idx) => {
        if (s.tipe === 'pg'    && jawabanUser[idx] === null)                              belumPG++;
        if (s.tipe === 'essay' && (!jawabanUser[idx] || stripHtml(jawabanUser[idx]) === "")) belumEssay++;
    });

    let msg = "Yakin ingin menyelesaikan ujian ini?<br><br>";
    if (belumPG    > 0) msg += `<span style='color:#dc3545'>⚠ <b>${belumPG}</b> soal PG belum dijawab</span><br>`;
    if (belumEssay > 0) msg += `<span style='color:#dc3545'>⚠ <b>${belumEssay}</b> soal Essay belum dijawab</span><br>`;
    if (!belumPG && !belumEssay) msg += `<span style='color:#198754'>✓ Semua soal telah dijawab</span><br>`;
    msg += "<br><small class='text-muted'>Setelah selesai, jawaban tidak dapat diubah lagi.</small>";

    Swal.fire({
        title:              'Selesaikan Ujian?',
        html:               msg,
        icon:               'warning',
        showCancelButton:   true,
        confirmButtonColor: '#198754',
        cancelButtonColor:  '#6c757d',
        confirmButtonText:  'Ya, Selesai!',
        cancelButtonText:   'Kembali'
    }).then((result) => {
        if (result.isConfirmed) prosesSubmit("Selesai");
    });
}

function autoSubmitUjian() {
    Swal.fire('Waktu Habis!', 'Jawaban Anda akan otomatis dikirim ke server.', 'info');
    prosesSubmit("Waktu Habis");
}

async function prosesSubmit(reason) {
    clearInterval(timerInterval);
    const user = getUserLocal();

    let benarPG = 0, totalPG = 0, totalEssay = 0;
    let payloadJawaban = {};

    soalList.forEach((s, idx) => {
        payloadJawaban[s.idAsli] = jawabanUser[idx];
        if (s.tipe === 'pg') {
            totalPG++;
            if (jawabanUser[idx] === s.jawabanBenarAsli) benarPG++;
        } else if (s.tipe === 'essay') {
            totalEssay++;
        }
    });

    const totalSoal      = totalPG + totalEssay;
    const nilaiPerSoal   = totalSoal > 0 ? parseFloat((100 / totalSoal).toFixed(4)) : 0;
    const nilaiPG        = totalPG   > 0 ? Math.round(benarPG * nilaiPerSoal * 10) / 10 : 0;
    const maxNilaiEssay  = Math.round(totalEssay * nilaiPerSoal * 10) / 10;
    const durasiDetikAsli = (examData.durasi * 60) - sisaWaktuDetik;

    const adaEssay  = totalEssay > 0;
    let finalStatus = adaEssay ? 'Menunggu Koreksi' : 'Selesai';
    if (reason === 'Waktu Habis') finalStatus = adaEssay ? 'Menunggu Koreksi' : 'Selesai';

    const payload = {
        siswaId:          user.uid,
        siswaNama:        user.nama,
        penugasanId:      examData.penugasanId,
        bankKode:         examData.bankKode || bankData.kode,
        bankNama:         bankData.nama,
        keterangan:       reason,
        jawaban:          payloadJawaban,
        nilaiPG:          nilaiPG,
        nilaiEssay:       null,
        nilaiAkhir:       null,
        maxNilaiEssay:    maxNilaiEssay,
        totalPG:          totalPG,
        totalEssay:       totalEssay,
        totalSoal:        totalSoal,
        nilaiPerSoal:     nilaiPerSoal,
        status:           finalStatus,
        waktuBerapaLama:  durasiDetikAsli,
        pelanggaranTab:   tabSwitchCount,
        waktuSelesai:     firebase.firestore.FieldValue.serverTimestamp()
    };

    document.body.innerHTML = `
        <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
            background:#f0f2f5;text-align:center;padding:24px;font-family:'Plus Jakarta Sans',sans-serif;">
            <div style="width:56px;height:56px;border:4px solid #d1e7dd;border-top-color:#198754;
                border-radius:50%;animation:spin .8s linear infinite;margin-bottom:20px;"></div>
            <h5 style="color:#198754;font-weight:700;margin:0;">Menyerahkan Ujian Anda...</h5>
            <p style="color:#6c757d;margin-top:8px;font-size:0.88rem;">Mohon tunggu, jangan tutup halaman ini.</p>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>
    `;

    try {
        if (unsubscribeHasil) unsubscribeHasil();

        if (activeHasilUjianId) {
            await db.collection("hasilUjian").doc(activeHasilUjianId).update(payload);
        } else {
            await db.collection("hasilUjian").add(payload);
        }

        // SYSTEM LOG: Ujian Selesai
        await db.collection("logs").add({
            action: 'SELESAI_UJIAN',
            userId: user.uid,
            nama: user.nama,
            penugasanId: examData.penugasanId,
            bankKode: examData.bankKode || bankData.kode,
            nilaiPG: nilaiPG,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        sessionStorage.removeItem("cbt_active_exam");

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        setTimeout(() => {
            Swal.fire('Terserahkan!', 'Ujian berhasil diserahkan! Anda akan kembali ke dashboard.', 'success').then(() => {
                window.location.href = "siswa/index.html";
            });
        }, 1500);

    } catch (e) {
        Swal.fire('Gagal Menyerahkan', e.message + '<br>Mohon hubungi guru/admin!', 'error');
    }
}