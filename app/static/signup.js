function initSignup() {
    const signupForm = document.getElementById('signup-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');

    // Toast Notifications
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    function updateIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value;

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                let errMsg = 'Registration failed';
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        errMsg = data.detail.map(d => d.msg).join(', ');
                    } else {
                        errMsg = data.detail;
                    }
                }
                throw new Error(errMsg);
            }

            // Redirect to index page with success flag
            window.location.href = 'index.html?registered=true';
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    updateIcons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignup);
} else {
    initSignup();
}
