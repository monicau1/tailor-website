// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directory if it doesn't exist
const uploadDir = "public/uploads/permak";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "permak-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Hanya file JPG dan PNG yang diperbolehkan"), false);
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

// Middleware wrapper
const uploadMiddleware = (req, res, next) => {
  upload.single("gambar_permak")(req, res, function (err) {
    // Debug log
    console.log("Upload middleware executed");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        req.flash("error", "File terlalu besar. Maksimal 2MB");
      } else {
        req.flash("error", `Error upload: ${err.message}`);
      }
      return res.redirect("back");
    }

    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }

    if (!req.file) {
      req.flash("error", "Foto pakaian harus diupload");
      return res.redirect("back");
    }

    next();
  });
};

module.exports = {
  uploadMiddleware,
};
