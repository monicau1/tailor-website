// controllers/checkoutController.js
const {
  Keranjang,
  ItemKeranjang,
  JenisPermak,
  InstruksiKhusus,
  Pesanan,
  ItemPesanan,
  AlamatPelanggan,
  StatusPesanan,
} = require("../models");

exports.showPermakCheckout = async (req, res) => {
  try {
    // Ambil keranjang permak user
    const keranjang = await Keranjang.findOne({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
      include: [
        {
          model: ItemKeranjang,
          as: "ItemKeranjang",
          include: [
            { model: JenisPermak, as: "JenisPermak" },
            { model: InstruksiKhusus, as: "InstruksiKhusus" },
          ],
        },
      ],
    });

    if (!keranjang || !keranjang.ItemKeranjang.length) {
      req.flash("error", "Keranjang permak kosong");
      return res.redirect("/cart");
    }

    // Ambil alamat pelanggan
    const alamatPelanggan = await AlamatPelanggan.findAll({
      where: { id_pelanggan: req.session.userId },
    });

    // Hitung total
    let total = 0;
    keranjang.ItemKeranjang.forEach((item) => {
      total += item.harga_per_item * item.kuantitas;
    });

    res.render("pages/checkout/permak", {
      title: "Checkout Permak",
      keranjang,
      alamatPelanggan,
      total,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat halaman checkout");
    res.redirect("/cart");
  }
};

exports.processPermakCheckout = async (req, res) => {
  try {
    const { alamat_id, metode_pembayaran, catatan } = req.body;

    // 1. Ambil keranjang dan items
    const keranjang = await Keranjang.findOne({
      where: {
        id_pelanggan: req.session.userId,
        jenis_layanan: "permak",
      },
      include: [
        {
          model: ItemKeranjang,
          as: "ItemKeranjang",
          include: [
            { model: JenisPermak, as: "JenisPermak" },
            { model: InstruksiKhusus, as: "InstruksiKhusus" },
          ],
        },
      ],
    });

    if (!keranjang || !keranjang.ItemKeranjang.length) {
      req.flash("error", "Keranjang permak kosong");
      return res.redirect("/cart");
    }

    // 2. Hitung total
    let total = 0;
    keranjang.ItemKeranjang.forEach((item) => {
      total += item.harga_per_item * item.kuantitas;
    });

    // 3. Dapatkan status awal pesanan
    const statusAwal = await StatusPesanan.findOne({
      where: { nama_status: "menunggu pembayaran" },
    });

    // 4. Buat pesanan baru
    const pesanan = await Pesanan.create({
      id_pelanggan: req.session.userId,
      id_status: statusAwal.id_status_master,
      tanggal_pesanan: new Date(),
      jumlah_total: total,
      catatan_pesanan: catatan,
    });

    // 5. Pindahkan item dari keranjang ke pesanan
    for (const item of keranjang.ItemKeranjang) {
      await ItemPesanan.create({
        id_pesanan: pesanan.id_pesanan,
        id_jenis_permak: item.id_jenis_permak,
        id_instruksi_khusus: item.id_instruksi_khusus,
        id_status_master: statusAwal.id_status_master,
        kuantitas: item.kuantitas,
        harga_per_item: item.harga_per_item,
        gambar_permak: item.gambar_permak,
      });
    }

    // 6. Kosongkan keranjang permak
    await ItemKeranjang.destroy({
      where: { id_keranjang: keranjang.id_keranjang },
    });

    // 7. Redirect ke halaman sukses
    req.flash("success", "Pesanan berhasil dibuat");
    res.redirect(`/checkout/success/${pesanan.id_pesanan}`);
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memproses checkout");
    res.redirect("/checkout/permak");
  }
};

exports.showSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;

    const pesanan = await Pesanan.findOne({
      where: {
        id_pesanan: orderId,
        id_pelanggan: req.session.userId,
      },
      include: [{ model: StatusPesanan, as: "StatusPesanan" }],
    });

    if (!pesanan) {
      req.flash("error", "Pesanan tidak ditemukan");
      return res.redirect("/");
    }

    res.render("pages/checkout/success", {
      title: "Checkout Berhasil",
      pesanan,
    });
  } catch (error) {
    console.error("Error:", error);
    req.flash("error", "Terjadi kesalahan saat memuat halaman");
    res.redirect("/");
  }
};
