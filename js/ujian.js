// ============================================================
// UJIAN.JS – Logic Ujian (KIPS, Timer, Navigasi, Email)
// ============================================================

// ── Guard ──
const sess = requireLogin("index.html");
if (!sess.paketKode) { window.location.href = "dashboard.html"; }

// ── State ──
let paket        = null;
let semua        = [];
let curIdx       = 0;
let jwbPG        = {};
let jwbEssay     = {};
let timerID      = null;
let sisaDetik    = 0;
let selesai      = false;
let violations   = 0;
const MAX_VIOL   = 3;

// ── DOM ──
const hdrNama    = document.getElementById("hdrNama");
const hdrPaket   = document.getElementById("hdrPaket");
const timerVal   = document.getElementById("timerVal");
const loading    = document.getElementById("loadingState");
const examArea   = document.getElementById("examArea");
const qNumber    = document.getElementById("qNumber");
const qText      = document.getElementById("qText");
const optsWrap   = document.getElementById("optsWrap");
const essayWrap  = document.getElementById("essayWrap");
const essayInput = document.getElementById("essayInput");
const btnPrev    = document.getElementById("btnPrev");
const btnNext    = document.getElementById("btnNext");
const btnSelesai = document.getElementById("btnSelesai");
const navInfo    = document.getElementById("navInfo");
const pgGrid     = document.getElementById("pgGrid");
const essayGrid  = document.getElementById("essayGrid");
const pgDone     = document.getElementById("pgDone");
const essayDone  = document.getElementById("essayDone");
const intBadge   = document.getElementById("integrityBadge");
const violCount  = document.getElementById("pelanggaranCount");

// ── Modals ──
const mKips    = new bootstrap.Modal(document.getElementById("modalKips"),   { backdrop: "static", keyboard: false });
const mSelesai = new bootstrap.Modal(document.getElementById("modalSelesai"),{ backdrop: "static" });
const mHasil   = new bootstrap.Modal(document.getElementById("modalHasil"),  { backdrop: "static", keyboard: false });

// ============================================================
// LOAD PAKET
// ============================================================
function loadPaket() {
    const sc = document.createElement("script");
    sc.src = sess.paketFile;
    sc.onload = function() {
        if (typeof PAKET === "undefined") {
            alert("File paket soal tidak valid!");
            window.location.href = "dashboard.html";
            return;
        }
        paket = PAKET;
        initUjian();
    };
    sc.onerror = function() {
        alert("Gagal memuat file paket soal.");
        window.location.href = "dashboard.html";
    };
    document.head.appendChild(sc);
}

// ============================================================
// INIT
// ============================================================
function initUjian() {
    hdrNama.textContent  = sess.nama;
    hdrPaket.textContent = paket.nama;
    document.title = paket.kode + " – CBT SAFE";

    semua = [
        ...paket.soalPG.map(s => ({ ...s, tipe: "pg" })),
        ...paket.soalEssay.map(s => ({ ...s, tipe: "essay" }))
    ];

    sisaDetik = (paket.durasi || 90) * 60;
    timerVal.textContent = formatWaktu(sisaDetik);

    renderGrid();
    loading.style.display = "none";
    examArea.style.display = "block";

    // Tampilkan KIPS popup dulu sebelum ujian benar-benar mulai
    mKips.show();
}

// ── Tombol "Saya Mengerti" di KIPS modal ──
document.getElementById("btnAkuMengerti").addEventListener("click", function() {
    mKips.hide();
    // Setelah modal tertutup, mulai ujian
    document.getElementById("modalKips").addEventListener("hidden.bs.modal", function startAfterKips() {
        this.removeEventListener("hidden.bs.modal", startAfterKips);
        tampilSoal(0);
        startTimer();
        setupGuards();
        enterFullscreen();
    }, { once: true });
});

// ============================================================
// TIMER
// ============================================================
function startTimer() {
    updateTimer();
    timerID = setInterval(function() {
        sisaDetik--;
        updateTimer();
        if (sisaDetik <= 0) {
            clearInterval(timerID);
            autoKumpul();
        }
    }, 1000);
}

function updateTimer() {
    timerVal.textContent = formatWaktu(sisaDetik);
    const total = (paket.durasi || 90) * 60;
    const pct   = sisaDetik / total;
    timerVal.className = "timer-val";
    if (pct <= 0.1)       timerVal.classList.add("danger");
    else if (pct <= 0.25) timerVal.classList.add("warn");
}

function autoKumpul() {
    if (selesai) return;
    simpanEssay();
    alert("⏰ Waktu ujian habis! Jawaban dikumpulkan otomatis.");
    kumpulkan();
}

// ============================================================
// TAMPIL SOAL
// ============================================================
function tampilSoal(idx) {
    simpanEssay();
    curIdx = idx;
    const s = semua[idx];
    const total = semua.length;

    const tipeTxt = s.tipe === "essay" ? " — Essay" : " — Pilihan Ganda";
    qNumber.textContent = `Soal ${idx + 1} dari ${total}${tipeTxt}`;
    qText.innerHTML     = s.pertanyaan;
    navInfo.textContent = `${idx + 1} / ${total}`;

    if (s.tipe === "pg") {
        optsWrap.style.display  = "block";
        essayWrap.style.display = "none";
        renderOpts(s);
    } else {
        optsWrap.style.display  = "none";
        essayWrap.style.display = "block";
        essayInput.value = jwbEssay[s.id] || "";
    }

    btnPrev.disabled     = (idx === 0);
    const isLast         = (idx === total - 1);
    btnNext.style.display    = isLast ? "none" : "flex";
    btnSelesai.style.display = isLast ? "flex" : "none";

    updateGrid();
}

function renderOpts(soal) {
    optsWrap.innerHTML = "";
    const huruf = ["A","B","C","D"];
    soal.opsi.forEach(function(opt, i) {
        const sel = jwbPG[soal.id] === i;
        const div = document.createElement("div");
        div.className = "opt" + (sel ? " selected" : "");
        div.innerHTML = `
            <input type="radio" name="pg_${soal.id}" value="${i}" ${sel ? "checked" : ""}>
            <div class="opt-letter">${huruf[i] || i}</div>
            <div class="opt-text">${escapeHTML(opt)}</div>
        `;
        div.addEventListener("click", function() {
            if (selesai) return;
            jwbPG[soal.id] = i;
            renderOpts(soal);
            updateGrid();
        });
        optsWrap.appendChild(div);
    });
}

// ============================================================
// GRID NAVIGASI
// ============================================================
function renderGrid() {
    pgGrid.innerHTML    = "";
    essayGrid.innerHTML = "";

    paket.soalPG.forEach(function(s, i) {
        const btn = createSqBtn(i + 1, "sq", function() {
            simpanEssay(); tampilSoal(i);
        });
        pgGrid.appendChild(btn);
    });

    paket.soalEssay.forEach(function(s, i) {
        const idx = paket.soalPG.length + i;
        const btn = createSqBtn("E"+(i+1), "sq essay", function() {
            simpanEssay(); tampilSoal(idx);
        });
        essayGrid.appendChild(btn);
    });
}

function createSqBtn(label, cls, fn) {
    const b = document.createElement("button");
    b.className = cls; b.textContent = label;
    b.addEventListener("click", fn);
    return b;
}

function updateGrid() {
    // PG
    const pgBtns = pgGrid.querySelectorAll(".sq");
    pgBtns.forEach(function(btn, i) {
        const soal = paket.soalPG[i];
        btn.className = "sq";
        if (jwbPG[soal.id] !== undefined) btn.classList.add("done");
        if (i === curIdx)                  btn.classList.add("active");
    });

    // Essay
    const eBtns = essayGrid.querySelectorAll(".sq");
    eBtns.forEach(function(btn, i) {
        const idx  = paket.soalPG.length + i;
        const soal = paket.soalEssay[i];
        btn.className = "sq essay";
        const jwb = jwbEssay[soal.id];
        if (jwb && jwb.trim()) btn.classList.add("done");
        if (idx === curIdx)    btn.classList.add("active");
    });

    // Counts
    pgDone.textContent    = Object.keys(jwbPG).length;
    essayDone.textContent = Object.values(jwbEssay).filter(v => v && v.trim()).length;
}

function simpanEssay() {
    const s = semua[curIdx];
    if (s && s.tipe === "essay") jwbEssay[s.id] = essayInput.value;
}

// ============================================================
// NAVIGASI
// ============================================================
btnPrev.addEventListener("click", function() { if (curIdx > 0) tampilSoal(curIdx - 1); });
btnNext.addEventListener("click", function() { if (curIdx < semua.length - 1) tampilSoal(curIdx + 1); });

// ============================================================
// TOMBOL SELESAI
// ============================================================
btnSelesai.addEventListener("click", function() {
    simpanEssay();
    const pg    = Object.keys(jwbPG).length;
    const es    = Object.values(jwbEssay).filter(v => v && v.trim()).length;
    const kosong = (paket.soalPG.length + paket.soalEssay.length) - pg - es;

    document.getElementById("mPGdone").textContent    = pg + "/" + paket.soalPG.length;
    document.getElementById("mEssaydone").textContent = es + "/" + paket.soalEssay.length;
    document.getElementById("mKosong").textContent    = kosong;
    mSelesai.show();
});

document.getElementById("btnBatalSelesai").addEventListener("click", function() { mSelesai.hide(); });

document.getElementById("btnKonfirmSelesai").addEventListener("click", function() {
    mSelesai.hide();
    kumpulkan();
});

// ============================================================
// KUMPULKAN (hitung nilai + kirim email)
// ============================================================
function kumpulkan() {
    if (selesai) return;
    selesai = true;
    clearInterval(timerID);
    simpanEssay();

    let benar = 0;
    paket.soalPG.forEach(function(s) {
        if (jwbPG[s.id] === s.jawaban) benar++;
    });
    const total = paket.soalPG.length;
    const nilai = Math.round((benar / total) * 100);
    const salah = total - benar;
    const esCount = Object.values(jwbEssay).filter(v => v && v.trim()).length;

    // Update modal hasil
    document.getElementById("hNilai").textContent = nilai;
    document.getElementById("hBenar").textContent = benar;
    document.getElementById("hSalah").textContent = salah;
    document.getElementById("hEssay").textContent = esCount + "/" + paket.soalEssay.length;
    document.getElementById("hNama").textContent  = sess.nama;

    mHasil.show();
    kirimEmail(nilai, benar, total, esCount);

    document.getElementById("btnBackDash").addEventListener("click", function() {
        const s = getSession();
        delete s.paketKode; delete s.paketFile; delete s.paketNama;
        setSession(s);
        window.location.href = "dashboard.html";
    }, { once: true });
}

// ============================================================
// KIRIM EMAIL
// ============================================================
function kirimEmail(nilai, benar, total, esCount) {
    const box = document.getElementById("emailBox");
    const msg = document.getElementById("emailMsg");

    // Susun teks essay
    let essayTxt = "";
    paket.soalEssay.forEach(function(s, i) {
        essayTxt += `\n[E${i+1}] ${s.pertanyaan}\nJawaban: ${jwbEssay[s.id] || "(tidak dijawab)"}\n`;
    });

    // Susun ringkasan PG
    let pgTxt = "";
    paket.soalPG.forEach(function(s, i) {
        const pi  = jwbPG[s.id];
        const pil = pi !== undefined ? escapeHTML(s.opsi[pi]) : "(tidak dijawab)";
        pgTxt += `${i+1}. ${s.pertanyaan}\n   Pilihan: ${pil} ${pi === s.jawaban ? "✓" : "✗"}\n`;
    });

    const params = {
        nama_peserta: sess.nama,
        paket:        paket.nama,
        nilai:        nilai,
        benar:        benar,
        total_pg:     total,
        salah:        total - benar,
        essay_dijawab:esCount,
        total_essay:  paket.soalEssay.length,
        waktu:        new Date().toLocaleString("id-ID"),
        jawaban_essay: essayTxt,
        ringkasan_pg: pgTxt,
        to_email:     CONFIG.emailGuru
    };

    if (CONFIG.emailJS.publicKey === "YOUR_PUBLIC_KEY") {
        msg.innerHTML = `<i class="bi bi-exclamation-circle-fill me-2" style="color:var(--orange);font-size:1rem;"></i>
            <span style="color:var(--orange);">EmailJS belum dikonfigurasi. Isi <code>js/config.js</code> dengan kredensial EmailJS Anda.</span>`;
        box.style.background = "#fff7ed";
        box.style.borderColor = "#fed7aa";
        return;
    }

    try {
        emailjs.init({ publicKey: CONFIG.emailJS.publicKey });
        emailjs.send(CONFIG.emailJS.serviceId, CONFIG.emailJS.templateId, params)
            .then(function() {
                msg.innerHTML = `<i class="bi bi-check-circle-fill me-2" style="color:var(--green);font-size:1rem;"></i>
                    <span style="color:var(--green);">Hasil berhasil dikirim ke <strong>${CONFIG.emailGuru}</strong></span>`;
                box.style.background = "#f0fdf4";
                box.style.borderColor = "#86efac";
            }, function(err) {
                msg.innerHTML = `<i class="bi bi-x-circle-fill me-2" style="color:var(--red);font-size:1rem;"></i>
                    <span style="color:var(--red);">Gagal kirim email: ${err.text || "error"}. Catat nilai: <strong>${nilai}</strong></span>`;
                box.style.background = "#fff1f2";
                box.style.borderColor = "#fecaca";
            });
    } catch(e) {
        msg.innerHTML = `<i class="bi bi-x-circle-fill me-2" style="color:var(--red);"></i>Error: ${e.message}`;
    }
}

// ============================================================
// INTEGRITY GUARDS (KIPS) – 3× → auto kumpul
// ============================================================
function beep() {
    try {
        const ctx = new AudioContext();
        const o   = ctx.createOscillator();
        const g   = ctx.createGain();
        o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.4;
        o.connect(g); g.connect(ctx.destination);
        o.start(); setTimeout(() => o.stop(), 180);
    } catch(e) {}
}

function addViolation(alasan) {
    if (selesai) return;
    violations++;
    violCount.textContent = violations;

    intBadge.className = "integrity-warn";
    intBadge.innerHTML = `<i class="bi bi-shield-exclamation me-1"></i>Pelanggaran (${violations}/${MAX_VIOL})`;

    beep();

    if (violations >= MAX_VIOL) {
        // Auto-kumpulkan karena sudah 3× pelanggaran
        clearInterval(timerID);
        selesai = true;
        simpanEssay();

        // Tampilkan pemberitahuan lalu langsung kumpulkan
        setTimeout(function() {
            alert(`🚫 Anda telah melanggar ${MAX_VIOL}× peraturan KIPS.\nUjian dikumpulkan secara otomatis!`);
            kumpulkan();
        }, 200);
    }
}

function setupGuards() {
    window.addEventListener("blur", function() {
        if (!selesai) addViolation("window blur");
    });

    document.addEventListener("visibilitychange", function() {
        if (document.hidden && !selesai) addViolation("tab/window hidden");
    });

    window.addEventListener("keydown", function(e) {
        const blocked =
            (e.ctrlKey && ["r","R","u","U","s","S","c","C","a","A"].includes(e.key)) ||
            ["F5","F12","F11","F6"].includes(e.key);
        if (blocked) { e.preventDefault(); addViolation("key: " + e.key); }
    });

    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        addViolation("klik kanan");
    });

    window.addEventListener("beforeunload", function(e) {
        if (!selesai) {
            e.preventDefault();
            e.returnValue = "Ujian sedang berlangsung!";
        }
    });
}

// ============================================================
// FULLSCREEN
// ============================================================
function enterFullscreen() {
    const el = document.documentElement;
    try {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch(e) {}
}

// ── Start ──
loadPaket();
