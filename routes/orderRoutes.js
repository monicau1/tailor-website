// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { isAuthenticated } = require("../middlewares/authMiddleware");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");

// Daftar semua pesanan
router.get("/", isAuthenticated, orderController.listOrders);

// Detail pesanan
router.get("/:id", isAuthenticated, orderController.orderDetail);

// Halaman upload bukti pembayaran
router.get(
  "/:id/upload-payment",
  isAuthenticated,
  orderController.showUploadPayment
);

// Proses upload bukti pembayaran
router.post(
  "/:id/upload-payment",
  isAuthenticated,
  orderController.processUploadPayment
);

module.exports = router;
