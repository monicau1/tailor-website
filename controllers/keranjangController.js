// controllers/keranjangController.js
const {
  ItemKeranjang,
  JenisPermak,
  InstruksiKhusus,
  Keranjang,
  Pakaian,
  VarianPakaian,
} = require("../models");

exports.index = async (req, res) => {
  try {
    // Pastikan user terautentikasi
    if (!req.session.userId) {
      req.flash("error", "Silakan login terlebih dahulu");
      return res.redirect("/auth/login");
    }

    // Dapatkan atau buat keranjang untuk permak
    const [keranjangPermak] = await Keranjang.findOrCreate({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
      defaults: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
    });

    // Dapatkan atau buat keranjang untuk jahit
    const [keranjangJahit] = await Keranjang.findOrCreate({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "jahit",
      },
      defaults: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "jahit",
      },
    });

    // Ambil item untuk keranjang permak
    const itemPermak = await ItemKeranjang.findAll({
      where: {
        id_keranjang: keranjangPermak.id_keranjang,
      },
      include: [
        {
          model: JenisPermak,
          as: "JenisPermak",
          required: false,
        },
        {
          model: InstruksiKhusus,
          as: "InstruksiKhusus",
          required: false,
        },
      ],
    });

    // Ambil item untuk keranjang jahit
    const itemJahit = await ItemKeranjang.findAll({
      where: {
        id_keranjang: keranjangJahit.id_keranjang,
      },
      include: [
        {
          model: VarianPakaian,
          as: "VarianPakaian",
          required: false,
          include: [
            {
              model: Pakaian,
              as: "Pakaian",
              required: false,
            },
          ],
        },
      ],
    });

    // Hitung total harga untuk masing-masing keranjang
    let totalHargaPermak = 0;
    let totalHargaJahit = 0;

    itemPermak.forEach((item) => {
      totalHargaPermak += parseFloat(item.harga_per_item) * item.kuantitas;
    });

    itemJahit.forEach((item) => {
      totalHargaJahit += parseFloat(item.harga_per_item) * item.kuantitas;
    });

    res.render("pages/keranjang/index", {
      title: "Keranjang Belanja",
      itemPermak,
      itemJahit,
      totalHargaPermak,
      totalHargaJahit,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat keranjang");
    res.redirect("/");
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifikasi bahwa item keranjang milik user yang sedang login
    const item = await ItemKeranjang.findOne({
      where: { id_item_keranjang: id },
      include: [
        {
          model: Keranjang,
          where: { id_pelanggan: req.session.userId },
        },
      ],
    });

    if (!item) {
      req.flash("error", "Item tidak ditemukan atau Anda tidak memiliki akses");
      return res.redirect("/cart");
    }

    // Hapus item
    await item.destroy();
    req.flash("success", "Item berhasil dihapus dari keranjang");
    res.redirect("/cart");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menghapus item dari keranjang");
    res.redirect("/cart");
  }
};
