// routes/keranjangRoutes.js
const express = require("express");
const router = express.Router();
const keranjangController = require("../controllers/keranjangController");

// Tampilkan keranjang
router.get("/", keranjangController.index);

// Hapus item dari keranjang
router.delete("/delete/:id", keranjangController.deleteItem);

module.exports = router;
