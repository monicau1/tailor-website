// routes/layanan/pakaianRoutes.js
const express = require("express");
const router = express.Router();
const pakaianController = require("../../controllers/layanan/pakaianController");

// Halaman index kategori pakaian
router.get("/", pakaianController.index);

// Detail kategori pakaian
router.get("/kategori/:id", pakaianController.detailKategori);

// Detail pakaian
router.get("/detail/:id", pakaianController.detailPakaian);

// Tambah ke keranjang
router.post("/add-to-cart/:id", pakaianController.addToCart);

// Search
router.get("/search", pakaianController.search);

router.get("/check-stock/:id", pakaianController.checkStock);

module.exports = router;
