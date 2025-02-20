const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Model User
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Terapkan middleware autentikasi

// Route untuk mendapatkan data profil
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // Ambil data pengguna tanpa password
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching profile.');
    }
});

// Route untuk menghapus akun
router.delete('/delete-account', async (req, res) => {
    try {
        const userId = req.userId; // Ambil ID pengguna dari token JWT

        // Hapus pengguna dari database
        await User.findByIdAndDelete(userId);

        // Hapus token atau sesi pengguna (opsional)
        res.status(200).send('Account deleted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting account.');
    }
});


module.exports = router;