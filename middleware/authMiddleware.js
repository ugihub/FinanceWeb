const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header Authorization
    if (!token) {
        return res.status(401).send('Unauthorized.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifikasi token
        req.userId = decoded.userId; // Simpan userId di request object
        next(); // Lanjutkan ke rute berikutnya
    } catch (error) {
        console.error(error);
        return res.status(401).send('Invalid token.');
    }
};

module.exports = authMiddleware;