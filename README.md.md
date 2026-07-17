# 🌸 QueueCare — Sistem Antrian Klinik Berbasis Web

Tugas Mata Kuliah **Rekayasa Perangkat Lunak** — Kelompok 4

Website sistem antrian klinik dengan tema **pink sakura**. Dibangun dengan Node.js, Express, EJS, dan SQLite bawaan Node.js (`node:sqlite`) — **tidak ada modul native yang perlu di-compile**, jadi `npm install` dijamin lancar di komputer manapun (Windows/Mac/Linux) tanpa perlu install Visual Studio/build tools.

---

## 👥 Anggota Kelompok 4

| Nama                   | NIM       |
|------------------------|-----------|
| Arya Bayu Kelana       | 240511055 |
| Valent Ichsanul Fitri  | 240511105 |
| Najwa Pinasti          | 240511153 |
| Fajrur Robi Sya'bani   | 240511202 |
| Dika Arya Saputra      | 240511005 |

---

## ✨ Fitur

**Untuk Pasien**
- Landing page dengan hero section & dekorasi dahan sakura
- Register & Login (password di-hash dengan bcryptjs)
- Ambil nomor antrean online dengan kategori Umum / Prioritas (lansia & darurat)
- Multi poli/layanan: Poli Umum, Poli Gigi, Poli Anak, Poli KIA — masing-masing punya penomoran antrean sendiri
- Estimasi waktu tunggu otomatis berdasarkan posisi antrian di poli yang sama
- Dashboard dengan status real-time (auto-refresh)
- Batalkan antrean sendiri selama masih berstatus Menunggu
- Riwayat kunjungan (selesai / dilewati / dibatalkan)
- Notifikasi otomatis (bunyi chime + browser notification) saat nomor dipanggil
- Edit profil (ubah nama & ganti password)

**Untuk Admin / Petugas**
- Dashboard untuk memanggil, menandai selesai, atau melewati nomor antrian — dengan filter per poli
- Statistik lengkap: jumlah menunggu, dipanggil, selesai, dilewati/dibatalkan hari ini, serta breakdown per poli
- Riwayat & Export CSV dengan filter tanggal/status/poli

**Umum**
- Papan Antrian Publik (`/display`, tanpa login) untuk layar TV ruang tunggu — update otomatis + animasi & bunyi saat ada panggilan baru
- Animasi kelopak sakura berjatuhan di seluruh halaman 🌸

---

## 🚀 Cara Menjalankan

1. Pastikan **Node.js versi 22 ke atas** sudah terinstall (cek dengan `node --version`)
2. Buka folder proyek ini di terminal, lalu install dependencies:
   ```bash
   npm install
   ```
   *(Cuma butuh beberapa detik — semua dependency pure JavaScript, tidak ada yang perlu di-compile)*
3. Jalankan server:
   ```bash
   npm start
   ```
   Atau bisa juga langsung:
   ```bash
   node app.js
   ```
4. Buka browser ke [http://localhost:3000](http://localhost:3000)

> Database SQLite (`queuecare.db`) akan otomatis dibuat saat pertama kali dijalankan, lengkap dengan tabel dan 1 akun admin default. Kalau muncul warning `ExperimentalWarning: SQLite is an experimental feature`, itu normal dan aman diabaikan — bukan error.

---

## 🔑 Akun Demo

| Role   | Email                | Password |
|--------|-----------------------|----------|
| Admin  | admin@queuecare.com   | admin123 |
| Pasien | *daftar sendiri lewat halaman Register* | — |

---

## 📁 Struktur Folder

```
├── app.js                     # Entry point & routing utama
├── database/
│   └── database.js            # Koneksi SQLite, buat tabel, seed admin, daftar poli
├── controllers/
│   ├── authController.js      # Register, login, logout
│   ├── pasienController.js    # Dashboard, ambil/batalkan antrean, riwayat, profil pasien
│   ├── adminController.js     # Dashboard admin, panggil/selesai/lewati, statistik, riwayat, export CSV
│   └── displayController.js   # Papan antrian publik (TV ruang tunggu)
├── routes/
│   ├── auth.js
│   ├── pasien.js
│   ├── admin.js
│   └── display.js
├── views/                     # Template EJS
│   ├── partials/
│   │   ├── head.ejs           # Meta, font, CSS bersama
│   │   └── petals.ejs         # Animasi kelopak sakura
│   ├── index.ejs              # Landing page
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard-pasien.ejs
│   ├── dashboard-admin.ejs
│   ├── admin-riwayat.ejs      # Riwayat & filter (admin)
│   ├── profil.ejs             # Edit profil pasien
│   └── display.ejs            # Papan antrian publik
└── public/
    ├── css/style.css          # Tema pink sakura
    ├── js/sakura.js           # Script animasi kelopak
    └── img/                   # Ikon & ilustrasi sakura (SVG asli)
```

---

## 📝 Catatan untuk Laporan Tugas RPL

- **Kategori prioritas**: pasien lansia/darurat otomatis didahulukan dalam antrian, sesuai hasil studi kasus yang ditemukan di berbagai puskesmas.
- **Estimasi waktu tunggu**: dihitung dari jumlah pasien di depan (di poli yang sama) × rata-rata waktu layanan (asumsi 10 menit/pasien, bisa disesuaikan di `controllers/pasienController.js`).
- **Multi poli**: setiap poli (Umum/Gigi/Anak/KIA) memiliki penomoran antrean & jalur estimasi terpisah, mendekati alur kerja klinik nyata yang punya beberapa ruang periksa sekaligus. Daftar poli bisa ditambah/diubah di `database/database.js` (objek `DAFTAR_POLI`).
- **Papan Antrian Publik** (`/display`) cocok dibuka di layar/TV ruang tunggu — tidak perlu login, update otomatis tiap 4 detik lewat polling AJAX ke `/display/data`, disertai animasi flash & bunyi chime saat ada nomor baru dipanggil.
- **Riwayat & Export CSV** di admin (`/admin/riwayat`) berguna untuk laporan rekap harian/bulanan pelayanan klinik.
- Untuk demo/presentasi, buka 3 tab browser berbeda: satu sebagai pasien, satu login sebagai admin, dan satu lagi ke `/display` sebagai papan antrian — supaya alur ambil nomor → dipanggil → selesai bisa didemokan secara langsung dan terlihat di ketiga layar.
