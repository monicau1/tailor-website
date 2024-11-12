// app.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const sequelize = require("./utils/db.js");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

require("dotenv").config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// Session middleware
app.use(
  session({
    secret: "rahasia",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set true jika menggunakan HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
    },
  })
);

// Flash middleware
app.use(flash());

// View engine setup
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout");

// Static files setup
app.use(express.static(path.join(__dirname, "public")));

// Set default locals
app.use((req, res, next) => {
  res.locals.title = "Toko Jahit";
  res.locals.messages = req.flash();
  res.locals.path = req.originalUrl;
  res.locals.style = "";
  res.locals.script = "";
  next();
});

// EJS configuration
app.locals.extractScripts = true;
app.locals.extractStyles = true;

// Import routes dan middleware
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middlewares/authMiddleware");
const permakRoutes = require("./routes/layanan/permakRoutes");
const pakaianRoutes = require("./routes/layanan/pakaianRoutes");
const keranjangRoutes = require("./routes/keranjangRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const alamatRoutes = require("./routes/alamatRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Authentication middleware
app.use(authMiddleware.setLocals);

// Route setup
app.use("/auth", authRoutes);
app.use("/permak", permakRoutes);
app.use("/pakaian", pakaianRoutes);
app.use("/cart", authMiddleware.isAuthenticated, keranjangRoutes);
app.use("/checkout", authMiddleware.isAuthenticated, checkoutRoutes);
app.use("/alamat", authMiddleware.isAuthenticated, alamatRoutes);
app.use("/orders", authMiddleware.isAuthenticated, orderRoutes);

// Home route
app.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Home - Toko Jahit",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("pages/404", {
    layout: "layouts/layout",
    title: "Page Not Found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (req.xhr || req.headers.accept.includes("application/json")) {
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }

  res.status(500).render("pages/error", {
    layout: "layouts/layout",
    title: "Error",
    path: req.originalUrl,
    message: "Terjadi kesalahan pada server!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Database synchronization
sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Error synchronizing database:", err);
  });

// Start server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    sequelize.close();
  });
});

module.exports = app;
