const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Periksa apakah email sudah digunakan
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email already exists.');
        }

        // Simpan password dalam bentuk plain text
        const newUser = new User({ email, password }); // Tidak di-hash
        await newUser.save();

        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user.');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cari pengguna berdasarkan email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid credentials.');
        }

        // Bandingkan password secara langsung (tanpa hashing)
        if (user.password !== password) {
            return res.status(401).send('Invalid credentials.');
        }

        // Buat token JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in.');
    }
});

module.exports = router;