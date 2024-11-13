// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { isAuthenticated } = require("../middlewares/authMiddleware");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");

// Halaman profil
router.get("/", isAuthenticated, profileController.showProfile);

// Update profil
router.post("/update", isAuthenticated, profileController.updateProfile);

// Update password
router.post(
  "/update-password",
  isAuthenticated,
  profileController.updatePassword
);

// Alamat routes
router.get(
  "/alamat/tambah",
  isAuthenticated,
  profileController.showTambahAlamat
);
router.post(
  "/alamat/tambah",
  isAuthenticated,
  profileController.processTambahAlamat
);
router.get(
  "/alamat/edit/:id",
  isAuthenticated,
  profileController.showEditAlamat
);
router.post(
  "/alamat/edit/:id",
  isAuthenticated,
  profileController.processEditAlamat
);
router.delete(
  "/alamat/hapus/:id",
  isAuthenticated,
  profileController.hapusAlamat
);

module.exports = router;
