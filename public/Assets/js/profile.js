document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Pastikan pengguna sudah login
    fetchProfile(); // Ambil data profil saat halaman dimuat
});

// Fungsi untuk memeriksa autentikasi
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Kamu belum Login.');
        window.location.href = '/login.html';
    }
}

// Fungsi untuk memeriksa apakah token sudah kadaluarsa
function isTokenExpired(token) {
    if (!token) return true;

    try {
        const decoded = JSON.parse(atob(token.split('.')[1])); // Decode payload JWT
        const currentTime = Date.now() / 1000; // Waktu saat ini dalam detik
        return decoded.exp < currentTime; // Periksa waktu kedaluwarsa
    } catch (error) {
        console.error('Error decoding token:', error);
        return true; // Anggap token tidak valid jika terjadi kesalahan
    }
}

// Fungsi untuk memeriksa autentikasi
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        alert('Sesi kamu sudah habis, Silahkan Login Ulang!');
        logoutUser();
    }
}

// Fungsi untuk logout
function logoutUser() {
    localStorage.removeItem('token'); // Hapus token dari localStorage
    window.location.href = '/login.html'; // Redirect ke halaman login
}

// Event listener untuk tombol logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutUser();
});

// Fungsi untuk mengambil data profil
async function fetchProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile.');
        }

        const profile = await response.json();

        // Tampilkan data profil
        document.getElementById('profileEmail').textContent = profile.email || '';
    } catch (error) {
        console.error(error);
        alert('Error fetching profile.');
    }
}

// Function for Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/finance/download-csv', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to download CSV.');
        }

        // Buat blob dari respons
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Buat elemen <a> untuk mengunduh file
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MoneyReport.csv'; // Nama file
        document.body.appendChild(a);
        a.click();

        // Bersihkan URL objek
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error(error);
        alert('Error downloading CSV file.');
    }
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/profile/delete-account', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to delete account.');
        }

        const result = await response.text();
        alert(result);

        // Logout pengguna setelah akun dihapus
        localStorage.removeItem('token');
        window.location.href = '/login.html'; // Redirect ke halaman login
    } catch (error) {
        console.error(error);
        alert('Error deleting account.');
    }
});