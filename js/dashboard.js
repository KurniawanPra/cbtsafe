// ============================================================
// DASHBOARD.JS
// ============================================================
const sess = requireLogin("index.html");

// Header
document.getElementById("hdrNama").textContent = sess.nama;
document.getElementById("greetNama").textContent = sess.nama;
document.getElementById("hdrSekolah").textContent = CONFIG.namaSekolah || "";

// ── Modal instances ──
const mLogout = new bootstrap.Modal(document.getElementById("modalLogout"));
const mPaket  = new bootstrap.Modal(document.getElementById("modalPaket"));

// ── Logout via modal ──
document.getElementById("logoutTrigger").addEventListener("click", function() {
  mLogout.show();
});
document.getElementById("btnLogoutOk").addEventListener("click", function() {
  clearSession();
  window.location.href = "index.html";
});

// ── Render kartu paket ──
const grid = document.getElementById("paketGrid");
let selectedPaket = null;

const iconMap   = { KK01: "bi-code-slash", KK02: "bi-wifi",    KK03: "bi-database" };
const colorMap  = { KK01: "",              KK02: "green",       KK03: "orange" };

CONFIG.daftarPaket.forEach(function(p) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  const icon  = iconMap[p.kode]  || "bi-file-text";
  const color = colorMap[p.kode] || "";

  col.innerHTML = `
    <div class="paket-card" role="button" tabindex="0" aria-label="Pilih ${p.nama}">
      <div class="paket-icon ${color}"><i class="bi ${icon}"></i></div>
      <div class="paket-kode">${p.kode}</div>
      <div class="paket-nama">${p.nama}</div>
      <div class="paket-desc">${p.deskripsi}</div>
      <div class="paket-meta">
        <div class="paket-meta-item"><i class="bi bi-question-circle"></i> 40 PG + 5 Essay</div>
        <div class="paket-meta-item"><i class="bi bi-clock"></i> 90 Menit</div>
      </div>
      <div class="paket-cta">Pilih Paket <i class="bi bi-arrow-right"></i></div>
    </div>
  `;

  function openModal() {
    selectedPaket = p;
    document.getElementById("mKode").textContent  = p.kode;
    document.getElementById("mNama").textContent  = p.nama;
    document.getElementById("mDesc").textContent  = p.deskripsi;
    document.getElementById("mPG").textContent    = p.jumlahPG   || 40;
    document.getElementById("mEssay").textContent = p.jumlahEssay || 5;
    document.getElementById("mDurasi").textContent = p.durasi     || 90;
    mPaket.show();
  }

  const card = col.querySelector(".paket-card");
  card.addEventListener("click", openModal);
  card.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
  });

  grid.appendChild(col);
});

// ── Mulai ujian ──
document.getElementById("btnMulai").addEventListener("click", function() {
  if (!selectedPaket) return;
  const s = getSession();
  s.paketKode  = selectedPaket.kode;
  s.paketFile  = selectedPaket.file;
  s.paketNama  = selectedPaket.nama;
  s.paketDurasi = selectedPaket.durasi || 90;
  setSession(s);
  mPaket.hide();
  setTimeout(function() { window.location.href = "ujian.html"; }, 250);
});
