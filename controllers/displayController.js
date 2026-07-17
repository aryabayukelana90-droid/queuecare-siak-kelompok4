const db = require("../database/database");

const DAFTAR_POLI = db.DAFTAR_POLI;

// Ambil data ringkas untuk papan antrian: nomor yang sedang dipanggil
// dan jumlah yang masih menunggu, dikelompokkan per poli.
function ambilDataDisplay() {
    const dipanggil = db.prepare(
        `SELECT antrian.nomor_antrean, antrian.poli, antrian.kategori
         FROM antrian
         WHERE status = 'Dipanggil'
         ORDER BY id ASC`
    ).all();

    const menunggu = db.prepare(
        `SELECT poli, COUNT(*) AS total FROM antrian
         WHERE status = 'Menunggu' GROUP BY poli`
    ).all();

    const poli = Object.keys(DAFTAR_POLI).map(kode => {
        const info = DAFTAR_POLI[kode];
        const sedangDipanggil = dipanggil.filter(d => d.poli === kode);
        const jumlahMenunggu = menunggu.find(m => m.poli === kode);
        return {
            kode,
            label: info.label,
            dipanggil: sedangDipanggil,
            menunggu: jumlahMenunggu ? jumlahMenunggu.total : 0
        };
    });

    return { poli, updatedAt: new Date().toISOString() };
}

// Halaman papan antrian publik (tanpa login), untuk ditampilkan di TV ruang tunggu
exports.tampilkan = (req, res) => {
    const data = ambilDataDisplay();
    res.render("display", { poli: data.poli, daftarPoli: DAFTAR_POLI });
};

// Endpoint JSON untuk polling AJAX dari halaman display agar update mulus tanpa reload
exports.data = (req, res) => {
    res.json(ambilDataDisplay());
};
