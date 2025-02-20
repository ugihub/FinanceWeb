// routes/wishlist.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware); // Middleware autentikasi

// Konfigurasi penyimpanan file gambar
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Simpan dengan nama unik
    },
});

const upload = multer({ storage });

// Route untuk menambahkan wishlist
router.post('/wishlist', upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, price, savingPeriod } = req.body;
        const dailySavingAmount = price / savingPeriod;

        const newWishlist = new Wishlist({
            userId: req.userId,
            itemName,
            description,
            price,
            savingPeriod,
            dailySavingAmount,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });

        await newWishlist.save();
        res.status(201).send('Wishlist added successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding wishlist.');
    }
});

// Route untuk mendapatkan wishlist pengguna
router.get('/wishlist', async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.userId });
        res.status(200).json(wishlist);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching wishlist.');
    }
});

// Route untuk menghapus wishlist
router.delete('/wishlist/:id', async (req, res) => {
    try {
        await Wishlist.findByIdAndDelete(req.params.id);
        res.status(200).send('Wishlist deleted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting wishlist.');
    }
});

// Route untuk mengupdate jumlah uang yang sudah terkumpul
router.put('/wishlist/:id/update-saved-amount', async (req, res) => {
    try {
        const { id } = req.params;
        const { savedAmount } = req.body;

        // Temukan wishlist berdasarkan ID
        const wishlist = await Wishlist.findById(id);
        if (!wishlist) {
            return res.status(404).send('Wishlist not found.');
        }

        // Update jumlah uang yang sudah terkumpul
        wishlist.savedAmount = savedAmount;

        // Hitung sisa harga yang harus ditabung
        const remainingAmount = wishlist.price - savedAmount;

        // Hitung ulang jangka waktu menabung berdasarkan tabungan harian
        if (remainingAmount > 0 && wishlist.dailySavingAmount > 0) {
            wishlist.savingPeriod = Math.ceil(remainingAmount / wishlist.dailySavingAmount);
        } else {
            wishlist.savingPeriod = 0; // Jika uang sudah terkumpul semua
        }

        // Simpan perubahan
        await wishlist.save();

        res.status(200).send('Saved amount updated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating saved amount.');
    }
});

// routes/wishlist.js
router.put('/wishlist/edit-wish/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, description, price, savingPeriod, dailySavingAmount } = req.body;

        // Temukan wishlist berdasarkan ID
        const wishlist = await Wishlist.findById(id);
        if (!wishlist) {
            return res.status(404).send('Wishlist not found.');
        }

        // Update data wishlist
        wishlist.itemName = itemName;
        wishlist.description = description;
        wishlist.price = price;
        wishlist.savingPeriod = savingPeriod;
        wishlist.dailySavingAmount = dailySavingAmount;

        // Update gambar jika ada file baru
        if (req.file) {
            wishlist.image = `/uploads/${req.file.filename}`;
        }

        // Simpan perubahan
        await wishlist.save();

        res.status(200).send('Wishlist updated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating wishlist.');
    }
});

module.exports = router;