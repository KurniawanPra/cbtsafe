// ============================================================
// PAKET SOAL KK01 – Basis Data
// Kelas 11 Semester Genap – UTS
// ============================================================
const PAKET = {
    kode: "KK01",
    nama: "KK01 – Basis Data",
    deskripsi: "Uji kompetensi Basis Data: ERD, normalisasi, SQL, relasi tabel, dan manajemen database.",
    durasi: 90,
    jumlahPG: 40,
    jumlahEssay: 5,

    soalPG: [
        // — KONSEP DASAR DATABASE —
        { id: 1,  pertanyaan: "DBMS (Database Management System) adalah perangkat lunak yang berfungsi untuk…", opsi: ["Membuat desain grafis antarmuka", "Mengelola, menyimpan, dan mengakses data secara terstruktur", "Mengkompilasi kode program", "Mengelola jaringan komputer"], jawaban: 1 },
        { id: 2,  pertanyaan: "Entitas dalam ERD (Entity Relationship Diagram) digambarkan dengan simbol…", opsi: ["Lingkaran/elips", "Belah ketupat", "Persegi panjang", "Garis panah"], jawaban: 2 },
        { id: 3,  pertanyaan: "Atribut dalam ERD digambarkan dengan simbol…", opsi: ["Persegi panjang", "Lingkaran/elips", "Belah ketupat", "Segitiga"], jawaban: 1 },
        { id: 4,  pertanyaan: "Relasi antar entitas dalam ERD digambarkan dengan simbol…", opsi: ["Persegi panjang", "Lingkaran", "Belah ketupat", "Garis lurus saja"], jawaban: 2 },
        { id: 5,  pertanyaan: "Primary Key adalah atribut yang…", opsi: ["Boleh bernilai NULL dan duplikat", "Unik dan tidak boleh NULL, digunakan untuk mengidentifikasi baris secara unik", "Hanya berisi angka", "Selalu kolom pertama dalam tabel"], jawaban: 1 },
        { id: 6,  pertanyaan: "Foreign Key adalah atribut yang…", opsi: ["Kunci utama di tabel itu sendiri", "Mengacu pada Primary Key di tabel lain untuk membangun relasi", "Tidak boleh diisi", "Hanya ada satu di setiap tabel"], jawaban: 1 },
        { id: 7,  pertanyaan: "Kardinalitas relasi One-to-Many artinya…", opsi: ["Satu entitas di tabel A hanya berhubungan dengan satu entitas di tabel B", "Satu entitas di tabel A berhubungan dengan banyak entitas di tabel B", "Banyak entitas A berhubungan dengan banyak entitas B", "Tidak ada relasi"], jawaban: 1 },
        { id: 8,  pertanyaan: "Contoh nyata relasi Many-to-Many adalah…", opsi: ["Satu siswa memiliki satu NIS", "Satu guru mengajar satu kelas", "Satu siswa bisa ikut banyak ekstrakurikuler, satu ekskul bisa diikuti banyak siswa", "Satu tabel hanya memiliki satu record"], jawaban: 2 },

        // — NORMALISASI —
        { id: 9,  pertanyaan: "Tujuan utama normalisasi database adalah…", opsi: ["Memperbesar ukuran database", "Mengurangi redundansi data dan menghindari anomali", "Menambah jumlah tabel sebanyak mungkin", "Membuat query menjadi lebih panjang"], jawaban: 1 },
        { id: 10, pertanyaan: "Tabel dikatakan memenuhi 1NF (First Normal Form) jika…", opsi: ["Tidak ada atribut yang bergantung transitif", "Semua atribut bersifat atomik (tidak ada nilai ganda dalam satu sel)", "Semua atribut bergantung penuh pada seluruh primary key", "Tidak ada redundansi sama sekali"], jawaban: 1 },
        { id: 11, pertanyaan: "Tabel memenuhi 2NF jika…", opsi: ["Sudah 1NF dan setiap atribut non-kunci bergantung penuh pada seluruh primary key", "Sudah 1NF dan tidak ada atribut NULL", "Sudah 3NF dan tidak ada relasi", "Hanya memiliki satu kolom"], jawaban: 0 },
        { id: 12, pertanyaan: "Anomali yang terjadi saat data yang sama harus diperbarui di banyak tempat disebut…", opsi: ["Insertion anomaly", "Deletion anomaly", "Update anomaly", "Query anomaly"], jawaban: 2 },
        { id: 13, pertanyaan: "Tabel memenuhi 3NF jika…", opsi: ["Sudah 2NF dan tidak ada ketergantungan transitif antar atribut non-kunci", "Sudah 1NF dan semua nilai unik", "Tidak memiliki foreign key", "Hanya terdiri dari primary key"], jawaban: 0 },
        { id: 14, pertanyaan: "Ketergantungan transitif (transitive dependency) terjadi ketika…", opsi: ["Atribut non-kunci bergantung pada atribut non-kunci lainnya (bukan langsung pada primary key)", "Primary key bergantung pada foreign key", "Semua kolom bernilai NULL", "Dua tabel memiliki nama yang sama"], jawaban: 0 },

        // — SQL DDL —
        { id: 15, pertanyaan: "Perintah SQL untuk membuat database baru adalah…", opsi: ["NEW DATABASE db_sekolah", "MAKE DATABASE db_sekolah", "CREATE DATABASE db_sekolah", "BUILD DATABASE db_sekolah"], jawaban: 2 },
        { id: 16, pertanyaan: "Perintah SQL untuk membuat tabel baru adalah…", opsi: ["CREATE TABLE siswa (...)", "MAKE TABLE siswa (...)", "BUILD TABLE siswa (...)", "ADD TABLE siswa (...)"], jawaban: 0 },
        { id: 17, pertanyaan: "Perintah untuk menambah kolom baru pada tabel yang sudah ada adalah…", opsi: ["UPDATE TABLE siswa ADD COLUMN alamat VARCHAR(100)", "MODIFY TABLE siswa ADD COLUMN alamat VARCHAR(100)", "ALTER TABLE siswa ADD COLUMN alamat VARCHAR(100)", "INSERT TABLE siswa ADD COLUMN alamat VARCHAR(100)"], jawaban: 2 },
        { id: 18, pertanyaan: "Perintah SQL untuk menghapus tabel beserta seluruh isinya adalah…", opsi: ["DELETE TABLE siswa", "REMOVE TABLE siswa", "DROP TABLE siswa", "CLEAR TABLE siswa"], jawaban: 2 },
        { id: 19, pertanyaan: "Tipe data yang paling tepat untuk menyimpan nomor telepon di MySQL adalah…", opsi: ["INT", "FLOAT", "VARCHAR(15)", "BOOLEAN"], jawaban: 2 },
        { id: 20, pertanyaan: "Constraint NOT NULL pada kolom berarti…", opsi: ["Kolom hanya boleh berisi angka nol", "Kolom tidak boleh dikosongkan saat insert data", "Kolom harus unik", "Kolom adalah primary key"], jawaban: 1 },
        { id: 21, pertanyaan: "Fungsi AUTO_INCREMENT di MySQL digunakan untuk…", opsi: ["Mengurutkan data secara otomatis", "Mengisi nilai kolom secara otomatis dengan angka yang bertambah setiap kali insert", "Menghapus data duplikat", "Mengenkripsi data"], jawaban: 1 },

        // — SQL DML —
        { id: 22, pertanyaan: "Perintah SQL untuk menampilkan semua kolom dari tabel siswa adalah…", opsi: ["SHOW * FROM siswa", "SELECT * FROM siswa", "GET ALL FROM siswa", "DISPLAY siswa"], jawaban: 1 },
        { id: 23, pertanyaan: "Perintah SQL untuk menampilkan siswa dengan nama 'Budi' adalah…", opsi: ["SELECT * FROM siswa FILTER nama='Budi'", "SELECT * FROM siswa WHERE nama='Budi'", "SELECT * FROM siswa HAVING nama='Budi'", "SELECT nama FROM siswa = 'Budi'"], jawaban: 1 },
        { id: 24, pertanyaan: "Perintah SQL untuk menambah data baru ke tabel adalah…", opsi: ["ADD INTO siswa VALUES (...)", "INSERT INTO siswa VALUES (...)", "PUSH INTO siswa VALUES (...)", "PUT INTO siswa VALUES (...)"], jawaban: 1 },
        { id: 25, pertanyaan: "Perintah SQL untuk mengubah data yang sudah ada adalah…", opsi: ["CHANGE siswa SET nama='Andi' WHERE id=1", "MODIFY siswa SET nama='Andi' WHERE id=1", "UPDATE siswa SET nama='Andi' WHERE id=1", "EDIT siswa SET nama='Andi' WHERE id=1"], jawaban: 2 },
        { id: 26, pertanyaan: "Perintah SQL untuk menghapus baris data tertentu adalah…", opsi: ["REMOVE FROM siswa WHERE id=1", "ERASE FROM siswa WHERE id=1", "DELETE FROM siswa WHERE id=1", "DROP FROM siswa WHERE id=1"], jawaban: 2 },
        { id: 27, pertanyaan: "Klausa ORDER BY digunakan untuk…", opsi: ["Mengelompokkan data", "Mengurutkan hasil query", "Memfilter data dengan kondisi", "Menghitung jumlah baris"], jawaban: 1 },
        { id: 28, pertanyaan: "Untuk menampilkan data siswa diurutkan berdasarkan nilai dari terbesar ke terkecil, perintah yang benar adalah…", opsi: ["SELECT * FROM siswa ORDER BY nilai ASC", "SELECT * FROM siswa ORDER BY nilai DESC", "SELECT * FROM siswa SORT BY nilai DESC", "SELECT * FROM siswa ARRANGE nilai DESC"], jawaban: 1 },
        { id: 29, pertanyaan: "Klausa LIMIT pada SQL digunakan untuk…", opsi: ["Membatasi jumlah baris yang ditampilkan", "Membatasi jumlah kolom", "Memfilter kondisi tertentu", "Mengurutkan data"], jawaban: 0 },
        { id: 30, pertanyaan: "Fungsi agregat untuk menghitung jumlah baris adalah…", opsi: ["SUM()", "AVG()", "COUNT()", "MAX()"], jawaban: 2 },
        { id: 31, pertanyaan: "Fungsi agregat untuk menghitung nilai rata-rata kolom adalah…", opsi: ["COUNT()", "SUM()", "MAX()", "AVG()"], jawaban: 3 },
        { id: 32, pertanyaan: "Klausa GROUP BY digunakan bersama fungsi agregat untuk…", opsi: ["Mengurutkan data", "Mengelompokkan baris berdasarkan nilai kolom tertentu", "Memfilter kondisi setelah agregasi", "Menghapus duplikasi"], jawaban: 1 },
        { id: 33, pertanyaan: "Perbedaan WHERE dan HAVING di SQL adalah…", opsi: ["Tidak ada perbedaan, keduanya sama", "WHERE digunakan sebelum GROUP BY, HAVING digunakan setelah GROUP BY", "HAVING digunakan sebelum GROUP BY, WHERE digunakan setelah GROUP BY", "WHERE hanya untuk angka, HAVING hanya untuk teks"], jawaban: 1 },

        // — JOIN —
        { id: 34, pertanyaan: "Jenis JOIN yang menampilkan hanya baris yang memiliki pasangan di kedua tabel adalah…", opsi: ["LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN"], jawaban: 3 },
        { id: 35, pertanyaan: "LEFT JOIN menampilkan…", opsi: ["Hanya baris yang cocok di kedua tabel", "Semua baris dari tabel kiri, dengan NULL jika tidak ada pasangan di tabel kanan", "Semua baris dari tabel kanan, dengan NULL jika tidak ada pasangan di tabel kiri", "Semua baris dari kedua tabel"], jawaban: 1 },
        { id: 36, pertanyaan: "Query berikut yang benar untuk menampilkan nama siswa beserta nama kelas dari dua tabel berbeda menggunakan INNER JOIN adalah…", opsi: ["SELECT s.nama, k.nama_kelas FROM siswa s INNER JOIN kelas k WHERE s.id_kelas = k.id", "SELECT s.nama, k.nama_kelas FROM siswa s INNER JOIN kelas k ON s.id_kelas = k.id", "SELECT * FROM siswa COMBINE kelas ON siswa.id_kelas = kelas.id", "SELECT siswa.nama FROM siswa + kelas WHERE id_kelas = id"], jawaban: 1 },

        // — LANJUTAN —
        { id: 37, pertanyaan: "VIEW pada database adalah…", opsi: ["Tabel fisik yang menyimpan data", "Tabel virtual yang dibentuk dari hasil query SELECT", "Prosedur tersimpan", "Indeks pada tabel"], jawaban: 1 },
        { id: 38, pertanyaan: "Perintah COMMIT dalam transaksi database berfungsi untuk…", opsi: ["Membatalkan semua perubahan dalam transaksi", "Menyimpan/mengonfirmasi semua perubahan dalam transaksi secara permanen", "Memulai transaksi baru", "Menghapus tabel"], jawaban: 1 },
        { id: 39, pertanyaan: "Perintah ROLLBACK dalam transaksi database berfungsi untuk…", opsi: ["Menyimpan perubahan secara permanen", "Membatalkan semua perubahan dalam transaksi dan kembali ke kondisi sebelumnya", "Membuat tabel baru", "Mengunci tabel"], jawaban: 1 },
        { id: 40, pertanyaan: "Operator LIKE dengan wildcard '%' digunakan untuk…", opsi: ["Mencari nilai yang sama persis", "Mencari nilai yang diawali, diakhiri, atau mengandung pola tertentu", "Membandingkan dua angka", "Menghitung jumlah karakter"], jawaban: 1 }
    ],

    soalEssay: [
        { id: 41, pertanyaan: "Buatlah sebuah ERD sederhana untuk sistem perpustakaan sekolah! ERD harus mencakup minimal 3 entitas (Buku, Anggota, Peminjaman), atribut masing-masing entitas, dan relasi antar entitas beserta kardinalitasnya. Jelaskan alasan pemilihan kardinalitas tersebut!" },
        { id: 42, pertanyaan: "Diberikan tabel berikut yang belum ternormalisasi:\nID_Pesanan | Nama_Pelanggan | Alamat | Nama_Produk | Harga | Qty\n\nLakukan normalisasi tabel tersebut hingga mencapai 3NF (Third Normal Form)! Jelaskan setiap langkah normalisasi (1NF → 2NF → 3NF) beserta alasannya!" },
        { id: 43, pertanyaan: "Diberikan dua tabel:\n- tabel 'siswa' (id_siswa, nama, id_kelas)\n- tabel 'kelas' (id_kelas, nama_kelas, wali_kelas)\n\nTuliskan query SQL untuk:\na) Menampilkan nama siswa beserta nama kelas mereka menggunakan INNER JOIN\nb) Menampilkan semua kelas beserta nama siswanya (termasuk kelas yang belum punya siswa) menggunakan LEFT JOIN\nc) Menghitung jumlah siswa di setiap kelas menggunakan GROUP BY dan COUNT()" },
        { id: 44, pertanyaan: "Jelaskan konsep transaksi database (ACID)! Apa yang dimaksud dengan Atomicity, Consistency, Isolation, dan Durability? Berikan contoh nyata skenario transaksi perbankan yang menjelaskan pentingnya sifat Atomicity!" },
        { id: 45, pertanyaan: "Apa perbedaan antara PRIMARY KEY, FOREIGN KEY, dan UNIQUE constraint dalam MySQL? Kapan kita harus menggunakan masing-masing constraint tersebut? Berikan contoh pernyataan SQL CREATE TABLE yang menggunakan ketiga constraint tersebut!" }
    ]
};
