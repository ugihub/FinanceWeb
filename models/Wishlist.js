const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID pengguna
    itemName: { type: String, required: true }, // Nama barang
    description: { type: String }, // Deskripsi barang
    price: { type: Number, required: true }, // Harga barang
    savingPeriod: { type: Number, required: true }, // Jangka waktu menabung (hari)
    dailySavingAmount: { type: Number }, // Jumlah tabungan harian
    savedAmount: { type: Number, default: 0 }, // Jumlah uang yang sudah terkumpul
    image: { type: String }, // Path gambar (disimpan secara lokal)
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);