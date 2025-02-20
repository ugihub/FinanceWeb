let currentWishlistId = null; // Untuk menyimpan ID wishlist yang sedang diedit
let allWishlist = []; // Store all wishlist items fetched from the backend

// Fungsi untuk membuka modal Add Wishlist
function openAddWishlistModal() {
    document.getElementById('addWishlistModal').style.display = 'block';
}

// Fungsi untuk menutup modal Add Wishlist
function closeAddWishlistModal() {
    document.getElementById('addWishlistModal').style.display = 'none';
}

// Fungsi untuk memformat angka menjadi format uang (contoh: 10000 -> 10.000)
function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fungsi untuk membuka modal edit saved amount
function openEditSavedAmountModal(id, savedAmount) {
    currentWishlistId = id; // Simpan ID wishlist
    document.getElementById('savedAmountInput').value = savedAmount; // Isi input dengan nilai saat ini
    document.getElementById('editSavedAmountModal').style.display = 'block'; // Tampilkan modal
}

// Fungsi untuk menutup modal edit saved amount
function closeEditSavedAmountModal() {
    document.getElementById('editSavedAmountModal').style.display = 'none';
}

// Handle form submission untuk mengupdate saved amount
document.getElementById('editSavedAmountForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const savedAmount = parseFloat(document.getElementById('savedAmountInput').value);

    if (isNaN(savedAmount) || savedAmount < 0) {
        alert('Please enter a valid saved amount.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/wishlist/${currentWishlistId}/update-saved-amount`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ savedAmount }),
        });

        const result = await response.text();
        alert(result);

        // Tutup modal dan refresh daftar wishlist
        closeEditSavedAmountModal();
        fetchWishlist();
    } catch (error) {
        console.error(error);
        alert('Error updating saved amount.');
    }
});

document.getElementById('addWishlistForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('itemName', document.getElementById('itemName').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('savingPeriod', document.getElementById('savingPeriod').value);
    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        const result = await response.text();
        alert(result);

        // Tutup modal dan refresh daftar wishlist
        closeAddWishlistModal();
        fetchWishlist();
    } catch (error) {
        console.error(error);
        alert('Error adding wishlist.');
    }
});

// Fungsi untuk menghitung progress dalam persen
function calculateProgress(savedAmount, price) {
    if (price === 0) return 0; // Hindari pembagian oleh nol
    return Math.min((savedAmount / price) * 100, 100); // Batasi maksimal 100%
}

async function fetchWishlist() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/wishlist', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch wishlist.');
        }

        const wishlist = await response.json();
        allWishlist = wishlist; // Simpan data wishlist ke variabel global
        renderWishlist(wishlist); // Render wishlist di halaman
    } catch (error) {
        console.error(error);
        alert('Error fetching wishlist.');
    }
}

function renderWishlist(wishlist) {
    const wishlistList = document.getElementById('wishlistList');
    wishlistList.innerHTML = '';

    wishlist.forEach((item) => {
        const formattedAmount = formatCurrency(item.price); // Format jumlah uang
        const formattedAmount1 = formatCurrency(item.dailySavingAmount.toFixed(2)); // Format jumlah uang
        const formattedAmount2 = formatCurrency(item.savedAmount || 0); // Format jumlah uang
        const card = `
            <div class="wishlist-card">
                <img src="${item.image || 'placeholder.jpg'}" alt="${item.itemName}">
                <h3>${item.itemName}</h3>
                <p>${item.description}</p>
                <p><strong>Harga:</strong> Rp${formattedAmount}</p>
                <p><strong>Duit yang dikumpulkan setiap hari:</strong> Rp${formattedAmount1}</p>
                <p><strong>Jangka Waktu:</strong> ${item.savingPeriod} days</p>
                <p><strong>Total Terkumpul:</strong> Rp${formattedAmount2}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${calculateProgress(item.savedAmount, item.price)}%;"></div>
                </div>
                <p><strong>Progress:</strong> ${calculateProgress(item.savedAmount, item.price).toFixed(2)}%</p>
                    <button onclick="openEditWishlistModal('${item._id}')">Edit Wishlist</button>
                    <button onclick="openEditSavedAmountModal('${item._id}', ${item.savedAmount})">Total Terkumpul</button>
                <button onclick="deleteWishlist('${item._id}')">Delete</button>
            </div>
        `;
        wishlistList.innerHTML += card;
    });
}

async function deleteWishlist(id) {
    if (!confirm('Are you sure you want to delete this wishlist item?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/wishlist/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to delete wishlist.');
        }

        alert('Wishlist deleted successfully.');
        fetchWishlist(); // Refresh daftar wishlist
    } catch (error) {
        console.error(error);
        alert('Error deleting wishlist.');
    }
}

// Fungsi untuk membuka modal Edit Wishlist
function openEditWishlistModal(id) {
    const wishlist = allWishlist.find((item) => item._id === id); // Temukan wishlist berdasarkan ID

    // Isi form dengan data wishlist
    document.getElementById('editWishlistId').value = wishlist._id;
    document.getElementById('editItemName').value = wishlist.itemName;
    document.getElementById('editDescription').value = wishlist.description;
    document.getElementById('editPrice').value = wishlist.price;
    document.getElementById('editSavingPeriod').value = wishlist.savingPeriod;

    // Tampilkan modal
    document.getElementById('editWishlistModal').style.display = 'block';
}

// Fungsi untuk menutup modal Edit Wishlist
function closeEditWishlistModal() {
    document.getElementById('editWishlistModal').style.display = 'none';
}

document.getElementById('editWishlistForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editWishlistId').value;
    const itemName = document.getElementById('editItemName').value;
    const description = document.getElementById('editDescription').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const savingPeriod = parseInt(document.getElementById('editSavingPeriod').value);
    const dailySavingAmount = price / savingPeriod;

    const formData = new FormData();
    formData.append('itemName', itemName);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('savingPeriod', savingPeriod);
    formData.append('dailySavingAmount', dailySavingAmount);

    const imageInput = document.getElementById('editImage');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/wishlist/edit-wish/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        const result = await response.text();
        alert(result);

        // Tutup modal dan refresh daftar wishlist
        closeEditWishlistModal();
        fetchWishlist();
    } catch (error) {
        console.error(error);
        alert('Error updating wishlist.');
    }
});

// Panggil fungsi fetchWishlist saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    fetchWishlist();
    checkAuth(); // Periksa token saat halaman dimuat
});

// Function for Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
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
        alert('Your session has expired. Please log in again.');
        logoutUser();
    }
}

// Fungsi untuk logout
function logoutUser() {
    localStorage.removeItem('token'); // Hapus token dari localStorage
    window.location.href = '/login.html'; // Redirect ke halaman login
}

document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Kamu Belum Login.');
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

// Function to handle logout
function logoutUser() {
    localStorage.removeItem('token'); // Hapus token dari localStorage
    alert('You have been logged out.');
    window.location.href = '/login.html'; // Redirect ke halaman login
}

// Event listener untuk tombol logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutUser();
});