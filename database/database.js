const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "../queuecare.db"));
db.exec("PRAGMA foreign_keys = ON");

// Tabel Users
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'pasien'
    )
`);

// Tabel Antrian
db.exec(`
    CREATE TABLE IF NOT EXISTS antrian (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nomor_antrean TEXT,
        tanggal TEXT,
        status TEXT DEFAULT 'Menunggu',
        kategori TEXT DEFAULT 'umum',
        poli TEXT DEFAULT 'umum',
        user_id INTEGER,
        dibuat_at TEXT,
        selesai_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

// Migrasi lunak: tambahkan kolom-kolom baru kalau database lama belum punya
const kolomBaru = [
    "ALTER TABLE antrian ADD COLUMN kategori TEXT DEFAULT 'umum'",
    "ALTER TABLE antrian ADD COLUMN poli TEXT DEFAULT 'umum'",
    "ALTER TABLE antrian ADD COLUMN dibuat_at TEXT",
    "ALTER TABLE antrian ADD COLUMN selesai_at TEXT"
];
for (const sql of kolomBaru) {
    try {
        db.exec(sql);
    } catch (e) {
        // Kolom sudah ada, aman diabaikan
    }
}

// Isi dibuat_at untuk baris lama yang masih kosong, supaya urutan riwayat tetap rapi
try {
    db.exec(`UPDATE antrian SET dibuat_at = datetime('now', 'localtime') WHERE dibuat_at IS NULL`);
} catch (e) {}

// Daftar poli/layanan yang tersedia di klinik
const DAFTAR_POLI = {
    umum: { label: "Poli Umum", kode: "UM" },
    gigi: { label: "Poli Gigi", kode: "GI" },
    anak: { label: "Poli Anak", kode: "AN" },
    kia: { label: "Poli KIA (Ibu & Anak)", kode: "KA" }
};
db.DAFTAR_POLI = DAFTAR_POLI;

// Seed akun admin default untuk demo, kalau belum ada
const adminAda = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminAda) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare(
        "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)"
    ).run("Admin Klinik", "admin@queuecare.com", hash, "admin");
    console.log("Akun admin default dibuat: admin@queuecare.com / admin123");
}

console.log("Database SQLite (bawaan Node.js) berhasil terhubung & tabel siap.");

module.exports = db;
