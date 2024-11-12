// controllers/layanan/permakController.js
const {
  KategoriPermak,
  JenisPermak,
  InstruksiKhusus,
  Keranjang,
  ItemKeranjang,
} = require("../../models");
const { Op } = require("sequelize");

// Get semua kategori permak untuk halaman index
exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // items per page
    const offset = (page - 1) * limit;

    // Hitung total kategori untuk pagination
    const { count, rows: kategoriPermak } =
      await KategoriPermak.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: JenisPermak,
            as: "JenisPermak",
            attributes: ["id_jenis_permak"],
          },
        ],
        order: [["nama_kategori_permak", "ASC"]],
      });

    const totalPages = Math.ceil(count / limit);

    res.render("pages/layanan/permak/index", {
      title: "Kategori Layanan Permak",
      kategoriPermak,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error:", error);
    res.render("pages/error", {
      title: "Error",
      message: "Terjadi kesalahan saat memuat halaman",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

// Get detail kategori permak berdasarkan ID
exports.detailKategori = async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await KategoriPermak.findOne({
      where: { id_kategori_permak: id },
      include: [
        {
          model: JenisPermak,
          as: "JenisPermak",
          where: { status_produk: "active" },
          required: false,
        },
      ],
    });

    if (!kategori) {
      return res.status(404).render("pages/404", {
        title: "404 - Kategori Tidak Ditemukan",
      });
    }

    res.render("pages/layanan/permak/detail", {
      title: `Kategori ${kategori.nama_kategori_permak}`,
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

// Get detail jenis permak berdasarkan ID
exports.detailJenisPermak = async (req, res) => {
  try {
    const { id } = req.params;

    const jenisPermak = await JenisPermak.findOne({
      where: {
        id_jenis_permak: id,
        status_produk: "active",
      },
      include: [
        {
          model: KategoriPermak,
          as: "KategoriPermak",
        },
      ],
    });

    if (!jenisPermak) {
      return res.status(404).render("pages/404", {
        title: "404 - Jenis Permak Tidak Ditemukan",
      });
    }

    res.render("pages/layanan/permak/jenis-detail", {
      title: jenisPermak.nama_permak,
      jenisPermak,
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

// Di dalam permakController.js, pada fungsi addToCart
exports.addToCart = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data jenis permak terlebih dahulu
    const jenisPermak = await JenisPermak.findOne({
      where: {
        id_jenis_permak: id,
        status_produk: "active",
      },
    });

    if (!jenisPermak) {
      req.flash("error", "Jenis permak tidak ditemukan atau tidak aktif");
      return res.redirect("back");
    }

    // Cari atau buat keranjang khusus untuk permak
    const [keranjang] = await Keranjang.findOrCreate({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
      defaults: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
    });

    const instruksiKhusus = await InstruksiKhusus.create({
      jenis_instruksi: "permak",
      catatan: req.body.catatan,
      lokasi_perbaikan: req.body.lokasi_perbaikan,
      deskripsi_perbaikan: req.body.deskripsi_perbaikan,
      deskripsi_item: req.body.deskripsi_item,
    });

    await ItemKeranjang.create({
      id_keranjang: keranjang.id_keranjang,
      jenis_layanan: "permak",
      id_jenis_permak: id,
      id_instruksi_khusus: instruksiKhusus.id_instruksi_khusus,
      kuantitas: 1,
      harga_per_item: jenisPermak.harga,
      gambar_permak: req.file.filename,
    });

    req.flash("success", "Berhasil menambahkan ke keranjang");
    return res.redirect("/cart");
  } catch (error) {
    console.error("Error:", error);
    // Jika terjadi error setelah upload file, hapus file yang sudah diupload
    if (req.file) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(
        __dirname,
        "../../public/uploads/permak/",
        req.file.filename
      );
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
    req.flash("error", "Terjadi kesalahan saat menambahkan ke keranjang");
    return res.redirect("back");
  }
};

// Detail jenis permak juga perlu diupdate
exports.detailJenisPermak = async (req, res) => {
  try {
    const { id } = req.params;

    const jenisPermak = await JenisPermak.findOne({
      where: {
        id_jenis_permak: id,
        status_produk: "active",
      },
      include: [
        {
          model: KategoriPermak,
          as: "KategoriPermak",
        },
      ],
    });

    if (!jenisPermak) {
      return res.status(404).render("pages/404", {
        title: "404 - Jenis Permak Tidak Ditemukan",
      });
    }

    // Get form data from flash if any
    const formData = req.flash("formData")[0] || {};

    res.render("pages/layanan/permak/jenis-detail", {
      title: jenisPermak.nama_permak,
      jenisPermak,
      formData,
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

// Search jenis permak
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    const searchResults = await JenisPermak.findAll({
      where: {
        nama_permak: {
          [Op.like]: `%${q}%`,
        },
        status_produk: "active",
      },
      include: [
        {
          model: KategoriPermak,
          as: "KategoriPermak",
        },
      ],
    });

    res.render("pages/layanan/permak/search", {
      title: "Hasil Pencarian",
      searchQuery: q,
      results: searchResults,
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
