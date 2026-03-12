// ============================================================
// PAKET SOAL KK02 - Jaringan Dasar
// ============================================================
const PAKET = {
    kode: "KK02",
    nama: "KK02 - Jaringan Dasar",
    deskripsi: "Uji kompetensi dasar jaringan komputer meliputi topologi, protokol, pengalamatan IP, dan perangkat jaringan.",
    durasi: 90, // menit
    jumlahPG: 40,
    jumlahEssay: 5,

    soalPG: [
        { id: 1, pertanyaan: "Kepanjangan dari LAN adalah?", opsi: ["Local Area Network", "Large Area Network", "Long Area Network", "Local Access Node"], jawaban: 0 },
        { id: 2, pertanyaan: "Perangkat yang berfungsi menghubungkan dua atau lebih jaringan berbeda adalah?", opsi: ["Switch", "Hub", "Router", "Repeater"], jawaban: 2 },
        { id: 3, pertanyaan: "Berapa jumlah bit yang terdapat dalam sebuah alamat IPv4?", opsi: ["16 bit", "32 bit", "64 bit", "128 bit"], jawaban: 1 },
        { id: 4, pertanyaan: "Protokol yang digunakan untuk mengirim email adalah?", opsi: ["HTTP", "FTP", "SMTP", "POP3"], jawaban: 2 },
        { id: 5, pertanyaan: "Lapisan OSI yang bertanggung jawab untuk routing adalah?", opsi: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"], jawaban: 1 },
        { id: 6, pertanyaan: "Alamat IP kelas C memiliki rentang nilai oktet pertama?", opsi: ["1-126", "128-191", "192-223", "224-239"], jawaban: 2 },
        { id: 7, pertanyaan: "Topologi jaringan yang semua perangkat terhubung ke satu kabel utama disebut?", opsi: ["Star", "Ring", "Bus", "Mesh"], jawaban: 2 },
        { id: 8, pertanyaan: "Perangkat yang bekerja pada Layer 2 OSI dan meneruskan frame berdasarkan MAC address adalah?", opsi: ["Router", "Switch", "Hub", "Modem"], jawaban: 1 },
        { id: 9, pertanyaan: "Protokol yang digunakan untuk mengambil email dari server adalah?", opsi: ["SMTP", "HTTP", "IMAP", "FTP"], jawaban: 2 },
        { id: 10, pertanyaan: "Subnet mask default untuk kelas B adalah?", opsi: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"], jawaban: 1 },
        { id: 11, pertanyaan: "Protokol yang digunakan untuk transfer file antara client dan server adalah?", opsi: ["HTTP", "FTP", "SMTP", "DNS"], jawaban: 1 },
        { id: 12, pertanyaan: "Berapa jumlah bit yang terdapat dalam sebuah alamat IPv6?", opsi: ["32 bit", "64 bit", "128 bit", "256 bit"], jawaban: 2 },
        { id: 13, pertanyaan: "Fungsi dari protokol DNS adalah?", opsi: ["Mengirim email", "Mentranslasi nama domain ke IP address", "Mengamankan data", "Transfer file"], jawaban: 1 },
        { id: 14, pertanyaan: "Port yang digunakan oleh protokol HTTP secara default adalah?", opsi: ["21", "25", "80", "443"], jawaban: 2 },
        { id: 15, pertanyaan: "Kabel yang menggunakan sinyal cahaya untuk transmisi data adalah?", opsi: ["Coaxial", "UTP", "STP", "Fiber Optic"], jawaban: 3 },
        { id: 16, pertanyaan: "Topologi jaringan di mana setiap perangkat terhubung ke semua perangkat lain disebut?", opsi: ["Bus", "Star", "Mesh", "Ring"], jawaban: 2 },
        { id: 17, pertanyaan: "Protokol yang digunakan untuk mengamankan komunikasi HTTP adalah?", opsi: ["FTP", "SSH", "HTTPS/TLS", "SMTP"], jawaban: 2 },
        { id: 18, pertanyaan: "Port yang digunakan SSH secara default adalah?", opsi: ["21", "22", "23", "25"], jawaban: 1 },
        { id: 19, pertanyaan: "Alamat IP 127.0.0.1 dikenal sebagai?", opsi: ["Broadcast", "Multicast", "Loopback", "Gateway"], jawaban: 2 },
        { id: 20, pertanyaan: "Model referensi jaringan yang terdiri dari 7 lapisan disebut?", opsi: ["TCP/IP Model", "OSI Model", "IEEE 802", "Ethernet Model"], jawaban: 1 },
        { id: 21, pertanyaan: "Perangkat yang mengubah sinyal digital menjadi sinyal analog untuk transmisi melalui telepon disebut?", opsi: ["Switch", "Router", "Modem", "Access Point"], jawaban: 2 },
        { id: 22, pertanyaan: "Protokol TCP berbeda dengan UDP karena TCP bersifat?", opsi: ["Connectionless", "Connection-oriented", "Unreliable", "Tidak ada konfirmasi"], jawaban: 1 },
        { id: 23, pertanyaan: "DHCP berfungsi untuk?", opsi: ["Mengamankan jaringan", "Memberikan IP otomatis ke client", "Mentranslasi domain", "Mengirim email"], jawaban: 1 },
        { id: 24, pertanyaan: "Standar wireless LAN yang paling umum digunakan saat ini adalah?", opsi: ["IEEE 802.3", "IEEE 802.11", "IEEE 802.5", "IEEE 802.15"], jawaban: 1 },
        { id: 25, pertanyaan: "Jumlah host yang tersedia pada subnet /24 (255.255.255.0) adalah?", opsi: ["254", "256", "255", "512"], jawaban: 0 },
        { id: 26, pertanyaan: "Lapisan OSI yang menangani enkripsi dan format data adalah?", opsi: ["Session Layer", "Transport Layer", "Presentation Layer", "Application Layer"], jawaban: 2 },
        { id: 27, pertanyaan: "Protokol ping menggunakan protokol apa di bawahnya?", opsi: ["TCP", "UDP", "ICMP", "ARP"], jawaban: 2 },
        { id: 28, pertanyaan: "MAC Address terdiri dari berapa bit?", opsi: ["32 bit", "48 bit", "64 bit", "128 bit"], jawaban: 1 },
        { id: 29, pertanyaan: "Repeater berfungsi untuk?", opsi: ["Menghubungkan jaringan berbeda", "Memperkuat sinyal", "Memberikan IP", "Mengamankan data"], jawaban: 1 },
        { id: 30, pertanyaan: "Kabel UTP kategori yang umum digunakan untuk jaringan Gigabit adalah?", opsi: ["Cat3", "Cat5", "Cat5e/Cat6", "Cat1"], jawaban: 2 },
        { id: 31, pertanyaan: "Alamat broadcast untuk jaringan 192.168.1.0/24 adalah?", opsi: ["192.168.1.0", "192.168.1.1", "192.168.1.254", "192.168.1.255"], jawaban: 3 },
        { id: 32, pertanyaan: "WAN kepanjangan dari?", opsi: ["Wide Area Network", "Wireless Access Network", "Web Area Network", "Wide Access Node"], jawaban: 0 },
        { id: 33, pertanyaan: "Protokol yang digunakan untuk konfigurasi perangkat jaringan dari jarak jauh secara terenkripsi adalah?", opsi: ["Telnet", "SSH", "FTP", "HTTP"], jawaban: 1 },
        { id: 34, pertanyaan: "Access Point berfungsi untuk?", opsi: ["Memperkuat sinyal LAN", "Menghubungkan perangkat wireless ke jaringan kabel", "Memberikan IP address", "Firewall"], jawaban: 1 },
        { id: 35, pertanyaan: "Protokol ARP digunakan untuk?", opsi: ["Mengetahui MAC address dari IP address yang diketahui", "Mengamankan koneksi", "Transfer data", "Resolusi domain"], jawaban: 0 },
        { id: 36, pertanyaan: "Pada model TCP/IP, lapisan yang setara dengan Application, Presentation, Session pada OSI adalah?", opsi: ["Network Access", "Internet", "Transport", "Application"], jawaban: 3 },
        { id: 37, pertanyaan: "Port HTTPS secara default menggunakan port nomor?", opsi: ["80", "8080", "443", "8443"], jawaban: 2 },
        { id: 38, pertanyaan: "Jenis topologi yang digunakan oleh Ethernet modern (switch-based) secara logis adalah?", opsi: ["Bus", "Ring", "Star", "Mesh"], jawaban: 2 },
        { id: 39, pertanyaan: "Sebuah IP address 10.0.0.1 termasuk kelas?", opsi: ["Kelas A", "Kelas B", "Kelas C", "Kelas D"], jawaban: 0 },
        { id: 40, pertanyaan: "NAT (Network Address Translation) berfungsi untuk?", opsi: ["Mentranslasi nama domain", "Mengubah IP private ke IP public", "Mengamankan email", "Memperkuat sinyal"], jawaban: 1 }
    ],

    soalEssay: [
        { id: 41, pertanyaan: "Jelaskan perbedaan antara topologi Bus, Star, dan Ring! Sebutkan kelebihan dan kekurangan masing-masing topologi tersebut!" },
        { id: 42, pertanyaan: "Apa yang dimaksud dengan subnetting? Jelaskan cara menghitung jumlah subnet dan host yang tersedia dari sebuah jaringan 192.168.10.0/26!" },
        { id: 43, pertanyaan: "Jelaskan perbedaan antara protokol TCP dan UDP! Berikan contoh aplikasi yang menggunakan masing-masing protokol tersebut!" },
        { id: 44, pertanyaan: "Apa fungsi dari firewall dalam jaringan komputer? Jelaskan jenis-jenis firewall yang Anda ketahui!" },
        { id: 45, pertanyaan: "Jelaskan cara kerja DHCP dalam jaringan! Apa yang terjadi jika server DHCP tidak tersedia? Bagaimana solusinya?" }
    ]
};
