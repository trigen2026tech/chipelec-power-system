async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");
    const msg = document.getElementById("msg");

    if (!email || !password) {
        msg.innerHTML = '<div class="error-msg">Please enter both email and password</div>';
        return;
    }

    // UI Loading State
    const originalText = btn.innerHTML;
    btn.classList.add('btn-loading');
    msg.innerHTML = '';

    try {
        const response = await fetch("https://chipelec-backend.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("admin", JSON.stringify(data.admin));

            // Small delay for smooth transition
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 300);

        } else {
            btn.classList.remove('btn-loading');
            msg.innerHTML = `<div class="error-msg">${data.message || 'Invalid credentials'}</div>`;
        }

    } catch (err) {
        console.error(err);
        btn.classList.remove('btn-loading');
        msg.innerHTML = '<div class="error-msg">Connection error. Please try again.</div>';
    }
}

// Add enter key support
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const emailFocused = document.activeElement.id === 'email';
        const passwordFocused = document.activeElement.id === 'password';
        
        if (emailFocused || passwordFocused) {
            login();
        }
    }
});