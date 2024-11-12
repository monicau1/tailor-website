// controllers/authController.js
const { Pelanggan } = require("../models"); // Import model
const bcrypt = require("bcrypt");

// Tampilkan halaman login
exports.loginPage = (req, res) => {
  res.render("pages/auth/login", {
    title: "Login",
  });
};

// Tampilkan halaman register
exports.registerPage = (req, res) => {
  res.render("pages/auth/register", {
    title: "Register",
  });
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with:", { email });

    // Validasi input
    if (!email || !password) {
      req.flash("error", "Email dan password harus diisi");
      return res.redirect("/auth/login");
    }

    // Cari pelanggan berdasarkan email
    const pelanggan = await Pelanggan.findOne({
      where: { email_pelanggan: email },
    });
    console.log("Found customer:", pelanggan ? "Yes" : "No"); // Jangan log full object untuk keamanan

    // Jika pelanggan tidak ditemukan
    if (!pelanggan) {
      req.flash("error", "Email atau password salah");
      return res.redirect("/auth/login");
    }

    // Verifikasi password
    console.log("Verifying password...");
    const validPassword = await bcrypt.compare(
      password,
      pelanggan.password_pelanggan
    );
    console.log("Password valid:", validPassword);

    if (!validPassword) {
      req.flash("error", "Email atau password salah");
      return res.redirect("/auth/login");
    }

    // Set session
    req.session.userId = pelanggan.id_pelanggan;
    req.session.userEmail = pelanggan.email_pelanggan;
    req.session.userName = pelanggan.nama_pelanggan;

    // Log session (hanya non-sensitive data)
    console.log("Session set:", {
      userId: req.session.userId,
      userEmail: req.session.userEmail,
    });

    req.flash("success", "Login berhasil");

    // Redirect ke halaman sebelumnya jika ada
    const redirectTo = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (error) {
    console.error("Login error detail:", error);
    req.flash("error", "Terjadi kesalahan saat login");
    res.redirect("/auth/login");
  }
};

// Handle register
exports.register = async (req, res) => {
  try {
    const { nama, email, password, nomor_telepon } = req.body;

    // Validasi input
    if (!nama || !email || !password || !nomor_telepon) {
      req.flash("error", "Semua field harus diisi");
      return res.redirect("/auth/register");
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash("error", "Format email tidak valid");
      return res.redirect("/auth/register");
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await Pelanggan.findOne({
      where: { email_pelanggan: email },
    });

    if (existingUser) {
      req.flash("error", "Email sudah terdaftar");
      return res.redirect("/auth/register");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat pelanggan baru
    await Pelanggan.create({
      nama_pelanggan: nama,
      email_pelanggan: email,
      password_pelanggan: hashedPassword,
      nomor_telepon_pelanggan: nomor_telepon,
      tanggal_registrasi_pelanggan: new Date(),
    });

    req.flash("success", "Registrasi berhasil, silakan login");
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Register error:", error);
    req.flash("error", "Terjadi kesalahan saat registrasi");
    res.redirect("/auth/register");
  }
};

// Handle logout
exports.logout = (req, res) => {
  try {
    // Hapus session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        req.flash("error", "Terjadi kesalahan saat logout");
        return res.redirect("/");
      }
      res.redirect("/auth/login");
    });
  } catch (error) {
    console.error("Logout error:", error);
    req.flash("error", "Terjadi kesalahan saat logout");
    res.redirect("/");
  }
};
