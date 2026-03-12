// ============================================================
// KONFIGURASI APLIKASI CBT
// Edit file ini untuk menyesuaikan pengaturan EmailJS dan email tujuan
// ============================================================
const CONFIG = {
    // ---- EmailJS Configuration ----
    // Daftar di https://www.emailjs.com/ untuk mendapatkan kredensial
    emailJS: {
        publicKey: "VIE6TNFIjWvo60DE6",       // Dari: Account > API Keys
        serviceId: "service_tc7hfgh",       // Dari: Email Services > Service ID
        templateId: "template_mpmo2we",    // Dari: Email Templates > Template ID
    },

    // ---- Email Tujuan Guru ----
    emailGuru: "ayamsaya85@gmail.com",

    // ---- Nama Aplikasi ----
    namaAplikasi: "CBT SAFE – Ujian Online",
    namaSekolah: "SMK Negeri 1",

    // ---- Daftar Paket Soal yang Tersedia ----
    // Tambahkan paket baru di sini, pastikan file soal/KODE.js sudah dibuat
    daftarPaket: [
        {
            kode: "KK01",
            nama: "KK01 – Basis Data",
            deskripsi: "ERD, normalisasi, SQL, relasi tabel, dan manajemen database",
            icon: "bi-database",
            warna: "primary",
            file: "soal/KK01.js"
        },
        {
            kode: "KK02",
            nama: "KK02 – Jaringan Dasar",
            deskripsi: "Uji kompetensi dasar jaringan komputer",
            icon: "bi-wifi",
            warna: "success",
            file: "soal/KK02.js"
        },
        {
            kode: "KK03",
            nama: "KK03 – PHP, Laravel & Web",
            deskripsi: "PHP, Laravel framework, and web development (in English)",
            icon: "bi-globe",
            warna: "warning",
            file: "soal/KK03.js"
        }
    ]
};
