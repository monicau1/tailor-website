// controllers/alamatController.js
const { AlamatPelanggan } = require("../models");

exports.listAlamat = async (req, res) => {
  try {
    const daftarAlamat = await AlamatPelanggan.findAll({
      where: { id_pelanggan: req.session.userId },
    });

    res.render("pages/alamat/index", {
      title: "Daftar Alamat",
      daftarAlamat,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memuat daftar alamat");
    res.redirect("/akun");
  }
};

exports.showTambahAlamat = (req, res) => {
  res.render("pages/alamat/tambah", {
    title: "Tambah Alamat Baru",
  });
};

exports.processTambahAlamat = async (req, res) => {
  try {
    const { alamat_jalan, kecamatan, provinsi, kode_pos } = req.body;

    // Validasi input
    if (!alamat_jalan || !kecamatan || !provinsi || !kode_pos) {
      req.flash("error", "Semua field harus diisi");
      return res.redirect("/alamat/tambah");
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
    res.redirect("/alamat");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menambahkan alamat");
    res.redirect("/alamat/tambah");
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
      return res.redirect("/alamat");
    }

    await alamat.destroy();
    req.flash("success", "Alamat berhasil dihapus");
    res.redirect("/alamat");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menghapus alamat");
    res.redirect("/alamat");
  }
};
