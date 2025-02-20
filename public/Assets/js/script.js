let allTransactions = []; // Store all transactions fetched from the backend
let currentEditId = null; // Store the ID of the transaction being edited

// Fungsi untuk memformat angka menjadi format uang (contoh: 10000 -> 10.000)
function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

// Panggil fungsi ini saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Periksa token saat halaman dimuat
});

// Fungsi untuk logout
function logoutUser() {
    localStorage.removeItem('token'); // Hapus token dari localStorage
    window.location.href = '/login.html'; // Redirect ke halaman login
}

// Fetch and display transactions from the database
async function fetchTransactions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Kamu Belum Login.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/finance/transactions', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch transactions.');
        }

        const transactions = await response.json();
        allTransactions = transactions; // Simpan semua transaksi pengguna
        renderTransactions(transactions);
        updateFilterDropdown(); // Perbarui dropdown kategori
        renderCharts(transactions); // Render charts
    } catch (error) {
        console.error(error);
    }
}

// Render transactions in the table
function renderTransactions(transactions) {
    const tableBody = document.getElementById('transactionsTable');
    tableBody.innerHTML = ''; // Clear existing rows

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Belum Ada Transaksi Saat ini.</td></tr>';
        return;
    }

    const translateCategory = (category) => {
        const categoryTranslations = {
            'Income': 'Pemasukan',
            'Expense': 'Pengeluaran',
            'Investment': 'Investasi',
            // Tambahkan kategori lainnya di sini
        };
        return categoryTranslations[category] || category;
    };
    
    transactions.forEach((transaction) => {
        const formattedAmount = formatCurrency(transaction.amount); // Format jumlah uang
        const translatedCategory = translateCategory(transaction.category); // Terjemahkan kategori
        const row = `
            <tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>Rp ${formattedAmount}</td>
                <td>${translatedCategory}</td>
                <td>
                    <button style="margin-bottom:20px;" onclick="openModal('${transaction._id}', '${transaction.date}', '${transaction.description}', '${transaction.amount}', '${transaction.category}')">Edit</button>
                    <button onclick="deleteTransaction('${transaction._id}')">Delete</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
    
}

// Render charts
async function renderCharts(transactions) {
    try {
        // Ambil token dari localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Kamu Belum Login.');
            window.location.href = '/login.html';
            return;
        }

        // Fetch data dari backend dengan menyertakan token di header
        const response = await fetch('/api/finance/transactions-by-category', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        // Jika tidak ada data, beri peringatan
        if (transactions.length === 0) {
            console.warn('No data available for charts.');
            return;
        }

        // Ekstrak kategori dan jumlah total dari data
        const categories = transactions.map((item) => item.category || item.category); // Gunakan field "category"
        const amounts = transactions.map((item) => item.totalAmount || item.amount);

        // Tangani respons jika tidak berhasil
        if (!response.ok) {
            const errorMessage = await response.text(); // Tangani respons non-JSON
            throw new Error(errorMessage || 'Failed to fetch chart data.');
        }

        // Pie Chart
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        if (window.pieChart)
            window.pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: categories,
                    datasets: [
                        {
                            label: 'Total Amount',
                            data: amounts,
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        },
                    ],
                },
            });

        // Bar Chart
        const barCtx = document.getElementById('barChart').getContext('2d');
        if (window.barChart)
            window.barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [
                        {
                            label: 'Total Amount',
                            data: amounts,
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        },
                    ],
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
    } catch (error) {
        console.error('Error rendering charts:', error.message); // Debug
    }
}

// Handle form submission for manual input
document.getElementById('manualInputForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const categorySelect = document.getElementById('category');
    const otherCategoryInput = document.getElementById('otherCategory');

    let category = categorySelect.value;
    if (category === 'Other') {
        category = otherCategoryInput.value.trim();
        if (!category) {
            alert('Please specify the category.');
            return;
        }
    }

    try {
        const token = localStorage.getItem('token'); // Ambil token dari localStorage
        if (!token) {
            alert('Kamu Belum Login.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/finance/add-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Sertakan token di header
            },
            body: JSON.stringify({ date, description, amount, category }),
        });

        const result = await response.text();
        alert(result);

        // Reset form dan refresh data
        document.getElementById('manualInputForm').reset();
        toggleOtherCategory(categorySelect); // Hide "Other Category" input
        fetchTransactions(); // Refresh data
    } catch (error) {
        console.error(error);
        alert('Error adding transaction.');
    }
});

// Function to delete a transaction
async function deleteTransaction(id) {
    if (confirm('Kamu Yakin Mau Hapus Transaksi ini?')) {
        try {
            const token = localStorage.getItem('token'); // Ambil token dari localStorage
            if (!token) {
                alert('Kamu Belum Login.');
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(`/api/finance/delete-transaction/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Sertakan token di header
                },
            });

            const result = await response.text();
            alert(result);

            // Refresh the transactions list and charts
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert('Error deleting transaction.');
        }
    }
}

// Function to open the modal and populate it with transaction data
function openModal(id, date, description, amount, category) {
    // Populate form fields
    document.getElementById('editDate').value = date;
    document.getElementById('editDescription').value = description;
    document.getElementById('editAmount').value = amount;
    document.getElementById('editCategory').value = category;

    // Store the ID of the transaction being edited
    currentEditId = id;

    // Show the modal
    const modal = document.getElementById('editModal');
    modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
}

// Handle form submission for editing a transaction
document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedDate = document.getElementById('editDate').value;
    const updatedDescription = document.getElementById('editDescription').value;
    const updatedAmount = document.getElementById('editAmount').value;
    const updatedCategory = document.getElementById('editCategory').value;

    try {
        const token = localStorage.getItem('token'); // Ambil token dari localStorage
        if (!token) {
            alert('Kamu Belum Login.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`/api/finance/update-transaction/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                date: updatedDate,
                description: updatedDescription,
                amount: updatedAmount,
                category: updatedCategory,
            }),
        });

        const result = await response.text();
        alert(result);

        // Close the modal and refresh the transactions list
        closeModal();
        fetchTransactions();
    } catch (error) {
        console.error(error);
        alert('Error updating transaction.');
    }
});

// Filter transactions by category
document.getElementById('filterCategory')?.addEventListener('change', (e) => {
    const selectedCategory = e.target.value;

    if (selectedCategory === '') {
        // Show all transactions if "All Categories" is selected
        renderTransactions(allTransactions);
    } else {
        // Filter transactions by selected category
        const filteredTransactions = allTransactions.filter(
            (transaction) => transaction.category === selectedCategory
        );
        renderTransactions(filteredTransactions);
    }
});

// Search transactions by category
function searchByCategory() {
    const searchCategory = document.getElementById('searchCategory').value.trim();
    if (!searchCategory) {
        alert('Masukan Keyword dulu...');
        return;
    }

    const filteredTransactions = allTransactions.filter(
        (transaction) => transaction.category.toLowerCase() === searchCategory.toLowerCase()
    );

    if (filteredTransactions.length === 0) {
        alert('Gada Transaksi Yang Ketemu');
        return;
    }

    renderTransactions(filteredTransactions);
}

// Call fetchTransactions when the page loads
fetchTransactions();

// Toggle visibility of the "Other Category" input field
function toggleOtherCategory(selectElement) {
    const otherCategoryInput = document.getElementById('otherCategoryInput');
    if (selectElement.value === 'Other') {
        otherCategoryInput.style.display = 'block';
    } else {
        otherCategoryInput.style.display = 'none';
    }
}

// Update filter dropdown dynamically based on available categories
function updateFilterDropdown() {
    const filterCategoryDropdown = document.getElementById('filterCategory');
    const uniqueCategories = [...new Set(allTransactions.map((t) => t.category))];

    // Clear existing options
    filterCategoryDropdown.innerHTML = `
        <option value="">-- Semua Kategori --</option>
        <option value="Pemasukan">Pemasukan</option>
        <option value="Pengeluaran">Pengeluaran</option>
        <option value="Investasi">Investasi</option>
    `;

    // Add new categories dynamically
    uniqueCategories.forEach((category) => {
        if (!['Pemasukan', 'Pengeluaran', 'Investasi'].includes(category)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategoryDropdown.appendChild(option);
        }
    });
}

// Call this function after fetching transactions
updateFilterDropdown();

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

// Function to open modal
function openAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'block';
}

// Function to close modal
function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'none';
}

// Function for Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Function to handle logout
function logoutUser() {
    localStorage.removeItem('token'); // Hapus token dari localStorage
    alert('Kamu Berhasil Logout.');
    window.location.href = '/login.html'; // Redirect ke halaman login
}

// Event listener untuk tombol logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutUser();
});