// routes/alamatRoutes.js
const express = require("express");
const router = express.Router();
const alamatController = require("../controllers/alamatController");
const { isAuthenticated } = require("../middlewares/authMiddleware");

// Daftar alamat
router.get("/", isAuthenticated, alamatController.listAlamat);

// Form tambah alamat
router.get("/tambah", isAuthenticated, alamatController.showTambahAlamat);

// Proses tambah alamat
router.post("/tambah", isAuthenticated, alamatController.processTambahAlamat);

// Hapus alamat
router.delete("/hapus/:id", isAuthenticated, alamatController.hapusAlamat);

module.exports = router;
