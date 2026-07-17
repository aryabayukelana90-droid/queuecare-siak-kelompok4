const express = require("express");
const router = express.Router();

const pasienController = require("../controllers/pasienController");

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

router.get("/dashboard", requireLogin, pasienController.dashboard);
router.post("/ambil-antrean", requireLogin, pasienController.ambilAntrean);
router.post("/batalkan-antrean/:id", requireLogin, pasienController.batalkanAntrean);

router.get("/profil", requireLogin, pasienController.showProfil);
router.post("/profil", requireLogin, pasienController.updateProfil);

module.exports = router;
