/* ==========================================
   CHIPELEC POWER SYSTEM — Auth Helpers
   ========================================== */

const token = localStorage.getItem("token");

// Check if we need to redirect to login
if (!token && !window.location.href.includes("login.html")) {
    window.location = "login.html";
}

// Global Toast Notification Helper
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return; // Silent fail if container missing

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon mapping based on type
    let iconClass = 'bi-check-circle-fill';
    if (type === 'error') iconClass = 'bi-exclamation-circle-fill';
    if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
    if (type === 'info') iconClass = 'bi-info-circle-fill';

    toast.innerHTML = `
        <i class="bi ${iconClass} toast-icon"></i>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-exit')">
            <i class="bi bi-x"></i>
        </button>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Auto remove after animation completes
    setTimeout(() => {
        toast.classList.add('toast-exit');
    }, 3000);

    // Remove element from DOM after exit animation
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastSlideOut') {
            toast.remove();
        }
    });
};

// Global Admin UI populator
window.addEventListener('DOMContentLoaded', () => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    
    if (admin) {
        const nameDisplay = document.getElementById("adminName");
        const topbarNameDisplay = document.getElementById("topbarAdminName");
        const roleDisplay = document.getElementById("adminRole");
        
        // Handle admin name from full_name or username
        const displayName = admin.full_name || admin.username || "Admin";
        
        if (nameDisplay) nameDisplay.textContent = displayName;
        if (topbarNameDisplay) topbarNameDisplay.textContent = displayName;
        
        if (roleDisplay) {
            roleDisplay.textContent = admin.role || "Administrator";
        }
    }
});

// Logout Helper
window.logout = function(e) {
    if (e) e.preventDefault();
    localStorage.clear();
    window.location = "login.html";
};

// Global search basic handler for the topbar
window.addEventListener('DOMContentLoaded', () => {
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && globalSearch.value.trim() !== '') {
                window.showToast('Global search is under construction', 'info');
            }
        });
    }
});