// controllers/orderController.js
const {
  Pesanan,
  RiwayatStatusPesanan,
  ItemPesanan,
  StatusPesanan,
  Pembayaran,
  JenisPermak,
  Pakaian,
  VarianPakaian,
  InstruksiKhusus,
  PermintaanUkuranKhusus,
} = require("../models");

// List semua pesanan
exports.listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = { id_pelanggan: req.session.userId };

    const { count, rows: pesanan } = await Pesanan.findAndCountAll({
      where,
      include: [
        {
          model: StatusPesanan,
          as: "StatusPesanan",
        },
        {
          model: ItemPesanan,
          as: "ItemPesanan",
          include: [
            {
              model: JenisPermak,
              as: "JenisPermak",
              required: false,
            },
          ],
        },
      ],
      order: [["tanggal_pesanan", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const pesananWithType = pesanan.map((order) => {
      const isPermak = order.ItemPesanan.some((item) => item.JenisPermak);
      return {
        ...order.toJSON(),
        jenis_layanan: isPermak ? "permak" : "jahit",
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.render("pages/orders/index", {
      title: "Daftar Pesanan",
      pesanan: pesananWithType,
      currentPage: page,
      totalPages,
      query: req.query,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memuat daftar pesanan");
    res.redirect("/");
  }
};

// Detail pesanan
exports.orderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const pesanan = await Pesanan.findOne({
      where: {
        id_pesanan: id,
        id_pelanggan: req.session.userId,
      },
      include: [
        {
          model: StatusPesanan,
          as: "StatusPesanan",
        },
        {
          model: ItemPesanan,
          as: "ItemPesanan",
          include: [
            {
              model: JenisPermak,
              as: "JenisPermak",
              required: false,
            },
            {
              model: VarianPakaian,
              as: "VarianPakaian",
              required: false,
              include: [
                {
                  model: Pakaian,
                  as: "Pakaian",
                },
              ],
            },
            {
              model: InstruksiKhusus,
              as: "InstruksiKhusus",
              required: false,
            },
            {
              model: PermintaanUkuranKhusus,
              as: "UkuranKhusus",
              required: false,
            },
          ],
        },
        {
          model: Pembayaran,
          as: "Pembayaran",
        },
        {
          model: RiwayatStatusPesanan,
          as: "RiwayatStatusPesanan",
          include: [
            {
              model: StatusPesanan,
              as: "StatusRiwayat",
            },
          ],
          order: [["tanggal_status", "DESC"]],
        },
      ],
    });

    if (!pesanan) {
      req.flash("error", "Pesanan tidak ditemukan");
      return res.redirect("/orders");
    }

    // Tentukan jenis pesanan
    const isPermak = pesanan.ItemPesanan.some((item) => item.JenisPermak);
    pesanan.jenis_layanan = isPermak ? "permak" : "jahit";

    res.render("pages/orders/detail", {
      title: `Detail Pesanan #${pesanan.id_pesanan}`,
      pesanan,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memuat detail pesanan");
    res.redirect("/orders");
  }
};

// Halaman upload bukti pembayaran
exports.showUploadPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const pesanan = await Pesanan.findOne({
      where: {
        id_pesanan: id,
        id_pelanggan: req.session.userId,
      },
      include: [
        {
          model: StatusPesanan,
          as: "StatusPesanan",
        },
        {
          model: Pembayaran,
          as: "Pembayaran",
        },
      ],
    });

    if (!pesanan) {
      req.flash("error", "Pesanan tidak ditemukan");
      return res.redirect("/orders");
    }

    if (pesanan.Pembayaran) {
      req.flash("error", "Bukti pembayaran sudah diupload");
      return res.redirect(`/orders/${id}`);
    }

    res.render("pages/orders/upload-payment", {
      title: "Upload Bukti Pembayaran",
      pesanan,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal memuat halaman upload pembayaran");
    res.redirect("/orders");
  }
};

// Proses upload bukti pembayaran
exports.processUploadPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { metode_pembayaran, catatan } = req.body;

    const pesanan = await Pesanan.findOne({
      where: {
        id_pesanan: id,
        id_pelanggan: req.session.userId,
      },
    });

    if (!pesanan) {
      req.flash("error", "Pesanan tidak ditemukan");
      return res.redirect("/orders");
    }

    // Create payment record
    await Pembayaran.create({
      id_pesanan: id,
      tanggal_pembayaran: new Date(),
      metode_pembayaran,
      jumlah_dibayar: pesanan.jumlah_total,
      status_pembayaran: "pending",
      bukti_pembayaran: req.file.filename,
      catatan_pembayaran: catatan,
    });

    // Update order status
    const statusMenungguKonfirmasi = await StatusPesanan.findOne({
      where: { nama_status: "menunggu konfirmasi pembayaran" },
    });

    await pesanan.update({
      id_status: statusMenungguKonfirmasi.id_status_master,
    });

    req.flash("success", "Bukti pembayaran berhasil diupload");
    res.redirect(`/orders/${id}`);
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Gagal mengupload bukti pembayaran");
    res.redirect(`/orders/${id}/upload-payment`);
  }
};

module.exports = exports;
