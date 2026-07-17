const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

function requireAdmin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "admin") return res.redirect("/dashboard");
    next();
}

router.get("/admin", requireAdmin, adminController.dashboard);
router.post("/admin/panggil/:id", requireAdmin, adminController.panggil);
router.post("/admin/selesai/:id", requireAdmin, adminController.selesai);
router.post("/admin/lewati/:id", requireAdmin, adminController.lewati);
router.post("/admin/reset", requireAdmin, adminController.resetAntrian);

router.get("/admin/riwayat", requireAdmin, adminController.riwayat);
router.get("/admin/riwayat/export", requireAdmin, adminController.exportRiwayatCSV);

module.exports = router;
