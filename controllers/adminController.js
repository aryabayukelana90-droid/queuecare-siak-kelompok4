const db = require("../database/database");

const DAFTAR_POLI = db.DAFTAR_POLI;

// Menampilkan dashboard admin: daftar antrian aktif + statistik hari ini
exports.dashboard = (req, res) => {

    const poliFilter = DAFTAR_POLI[req.query.poli] ? req.query.poli : null;

    let query = `
        SELECT
            antrian.id,
            antrian.nomor_antrean,
            antrian.status,
            antrian.kategori,
            antrian.poli,
            antrian.tanggal,
            antrian.dibuat_at,
            users.nama
        FROM antrian
        JOIN users ON users.id = antrian.user_id
        WHERE antrian.status IN ('Menunggu', 'Dipanggil')`;

    const params = [];
    if (poliFilter) {
        query += ` AND antrian.poli = ?`;
        params.push(poliFilter);
    }
    query += ` ORDER BY (antrian.status = 'Dipanggil') DESC, (antrian.kategori = 'prioritas') DESC, antrian.id ASC`;

    const data = db.prepare(query).all(...params);

    const hariIni = new Date().toLocaleDateString("id-ID");

    const stat = db.prepare(
        `SELECT COUNT(*) AS total FROM antrian WHERE status = 'Selesai' AND tanggal = ?`
    ).get(hariIni);

    const statLengkap = db.prepare(
        `SELECT
            SUM(CASE WHEN status = 'Menunggu' THEN 1 ELSE 0 END) AS menunggu,
            SUM(CASE WHEN status = 'Dipanggil' THEN 1 ELSE 0 END) AS dipanggil,
            SUM(CASE WHEN status = 'Selesai' AND tanggal = ? THEN 1 ELSE 0 END) AS selesai,
            SUM(CASE WHEN status = 'Dilewati' AND tanggal = ? THEN 1 ELSE 0 END) AS dilewati,
            SUM(CASE WHEN status = 'Dibatalkan' AND tanggal = ? THEN 1 ELSE 0 END) AS dibatalkan,
            SUM(CASE WHEN kategori = 'prioritas' AND tanggal = ? THEN 1 ELSE 0 END) AS totalPrioritas,
            SUM(CASE WHEN kategori = 'umum' AND tanggal = ? THEN 1 ELSE 0 END) AS totalUmum
         FROM antrian`
    ).get(hariIni, hariIni, hariIni, hariIni, hariIni);

    const perPoli = db.prepare(
        `SELECT poli,
            SUM(CASE WHEN status IN ('Menunggu','Dipanggil') THEN 1 ELSE 0 END) AS aktif,
            SUM(CASE WHEN status = 'Selesai' AND tanggal = ? THEN 1 ELSE 0 END) AS selesaiHariIni
         FROM antrian GROUP BY poli`
    ).all(hariIni);

    res.render("dashboard-admin", {
        user: req.session.user,
        data,
        totalSelesai: stat.total,
        statLengkap,
        perPoli,
        daftarPoli: DAFTAR_POLI,
        poliFilter
    });
};

// Memanggil nomor antrian tertentu
exports.panggil = (req, res) => {
    db.prepare("UPDATE antrian SET status = 'Dipanggil' WHERE id = ?").run(req.params.id);
    res.redirect(req.get("Referer") || "/admin");
};

// Menandai antrian selesai dilayani
exports.selesai = (req, res) => {
    db.prepare(
        "UPDATE antrian SET status = 'Selesai', selesai_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(req.params.id);
    res.redirect(req.get("Referer") || "/admin");
};

// Melewati / skip nomor antrian
exports.lewati = (req, res) => {
    db.prepare(
        "UPDATE antrian SET status = 'Dilewati', selesai_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(req.params.id);
    res.redirect(req.get("Referer") || "/admin");
};

// Reset semua data antrian (nomor antrean kembali mulai dari 001)
// Akun pengguna tidak dihapus, hanya riwayat antrian.
exports.resetAntrian = (req, res) => {
    db.exec("DELETE FROM antrian");
    res.redirect("/admin");
};

// Halaman riwayat lengkap untuk admin, dengan filter tanggal / status / poli
exports.riwayat = (req, res) => {
    const { tanggal, status, poli } = req.query;

    let query = `
        SELECT antrian.*, users.nama
        FROM antrian
        JOIN users ON users.id = antrian.user_id
        WHERE 1=1`;
    const params = [];

    if (tanggal) {
        query += ` AND antrian.tanggal = ?`;
        params.push(new Date(tanggal).toLocaleDateString("id-ID"));
    }
    if (status) {
        query += ` AND antrian.status = ?`;
        params.push(status);
    }
    if (poli && DAFTAR_POLI[poli]) {
        query += ` AND antrian.poli = ?`;
        params.push(poli);
    }

    query += ` ORDER BY antrian.id DESC LIMIT 200`;

    const data = db.prepare(query).all(...params);

    res.render("admin-riwayat", {
        user: req.session.user,
        data,
        daftarPoli: DAFTAR_POLI,
        filter: { tanggal: tanggal || "", status: status || "", poli: poli || "" }
    });
};

// Export riwayat (sesuai filter yang sama dengan halaman riwayat) ke CSV
exports.exportRiwayatCSV = (req, res) => {
    const { tanggal, status, poli } = req.query;

    let query = `
        SELECT antrian.nomor_antrean, antrian.tanggal, antrian.status, antrian.kategori,
               antrian.poli, antrian.dibuat_at, antrian.selesai_at, users.nama, users.email
        FROM antrian
        JOIN users ON users.id = antrian.user_id
        WHERE 1=1`;
    const params = [];

    if (tanggal) {
        query += ` AND antrian.tanggal = ?`;
        params.push(new Date(tanggal).toLocaleDateString("id-ID"));
    }
    if (status) {
        query += ` AND antrian.status = ?`;
        params.push(status);
    }
    if (poli && DAFTAR_POLI[poli]) {
        query += ` AND antrian.poli = ?`;
        params.push(poli);
    }

    query += ` ORDER BY antrian.id DESC`;

    const data = db.prepare(query).all(...params);

    const header = "Nomor Antrean,Tanggal,Status,Kategori,Poli,Nama Pasien,Email,Dibuat,Selesai\n";
    const rows = data.map(r => [
        r.nomor_antrean, r.tanggal, r.status, r.kategori,
        DAFTAR_POLI[r.poli] ? DAFTAR_POLI[r.poli].label : r.poli,
        `"${(r.nama || "").replace(/"/g, '""')}"`,
        r.email, r.dibuat_at || "", r.selesai_at || ""
    ].join(",")).join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="riwayat-antrean-${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM agar Excel membaca UTF-8 dengan benar
};
