const bcrypt = require("bcryptjs");
const db = require("../database/database");

const RATA_WAKTU_LAYANAN_MENIT = 10; // asumsi rata-rata waktu layanan per pasien
const DAFTAR_POLI = db.DAFTAR_POLI;

// Menampilkan dashboard pasien beserta status & estimasi antrean terkini
exports.dashboard = (req, res) => {

    const userId = req.session.user.id;

    const antrean = db.prepare(
        "SELECT * FROM antrian WHERE user_id = ? ORDER BY id DESC LIMIT 1"
    ).get(userId);

    // Riwayat kunjungan sebelumnya (tidak termasuk antrean aktif yang sedang ditampilkan di atas)
    const riwayat = db.prepare(
        `SELECT * FROM antrian
         WHERE user_id = ? AND status IN ('Selesai', 'Dilewati', 'Dibatalkan')
         ORDER BY id DESC LIMIT 10`
    ).all(userId);

    if (!antrean || antrean.status !== "Menunggu") {
        return res.render("dashboard-pasien", {
            user: req.session.user,
            antrean: antrean || null,
            posisi: null,
            estimasi: null,
            riwayat,
            daftarPoli: DAFTAR_POLI
        });
    }

    // Hitung posisi di dalam poli yang sama: pasien prioritas dianggap lebih dulu
    // dari pasien umum yang datang belakangan pada poli tersebut
    const semua = db.prepare(
        `SELECT id, kategori FROM antrian
         WHERE status = 'Menunggu' AND poli = ?
         ORDER BY (kategori = 'prioritas') DESC, id ASC`
    ).all(antrean.poli || "umum");

    const posisi = semua.findIndex(a => a.id === antrean.id);
    const estimasi = posisi >= 0 ? posisi * RATA_WAKTU_LAYANAN_MENIT : 0;

    res.render("dashboard-pasien", {
        user: req.session.user,
        antrean,
        posisi: posisi >= 0 ? posisi : 0,
        estimasi,
        riwayat,
        daftarPoli: DAFTAR_POLI
    });
};

exports.ambilAntrean = (req, res) => {

    const userId = req.session.user.id;
    const kategori = req.body.kategori === "prioritas" ? "prioritas" : "umum";
    const poli = DAFTAR_POLI[req.body.poli] ? req.body.poli : "umum";

    // Cek apakah user sudah punya antrean yang masih aktif
    const aktif = db.prepare(
        "SELECT * FROM antrian WHERE user_id = ? AND status IN ('Menunggu', 'Dipanggil')"
    ).get(userId);

    if (aktif) {
        return res.redirect("/dashboard");
    }

    // Nomor antrean dihitung terpisah per poli, contoh: UM-001, GI-P002
    const hasil = db.prepare(
        "SELECT COUNT(*) AS total FROM antrian WHERE poli = ?"
    ).get(poli);

    const kodePoli = DAFTAR_POLI[poli].kode;
    const sufiksKategori = kategori === "prioritas" ? "P" : "";
    const nomor = `${kodePoli}${sufiksKategori}${String(hasil.total + 1).padStart(3, "0")}`;
    const tanggal = new Date().toLocaleDateString("id-ID");

    db.prepare(
        `INSERT INTO antrian (nomor_antrean, tanggal, status, kategori, poli, user_id, dibuat_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`
    ).run(nomor, tanggal, "Menunggu", kategori, poli, userId);

    res.redirect("/dashboard");
};

// Pasien membatalkan antrean sendiri selama masih berstatus Menunggu
exports.batalkanAntrean = (req, res) => {
    const userId = req.session.user.id;
    const id = req.params.id;

    const antrean = db.prepare(
        "SELECT * FROM antrian WHERE id = ? AND user_id = ?"
    ).get(id, userId);

    if (antrean && antrean.status === "Menunggu") {
        db.prepare(
            "UPDATE antrian SET status = 'Dibatalkan', selesai_at = datetime('now', 'localtime') WHERE id = ?"
        ).run(id);
    }

    res.redirect("/dashboard");
};

// Menampilkan halaman profil pasien
exports.showProfil = (req, res) => {
    res.render("profil", {
        user: req.session.user,
        error: null,
        sukses: null
    });
};

// Update nama & (opsional) password pasien
exports.updateProfil = async (req, res) => {
    const userId = req.session.user.id;
    const { nama, passwordLama, passwordBaru, konfirmasiPassword } = req.body;

    if (!nama || !nama.trim()) {
        return res.render("profil", { user: req.session.user, error: "Nama tidak boleh kosong.", sukses: null });
    }

    const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    // Jika pasien ingin ganti password, validasi dulu password lama
    if (passwordBaru || passwordLama || konfirmasiPassword) {
        if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
            return res.render("profil", { user: req.session.user, error: "Lengkapi semua kolom password untuk menggantinya.", sukses: null });
        }

        const cocok = await bcrypt.compare(passwordLama, dbUser.password);
        if (!cocok) {
            return res.render("profil", { user: req.session.user, error: "Password lama salah.", sukses: null });
        }

        if (passwordBaru !== konfirmasiPassword) {
            return res.render("profil", { user: req.session.user, error: "Konfirmasi password baru tidak cocok.", sukses: null });
        }

        if (passwordBaru.length < 6) {
            return res.render("profil", { user: req.session.user, error: "Password baru minimal 6 karakter.", sukses: null });
        }

        const hashBaru = await bcrypt.hash(passwordBaru, 10);
        db.prepare("UPDATE users SET nama = ?, password = ? WHERE id = ?").run(nama.trim(), hashBaru, userId);
    } else {
        db.prepare("UPDATE users SET nama = ? WHERE id = ?").run(nama.trim(), userId);
    }

    req.session.user.nama = nama.trim();

    res.render("profil", { user: req.session.user, error: null, sukses: "Profil berhasil diperbarui." });
};
