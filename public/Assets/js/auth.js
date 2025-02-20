// Function to handle user registration
async function registerUser(email, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const result = await response.text();
        alert(result); // Show success message
        window.location.href = '/login.html'; // Redirect to login page
    } catch (error) {
        console.error(error);
        alert('Registration failed.');
    }
}

// Function to handle user login
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const data = await response.json();
        localStorage.setItem('token', data.token); // Simpan token di localStorage
        alert('Login successful!');
        window.location.href = '/'; // Redirect ke halaman utama
    } catch (error) {
        console.error(error);
        alert('Login failed.');
    }
}

// Event listener for registration form
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    await registerUser(email, password);
});

// Event listener for login form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    await loginUser(email, password);
});


//optional
// Function to toggle password visibility for Register
document.getElementById('togglePasswordRegister').addEventListener('click', () => {
    const passwordInput = document.getElementById('password');
    const icon = document.querySelector('#togglePasswordRegister i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'; // Tampilkan password
        icon.classList.remove('fa-eye'); // Ganti ikon ke mata tertutup
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password'; // Sembunyikan password
        icon.classList.remove('fa-eye-slash'); // Ganti ikon ke mata terbuka
        icon.classList.add('fa-eye');
    }
});

// Function to toggle password visibility for Login
document.getElementById('togglePasswordLogin').addEventListener('click', () => {
    const passwordInput = document.getElementById('loginpassword');
    const icon = document.querySelector('#togglePasswordLogin i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'; // Tampilkan password
        icon.classList.remove('fa-eye'); // Ganti ikon ke mata tertutup
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password'; // Sembunyikan password
        icon.classList.remove('fa-eye-slash'); // Ganti ikon ke mata terbuka
        icon.classList.add('fa-eye');
    }
});
