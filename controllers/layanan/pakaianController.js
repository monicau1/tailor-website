// controllers/layanan/pakaianController.js
const {
  KategoriPakaian,
  Pakaian,
  GambarPakaian,
  VarianPakaian,
  Keranjang,
  ItemKeranjang,
  Pesanan,
  ItemPesanan,
  PermintaanUkuranKhusus,
  InstruksiKhusus,
} = require("../../models");
const { Op } = require("sequelize");

// Get semua pakaian dengan filter kategori
exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // items per page
    const offset = (page - 1) * limit;
    const selectedKategori = req.query.kategori
      ? parseInt(req.query.kategori)
      : null;
    const sortBy = req.query.sort || "default";

    // Query untuk mendapatkan semua kategori untuk sidebar
    const kategoriPakaian = await KategoriPakaian.findAll({
      order: [["nama_kategori_pakaian", "ASC"]],
    });

    // Base query untuk pakaian
    let whereClause = { status_produk: "active" };
    if (selectedKategori) {
      whereClause.id_kategori_pakaian = selectedKategori;
    }

    // Sorting options
    let order = [["nama_pakaian", "ASC"]]; // default sorting
    switch (sortBy) {
      case "name-asc":
        order = [["nama_pakaian", "ASC"]];
        break;
      case "name-desc":
        order = [["nama_pakaian", "DESC"]];
        break;
      case "price-asc":
        order = [["harga", "ASC"]];
        break;
      case "price-desc":
        order = [["harga", "DESC"]];
        break;
    }

    // Get kategori info jika ada filter kategori
    let kategoriInfo = null;
    if (selectedKategori) {
      kategoriInfo = await KategoriPakaian.findByPk(selectedKategori);
    }

    // Query untuk mendapatkan pakaian dengan pagination
    const { count, rows: pakaianList } = await Pakaian.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: GambarPakaian,
          as: "GambarPakaian",
          where: { is_primary: true },
          required: false,
        },
        {
          model: VarianPakaian,
          as: "VarianPakaian",
          attributes: ["ukuran"],
        },
        {
          model: KategoriPakaian,
        },
      ],
      order: order,
      distinct: true,
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.render("pages/layanan/pakaian/index", {
      title: "Katalog Pakaian",
      kategoriPakaian,
      pakaianList,
      currentPage: page,
      totalPages,
      selectedKategori,
      kategoriInfo,
      sortBy,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      message: "Terjadi kesalahan saat memuat halaman",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

// Get detail pakaian berdasarkan ID
exports.detailPakaian = async (req, res) => {
  try {
    const { id } = req.params;

    // Query untuk mengambil data pakaian beserta relasinya
    const pakaian = await Pakaian.findOne({
      where: {
        id_pakaian: id,
        status_produk: "active",
      },
      include: [
        {
          model: KategoriPakaian,
        },
        {
          model: GambarPakaian,
          as: "GambarPakaian",
        },
        {
          model: VarianPakaian,
          as: "VarianPakaian",
        },
      ],
    });

    // Debug log
    console.log("Detail Pakaian Query Result:", {
      id: pakaian?.id_pakaian,
      nama: pakaian?.nama_pakaian,
      varianCount: pakaian?.VarianPakaian?.length || 0,
      gambarCount: pakaian?.GambarPakaian?.length || 0,
    });

    if (!pakaian) {
      console.log("Pakaian not found");
      return res.status(404).render("pages/404", {
        title: "404 - Pakaian Tidak Ditemukan",
      });
    }

    // Render halaman detail
    res.render("pages/layanan/pakaian/detail", {
      title: pakaian.nama_pakaian,
      pakaian: pakaian,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error in detailPakaian:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      message: "Terjadi kesalahan saat memuat halaman",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

// Search pakaian
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    // Get all categories for sidebar
    const kategoriPakaian = await KategoriPakaian.findAll({
      order: [["nama_kategori_pakaian", "ASC"]],
    });

    // Search query
    const { count, rows: pakaianList } = await Pakaian.findAndCountAll({
      where: {
        [Op.or]: [
          {
            nama_pakaian: {
              [Op.like]: `%${q}%`,
            },
          },
          {
            deskripsi_pakaian: {
              [Op.like]: `%${q}%`,
            },
          },
        ],
        status_produk: "active",
      },
      include: [
        {
          model: GambarPakaian,
          as: "GambarPakaian",
          where: { is_primary: true },
          required: false,
        },
        {
          model: VarianPakaian,
          as: "VarianPakaian",
        },
        {
          model: KategoriPakaian,
        },
      ],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.render("pages/layanan/pakaian/index", {
      title: `Hasil Pencarian: ${q}`,
      kategoriPakaian,
      pakaianList,
      currentPage: page,
      totalPages,
      searchQuery: q,
      selectedKategori: null,
      kategoriInfo: null,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      message: "Terjadi kesalahan saat mencari",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

exports.checkStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { ukuran, warna } = req.query;

    // Cari varian yang sesuai
    const varian = await VarianPakaian.findOne({
      where: {
        id_pakaian: id,
        ukuran: ukuran,
        warna: warna,
      },
    });

    // Kirim response
    res.json({
      stok: varian ? varian.stok : 0,
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    res.status(500).json({
      error: "Gagal mengecek stok",
      stok: 0,
    });
  }
};

// Update method addToCart
exports.addToCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { ukuran, warna, quantity = 1, isCustomSize } = req.body;

    // Cari varian yang sesuai
    const varian = await VarianPakaian.findOne({
      where: {
        id_pakaian: id,
        ukuran: ukuran,
        warna: warna,
      },
      include: [
        {
          model: Pakaian,
          as: "Pakaian",
        },
      ],
    });

    if (!varian || varian.stok < quantity) {
      req.flash("error", "Stok tidak tersedia");
      return res.redirect("back");
    }

    // Proses selanjutnya sama seperti sebelumnya...
    const [keranjang] = await Keranjang.findOrCreate({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "jahit",
      },
      defaults: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "jahit",
      },
    });

    // Tambah ke keranjang
    await ItemKeranjang.create({
      id_keranjang: keranjang.id_keranjang,
      id_varian_pakaian: varian.id_varian_pakaian,
      kuantitas: quantity,
      harga_per_item: varian.Pakaian.harga,
    });

    req.flash("success", "Berhasil menambahkan ke keranjang");
    res.redirect("/cart");
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal menambahkan ke keranjang");
    res.redirect("back");
  }
};

exports.detailKategori = async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await KategoriPakaian.findOne({
      where: { id_kategori_pakaian: id },
      include: [
        {
          model: Pakaian,
          where: { status_produk: "active" },
          required: false,
          include: [
            {
              model: VarianPakaian,
              as: "VarianPakaian",
            },
          ],
        },
      ],
    });

    if (!kategori) {
      return res.status(404).render("pages/404", {
        title: "404 - Kategori Tidak Ditemukan",
      });
    }

    res.render("pages/layanan/pakaian/kategori-detail", {
      title: `Kategori ${kategori.nama_kategori_pakaian}`,
      kategori,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("pages/error", {
      title: "Error",
      message: "Terjadi kesalahan saat memuat halaman",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};
