// controllers/profileController.js
const { Pelanggan, AlamatPelanggan } = require("../models");
const bcrypt = require("bcrypt");

exports.showProfile = async (req, res) => {
  try {
    // Ambil data pelanggan
    const pelanggan = await Pelanggan.findByPk(req.session.userId);

    if (!pelanggan) {
      req.flash("error", "Pelanggan tidak ditemukan");
      return res.redirect("/");
    }

    // Ambil daftar alamat
    const daftarAlamat = await AlamatPelanggan.findAll({
      where: { id_pelanggan: req.session.userId },
      order: [["id_alamat_pelanggan", "DESC"]],
    });

    res.render("pages/profile/index", {
      title: "Profil Saya",
      pelanggan,
      daftarAlamat,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat profil");
    res.redirect("/");
  }
};

// Methods untuk manajemen alamat
exports.showTambahAlamat = (req, res) => {
  try {
    res.render("pages/profile/tambah-alamat", {
      title: "Tambah Alamat Baru",
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat halaman");
    res.redirect("/profile");
  }
};

exports.processTambahAlamat = async (req, res) => {
  try {
    const { alamat_jalan, kecamatan, provinsi, kode_pos } = req.body;

    // Validasi input sederhana
    if (!alamat_jalan || !kecamatan || !provinsi || !kode_pos) {
      req.flash("error", "Semua field harus diisi");
      return res.redirect("/profile/alamat/tambah");
    }

    // Buat alamat baru
    await AlamatPelanggan.create({
      id_pelanggan: req.session.userId,
      alamat_jalan,
      kecamatan,
      provinsi,
      kode_pos,
      negara: "Indonesia", // default value
    });

    req.flash("success", "Alamat berhasil ditambahkan");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menambahkan alamat");
    res.redirect("/profile/alamat/tambah");
  }
};

exports.showEditAlamat = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari alamat dan pastikan kepemilikan
    const alamat = await AlamatPelanggan.findOne({
      where: {
        id_alamat_pelanggan: id,
        id_pelanggan: req.session.userId,
      },
    });

    if (!alamat) {
      req.flash("error", "Alamat tidak ditemukan");
      return res.redirect("/profile");
    }

    res.render("pages/profile/edit-alamat", {
      title: "Edit Alamat",
      alamat,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat halaman");
    res.redirect("/profile");
  }
};

exports.processEditAlamat = async (req, res) => {
  try {
    const { id } = req.params;
    const { alamat_jalan, kecamatan, provinsi, kode_pos } = req.body;

    // Validasi input
    if (!alamat_jalan || !kecamatan || !provinsi || !kode_pos) {
      req.flash("error", "Semua field harus diisi");
      return res.redirect(`/profile/alamat/edit/${id}`);
    }

    // Cari dan update alamat
    const alamat = await AlamatPelanggan.findOne({
      where: {
        id_alamat_pelanggan: id,
        id_pelanggan: req.session.userId,
      },
    });

    if (!alamat) {
      req.flash("error", "Alamat tidak ditemukan");
      return res.redirect("/profile");
    }

    await alamat.update({
      alamat_jalan,
      kecamatan,
      provinsi,
      kode_pos,
    });

    req.flash("success", "Alamat berhasil diperbarui");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memperbarui alamat");
    res.redirect("/profile");
  }
};

exports.hapusAlamat = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifikasi kepemilikan alamat
    const alamat = await AlamatPelanggan.findOne({
      where: {
        id_alamat_pelanggan: id,
        id_pelanggan: req.session.userId,
      },
    });

    if (!alamat) {
      req.flash("error", "Alamat tidak ditemukan");
      return res.redirect("/profile");
    }

    await alamat.destroy();
    req.flash("success", "Alamat berhasil dihapus");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menghapus alamat");
    res.redirect("/profile");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nama_pelanggan, email_pelanggan, nomor_telepon_pelanggan } =
      req.body;

    const pelanggan = await Pelanggan.findByPk(req.session.userId);

    if (!pelanggan) {
      req.flash("error", "Pelanggan tidak ditemukan");
      return res.redirect("/profile");
    }

    // Update data pelanggan
    await pelanggan.update({
      nama_pelanggan,
      email_pelanggan,
      nomor_telepon_pelanggan,
    });

    // Update session name jika berubah
    req.session.userName = nama_pelanggan;

    req.flash("success", "Profil berhasil diperbarui");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memperbarui profil");
    res.redirect("/profile");
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    // Validasi password baru
    if (new_password !== confirm_password) {
      req.flash("error", "Konfirmasi password baru tidak sesuai");
      return res.redirect("/profile");
    }

    const pelanggan = await Pelanggan.findByPk(req.session.userId);

    // Validasi password lama
    const validPassword = await bcrypt.compare(
      current_password,
      pelanggan.password_pelanggan
    );
    if (!validPassword) {
      req.flash("error", "Password saat ini tidak sesuai");
      return res.redirect("/profile");
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pelanggan.update({
      password_pelanggan: hashedPassword,
    });

    req.flash("success", "Password berhasil diperbarui");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memperbarui password");
    res.redirect("/profile");
  }
};
