// ============================================================
// UJIAN.JS - Exam Engine
// ============================================================

// --- CEGAH TOMBOL BACK BROWSER ---
history.pushState(null, null, location.href);
window.addEventListener('popstate', function () {
    history.pushState(null, null, location.href);
    if(typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true, position: 'top', icon: 'warning',
            title: 'Tombol kembali dinonaktifkan saat ujian!',
            showConfirmButton: false, timer: 3000
        });
    }
});

let examData = null; // dari sessionStorage
let bankData = null; // dari firestore
let soalList = []; // array of {tipe, idAsli, teks, opsi, jawabanAsli}
let jawabanUser = {}; // penampung jawaban
let currentIdx = 0;
let tabSwitchCount = 0;

let timerInterval;
let sisaWaktuDetik = 0;
let waktuMulai;

let activeHasilUjianId = null;
let unsubscribeHasil = null;

document.addEventListener("DOMContentLoaded", async () => {
    checkAuth("siswa");
    const user = getUserLocal();
    if(user) document.getElementById("siswaNameBar").textContent = user.nama;

    // Load active exam context from Session
    const activeStr = sessionStorage.getItem("cbt_active_exam");
    if(!activeStr) {
        Swal.fire('Akses Ditolak', 'Tidak ada ujian aktif. Kembali ke dashboard.', 'error').then(() => {
            window.location.href = "siswa/index.html";
        });
        return;
    }
    examData = JSON.parse(activeStr);
    waktuMulai = new Date();

    // Init KIPS
    if(examData.kips) {
        initKIPS();
    }

    try {
        // Fetch Bank Soal from firestore
        const bankDoc = await db.collection("bankSoal").doc(examData.bankId).get();
        if(!bankDoc.exists) throw new Error("Bank Soal tidak ditemukan!");
        bankData = bankDoc.data();

        document.getElementById("paketNameBar").textContent = bankData.nama;

        // Process and Shuffle Soal
        siapkanSoal();

        // Cari atau Buat Hasil Ujian Dokumen untuk Tracking Live
        const cekHasil = await db.collection("hasilUjian")
            .where("siswaId", "==", user.uid)
            .where("penugasanId", "==", examData.penugasanId)
            .get();
            
        if(cekHasil.empty) {
            // Document creation for Live Tracking
            const payloadAwal = {
                siswaId: user.uid,
                siswaNama: user.nama,
                penugasanId: examData.penugasanId,
                bankKode: examData.bankKode || bankData.kode,
                bankNama: bankData.nama,
                keterangan: "Sedang Mengerjakan",
                jawaban: {},
                nilaiPG: 0,
                nilaiEssay: null,
                status: "Mengerjakan",
                waktuBerapaLama: 0,
                pelanggaranTab: 0,
                waktuMulai: firebase.firestore.FieldValue.serverTimestamp()
            };
            const addedDoc = await db.collection("hasilUjian").add(payloadAwal);
            activeHasilUjianId = addedDoc.id;
        } else {
            activeHasilUjianId = cekHasil.docs[0].id;
        }

        // Listener Realtime: Jika dokumen dihapus (Reset Total) atau status diubah
        unsubscribeHasil = db.collection("hasilUjian").doc(activeHasilUjianId).onSnapshot(docSnap => {
            if(!docSnap.exists) {
                // Dimatikan / direset paksa oleh guru (Reset Total)
                if(timerInterval) clearInterval(timerInterval);
                Swal.fire({
                    title: 'Ujian Direset',
                    text: 'Sesi ujian Anda telah direset secara paksa oleh guru/admin. Anda akan dikembalikan ke dashboard.',
                    icon: 'warning',
                    allowOutsideClick: false
                }).then(() => {
                    sessionStorage.removeItem("cbt_active_exam");
                    if (document.fullscreenElement) document.exitFullscreen().catch(err => Promise.resolve(err));
                    window.location.href = "siswa/index.html";
                });
            }
        });

        // Start Timer
        sisaWaktuDetik = examData.durasi * 60;
        startTimer();

        // Render Pertama
        renderNavigasi();
        tampilkanSoal(0);

        // Events
        document.getElementById("btnPrev").addEventListener("click", () => tampilkanSoal(currentIdx - 1));
        document.getElementById("btnNext").addEventListener("click", () => tampilkanSoal(currentIdx + 1));

    } catch (e) {
        Swal.fire('Error Inisiasi Ujian', e.message, 'error').then(() => {
            window.location.href = "siswa/index.html";
        });
    }
});

// ---------------------------------------------------------
// PREPARASI SOAL (SHUFFLE/ACAK)
// ---------------------------------------------------------
function siapkanSoal() {
    let arr = [];
    
    // Mapping PG
    if(bankData.soalPG && bankData.soalPG.length > 0) {
        bankData.soalPG.forEach(s => {
            arr.push({
                tipe: 'pg',
                idAsli: s.id || Math.random().toString(),
                pertanyaan: s.pertanyaan,
                gambar: s.gambar || null,
                opsi: s.opsi,
                jawabanBenarAsli: s.jawaban
            });
        });
    }

    // Mapping Essay
    if(bankData.soalEssay && bankData.soalEssay.length > 0) {
        bankData.soalEssay.forEach(s => {
            arr.push({
                tipe: 'essay',
                idAsli: s.id || Math.random().toString(),
                pertanyaan: s.pertanyaan,
                gambar: s.gambar || null
            });
        });
    }

    // Shuffle jika diminta
    if(examData.acak) {
        // Fisher-Yates
        for(let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    soalList = arr;

    // Init state jawaban kosong
    soalList.forEach((s, idx) => {
        jawabanUser[idx] = s.tipe === 'pg' ? null : "";
    });
}

// ---------------------------------------------------------
// RENDER UI
// ---------------------------------------------------------
function tampilkanSoal(idx) {
    if(idx < 0 || idx >= soalList.length) return;
    currentIdx = idx;

    const soal = soalList[idx];
    const container = document.getElementById("soalContainer");
    
    // Update Header Text Info
    document.getElementById("infoSoalAktif").textContent = `Soal No. ${idx + 1} dari ${soalList.length}`;

    let html = `
        <div class="soal-nomor">SOAL NOMOR ${idx + 1}</div>
        <div class="soal-teks">${soal.pertanyaan.replace(/\n/g, '<br>')}</div>
        ${soal.gambar ? `<div class="soal-img mt-2"><img src="${soal.gambar}" class="img-fluid rounded" style="max-height:250px;" alt="Gambar Soal"></div>` : ''}
    `;

    if(soal.tipe === 'pg') {
        html += `<div class="opsi-kumpulan">`;
        soal.opsi.forEach((opText, oIdx) => {
            const char = String.fromCharCode(65 + oIdx); // A, B, C...
            const isChecked = jawabanUser[idx] === oIdx ? 'checked' : '';
            
            // Opsi bisa berupa string atau object {text, img}
            const opObj = (typeof opText === 'object' && opText !== null) ? opText : { text: opText, img: null };
            
            html += `
                <input type="radio" name="opsiSoal" class="opsi-radio" id="opsi${oIdx}" value="${oIdx}" onchange="simpanJawaban(${idx}, ${oIdx})" ${isChecked}>
                <label for="opsi${oIdx}" class="opsi-label">
                    <div class="d-flex align-items-center">
                        <span class="opsi-huruf shadow-sm">${char}</span>
                        <span style="font-size:1.05rem;">${opObj.text}</span>
                        ${opObj.img ? `<img src="${opObj.img}" style="max-height:80px; max-width:200px; margin-left:8px; border-radius:6px;" alt="gambar opsi">` : ''}
                    </div>
                </label>
            `;
        });
        html += `</div>`;
    } else {
        // Essay — Rich Text Editor
        const val = jawabanUser[idx] || "";
        html += `
            <div class="mt-4">
                <label class="form-label fw-bold text-success"><i class="bi bi-pencil-square"></i> Jawaban Essay:</label>
                <div class="essay-toolbar d-flex gap-1 mb-2 p-2 bg-light border rounded">
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('bold')" title="Bold"><i class="bi bi-type-bold"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('italic')" title="Italic"><i class="bi bi-type-italic"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('underline')" title="Underline"><i class="bi bi-type-underline"></i></button>
                    <div class="vr"></div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertOrderedList')" title="Ordered List"><i class="bi bi-list-ol"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertUnorderedList')" title="Unordered List"><i class="bi bi-list-ul"></i></button>
                </div>
                <div id="essayEditor_${idx}" class="form-control cbt-input" contenteditable="true" style="min-height:120px; overflow-y:auto;" 
                    oninput="simpanJawaban(${idx}, document.getElementById('essayEditor_${idx}').innerHTML, true)">${val}</div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Update Navigasi
    document.getElementById("btnPrev").disabled = (idx === 0);
    document.getElementById("btnNext").disabled = (idx === soalList.length - 1);
    
    // Tampilkan tombol selesai jika di soal terakhir
    if(idx === soalList.length - 1) {
        document.getElementById("btnSelesai").classList.remove("d-none");
    } else {
        document.getElementById("btnSelesai").classList.add("d-none");
    }

    renderNavigasi();
}

function simpanJawaban(soalIdx, nilai, isEssay = false) {
    if(isEssay) {
        jawabanUser[soalIdx] = nilai;
    } else {
        jawabanUser[soalIdx] = parseInt(nilai);
    }
    
    // Update kotak warna navigasi
    const kotak = document.getElementById(`nav-kotak-${soalIdx}`);
    if(kotak) {
        if( (isEssay && nilai.trim() !== "") || (!isEssay && nilai !== null) ) {
            kotak.classList.add('dijawab');
        } else {
            kotak.classList.remove('dijawab');
        }
    }
}

function renderNavigasi() {
    const grid = document.getElementById("navGrid");
    let html = '';
    
    for(let i=0; i<soalList.length; i++) {
        let cls = 'nav-kotak';
        const jawb = jawabanUser[i];
        
        if(i === currentIdx) cls += ' aktif';
        
        const soalTipe = soalList[i].tipe;
        if(soalTipe === 'pg' && jawb !== null) cls += ' dijawab';
        if(soalTipe === 'essay' && jawb && jawb.toString().trim() !== "") cls += ' dijawab';

        html += `<div class="${cls}" id="nav-kotak-${i}" onclick="tampilkanSoal(${i})">${i+1}</div>`;
    }
    
    grid.innerHTML = html;
}

// ---------------------------------------------------------
// TIMER & KIPS
// ---------------------------------------------------------
function startTimer() {
    function tick() {
        if(sisaWaktuDetik <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timerDisplay").textContent = "00:00";
            autoSubmitUjian();
            return;
        }
        
        const m = Math.floor(sisaWaktuDetik / 60).toString().padStart(2, '0');
        const s = (sisaWaktuDetik % 60).toString().padStart(2, '0');
        
        const display = document.getElementById("timerDisplay");
        display.textContent = `${m}:${s}`;
        
        if(sisaWaktuDetik <= 300) { // 5 menit terakhir
            display.classList.remove("text-primary");
            display.classList.add("text-danger");
            display.style.backgroundColor = "#fee2e2";
            display.style.borderColor = "#fca5a5";
        }
        
        sisaWaktuDetik--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

/**
 * Bunyi alarm menggunakan Web Audio API (tidak perlu file audio eksternal)
 * Akan berbunyi 3 kali beep keras saat pelanggaran ke-3
 */
function playAlarm() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const beepCount = 3;
        const beepDuration = 0.35;
        const beepInterval = 0.5;

        for (let i = 0; i < beepCount; i++) {
            const osc = ctx.createOscillator();
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
        // Close context after all beeps done
        setTimeout(() => ctx.close(), beepCount * beepInterval * 1000 + 500);
    } catch(e) {
        console.warn('Audio API not supported:', e);
    }
}

function initKIPS() {
    // 1. Minta Fullscreen perlahan jika diklik area mana saja, 
    // karena browser butuh user interaction untuk requestFullscreen.
    document.body.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn("Gagal fullscreen:", err);
            });
        }
    }, {once: true}); // trigger once

    // 2. Tab switch detection
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === 'hidden') {
            tabSwitchCount++;
            document.getElementById("kipsOverlay").classList.remove("d-none");
            
            // Log ke firestore
            const user = getUserLocal();
            db.collection("logs").add({
                userId: user.uid,
                penugasanId: examData.penugasanId,
                action: "TAB_SWITCH",
                count: tabSwitchCount,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // UPDATE live violations ke hasilUjian tracking
            if(activeHasilUjianId) {
                db.collection("hasilUjian").doc(activeHasilUjianId).update({
                    pelanggaranTab: tabSwitchCount
                });
            }

            // ==========================================================
            // ALARM berbunyi tepat di pelanggaran ke-3!
            // ==========================================================
            if(tabSwitchCount === 3) {
                playAlarm();
                Swal.fire({
                    title: '⚠️ PERINGATAN KERAS!',
                    html: '<b>Ini pelanggaran ke-3!</b><br>Keluar lagi akan menyebabkan ujian otomatis dihentikan!',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Saya Mengerti',
                    allowOutsideClick: false
                }).then(() => {
                    document.getElementById("kipsOverlay").classList.add("d-none");
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(e => {});
                    }
                });
            }
            
            // Auto submit jika curang > 3 kali
            if(tabSwitchCount > 3) {
                Swal.fire('PELANGGARAN BERAT', 'Anda telah keluar ujian melebihi batas maksimal. Ujian otomatis dihentikan dan diserahkan!', 'error').then(() => {
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

// ---------------------------------------------------------
// SUBMIT UJIAN
// ---------------------------------------------------------
function submitUjianManual() {
    // Cek ada yang belum
    let belumPG = 0; let belumEssay = 0;
    soalList.forEach((s, idx) => {
        if(s.tipe === 'pg' && jawabanUser[idx] === null) belumPG++;
        if(s.tipe === 'essay' && (!jawabanUser[idx] || jawabanUser[idx].toString().trim() === "")) belumEssay++;
    });

    let msg = "Yakin ingin menyelesaikan ujian ini?<br>";
    if(belumPG > 0) msg += `- Ada <b>${belumPG}</b> soal PG yang BELUM dijawab.<br>`;
    if(belumEssay > 0) msg += `- Ada <b>${belumEssay}</b> soal Essay yang BELUM dijawab.<br>`;
    msg += "<br>Setelah selesai, Anda tidak dapat mengubah jawaban lagi.";

    Swal.fire({
        title: 'Selesaikan Ujian?',
        html: msg,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Selesai!'
    }).then((result) => {
        if (result.isConfirmed) {
            prosesSubmit("Selesai");
        }
    });
}

function autoSubmitUjian() {
    Swal.fire('Waktu Habis!', 'Jawaban Anda akan otomatis dikirim ke server.', 'info');
    prosesSubmit("Waktu Habis");
}

async function prosesSubmit(reason) {
    clearInterval(timerInterval);
    const user = getUserLocal();
    
    // Hitung peruntukan skor proporsional: tiap soal (PG maupun Essay) bernilai sama
    let benarPG = 0;
    let totalPG = 0;
    let totalEssay = 0;

    let payloadJawaban = {};

    soalList.forEach((s, idx) => {
        payloadJawaban[s.idAsli] = jawabanUser[idx];
        if(s.tipe === 'pg') {
            totalPG++;
            if(jawabanUser[idx] === s.jawabanBenarAsli) benarPG++;
        } else if(s.tipe === 'essay') {
            totalEssay++;
        }
    });

    const totalSoal = totalPG + totalEssay;
    // Setiap soal bernilai sama: 100 / totalSoal poin
    const nilaiPerSoal = totalSoal > 0 ? parseFloat((100 / totalSoal).toFixed(4)) : 0;

    // nilaiPG = soal PG benar × nilai per soal (proporsional)
    const nilaiPG = totalPG > 0 ? Math.round(benarPG * nilaiPerSoal * 10) / 10 : 0;
    // nilaiEssay maks = totalEssay × nilaiPerSoal (guru yang isi)
    const maxNilaiEssay = Math.round(totalEssay * nilaiPerSoal * 10) / 10;

    const durasiDetikAsli = (examData.durasi * 60) - sisaWaktuDetik;

    // Tentukan status berdasar ada/tidaknya essay
    const adaEssay = totalEssay > 0;
    let finalStatus = 'Selesai';
    if(adaEssay) finalStatus = 'Menunggu Koreksi';
    if(reason === 'Waktu Habis') finalStatus = adaEssay ? 'Menunggu Koreksi' : 'Selesai';

    const payload = {
        siswaId: user.uid,
        siswaNama: user.nama,
        penugasanId: examData.penugasanId,
        bankKode: examData.bankKode || bankData.kode,
        bankNama: bankData.nama,
        keterangan: reason,
        jawaban: payloadJawaban,
        nilaiPG: nilaiPG,           // Skor PG proporsional (bukan 0-100 lagi)
        nilaiEssay: null,            // Guru isi nanti
        nilaiAkhir: null,            // Dihitung setelah guru koreksi essay
        maxNilaiEssay: maxNilaiEssay,// Batas max nilai essay (untuk referensi guru)
        totalPG: totalPG,
        totalEssay: totalEssay,
        totalSoal: totalSoal,
        nilaiPerSoal: nilaiPerSoal,
        status: finalStatus,
        waktuBerapaLama: durasiDetikAsli,
        pelanggaranTab: tabSwitchCount,
        waktuSelesai: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Tampilkan loading screen
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status"></div>
            <h4 class="mt-4 text-success">Menyerahkan Ujian Anda...</h4>
        </div>
    `;

    try {
        if(unsubscribeHasil) {
            unsubscribeHasil(); // Matikan listener
        }
        
        if(activeHasilUjianId) {
            await db.collection("hasilUjian").doc(activeHasilUjianId).update(payload);
        } else {
            await db.collection("hasilUjian").add(payload);
        }
        
        sessionStorage.removeItem("cbt_active_exam");
        
        // Keluar dari fullscreen jika ada
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => Promise.resolve(err));
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
