// routes/layanan/permakRoutes.js
const express = require("express");
const router = express.Router();
const permakController = require("../../controllers/layanan/permakController");
const { uploadMiddleware } = require("../../middlewares/uploadMiddleware");

// Basic routes
router.get("/", permakController.index);
router.get("/kategori/:id", permakController.detailKategori);
router.get("/jenis/:id", permakController.detailJenisPermak);
router.get("/search", permakController.search);

// Handle file upload and form submission
router.post("/add-to-cart/:id", uploadMiddleware, permakController.addToCart);

module.exports = router;
