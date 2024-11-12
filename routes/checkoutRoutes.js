// routes/checkoutRoutes.js
const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { isAuthenticated } = require("../middlewares/authMiddleware");

// Routes untuk checkout permak
router.get("/permak", isAuthenticated, checkoutController.showPermakCheckout);
router.post(
  "/permak",
  isAuthenticated,
  checkoutController.processPermakCheckout
);

// Halaman konfirmasi setelah checkout berhasil
router.get(
  "/success/:orderId",
  isAuthenticated,
  checkoutController.showSuccess
);

module.exports = router;
