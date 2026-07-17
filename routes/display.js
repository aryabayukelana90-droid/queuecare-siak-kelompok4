const express = require("express");
const router = express.Router();

const displayController = require("../controllers/displayController");

// Halaman publik, sengaja tidak memerlukan login karena akan ditampilkan
// di layar TV ruang tunggu klinik.
router.get("/display", displayController.tampilkan);
router.get("/display/data", displayController.data);

module.exports = router;
