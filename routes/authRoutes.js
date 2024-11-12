// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { Pelanggan } = require("../models"); // Import model Pelanggan

// Route untuk halaman login & register
router.get("/login", authController.loginPage); // Aktifkan kembali
router.get("/register", authController.registerPage);

// Route untuk handle form submission
router.post("/login", authController.login);
router.post("/register", authController.register);

// Route untuk logout
router.get("/logout", authController.logout);

// Route test (temporary) - letakkan di bawah route utama
router.get("/test-login", async (req, res) => {
  try {
    const pelanggan = await Pelanggan.findOne({
      where: { email_pelanggan: "test@example.com" },
    });
    res.json({
      found: !!pelanggan,
      pelanggan: pelanggan
        ? {
            id: pelanggan.id_pelanggan,
            email: pelanggan.email_pelanggan,
            password: pelanggan.password_pelanggan.substring(0, 10) + "...",
          }
        : null,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

module.exports = router;
