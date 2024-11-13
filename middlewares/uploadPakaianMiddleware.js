// middlewares/uploadPakaianMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Buat direktori upload jika belum ada
const uploadDir = "public/uploads/pakaian";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi storage multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "pakaian-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter file
const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Hanya file JPG dan PNG yang diperbolehkan"), false);
  }

  cb(null, true);
};

// Buat instance multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 5, // Maksimal 5 file
  },
});

// Middleware untuk single upload
exports.uploadSingle = (req, res, next) => {
  upload.single("gambar")(req, res, function (err) {
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

    next();
  });
};

// Middleware untuk multiple upload
exports.uploadMultiple = (req, res, next) => {
  upload.array("gambar", 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        req.flash("error", "File terlalu besar. Maksimal 2MB");
      } else if (err.code === "LIMIT_FILE_COUNT") {
        req.flash("error", "Maksimal 5 gambar");
      } else {
        req.flash("error", `Error upload: ${err.message}`);
      }
      return res.redirect("back");
    }

    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }

    next();
  });
};
