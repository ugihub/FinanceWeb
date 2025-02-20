const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { Parser } = require('json2csv'); // Import library json2csv
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware untuk autentikasi
router.use(authMiddleware);

// Fetch all transactions (hanya untuk pengguna yang sudah login)
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId }); // Filter berdasarkan userId
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching transactions.');
    }
});

// Route untuk input data manual
router.post('/add-transaction', async (req, res) => {
    try {
        const { date, description, amount, category } = req.body;

        // Validasi input
        if (!date || !description || !amount || !category) {
            return res.status(400).send('All fields are required');
        }

        // Simpan data ke MongoDB dengan userId
        const newTransaction = new Transaction({
            userId: req.userId, // Tambahkan userId untuk mengaitkan transaksi dengan pengguna
            date,
            description,
            amount,
            category,
        });
        await newTransaction.save();
        res.status(201).send('Transaction added successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding transaction');
    }
});

// Route untuk download laporan CSV
router.get('/download-csv', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId }); // Ambil transaksi pengguna

        if (transactions.length === 0) {
            return res.status(404).send('No transactions found.');
        }

        // Buat konten CSV
        let csvContent = 'Date,Description,Amount,Category\n'; // Header CSV
        transactions.forEach((transaction) => {
            csvContent += `${new Date(transaction.date).toLocaleDateString()},${transaction.description},${transaction.amount},${transaction.category}\n`;
        });

        // Set header untuk mengunduh file CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

        // Kirim file CSV
        res.send(csvContent);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating CSV file.');
    }
});

// Route untuk menghapus transaksi
router.delete('/delete-transaction/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Hapus transaksi berdasarkan ID dan userId
        const deletedTransaction = await Transaction.findOneAndDelete({
            _id: id,
            userId: req.userId, // Pastikan transaksi milik pengguna yang login
        });

        if (!deletedTransaction) {
            return res.status(404).send('Transaction not found or unauthorized');
        }

        res.status(200).send('Transaction deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting transaction');
    }
});

// Route untuk mengedit transaksi
router.put('/update-transaction/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description, amount, category } = req.body;

        // Validasi input
        if (!date || !description || !amount || !category) {
            return res.status(400).send('All fields are required');
        }

        // Update transaksi berdasarkan ID dan userId
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: id, userId: req.userId }, // Pastikan transaksi milik pengguna yang login
            { date, description, amount, category },
            { new: true } // Opsi `new: true` mengembalikan data yang sudah diperbarui
        );

        if (!updatedTransaction) {
            return res.status(404).send('Transaction not found or unauthorized');
        }

        res.status(200).send('Transaction updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating transaction');
    }
});

// Route untuk mendapatkan data transaksi berdasarkan kategori
router.get('/transactions-by-category', async (req, res) => {
    try {
        const transactions = await Transaction.aggregate([
            { $match: { userId: req.userId } }, // Filter berdasarkan userId
            {
                $group: {
                    _id: '$category', // Kelompokkan berdasarkan kategori
                    category: { $first: '$category' }, // Simpan nama kategori secara eksplisit
                    totalAmount: { $sum: '$amount' }, // Hitung total jumlah untuk setiap kategori
                },
            },
        ]);

        // Format ulang data agar lebih bersih
        const formattedData = transactions.map((item) => ({
            category: item.category || 'Uncategorized', // Gunakan nama kategori
            totalAmount: item.totalAmount,
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching transactions by category.');
    }
});

module.exports = router;