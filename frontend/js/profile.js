const token = localStorage.getItem("token");
const admin = JSON.parse(localStorage.getItem("admin"));

// ========================
// LOAD ADMIN PROFILE
// ========================

window.addEventListener("DOMContentLoaded", () => {

    if (admin) {

        document.getElementById("adminUsername").textContent = admin.username || "Admin";
        document.getElementById("adminEmail").textContent = admin.email || "";

        document.getElementById("viewUsername").value = admin.username || "";
        document.getElementById("viewEmail").value = admin.email || "";
        document.getElementById("viewRole").value = admin.role || "Administrator";

        document.getElementById("editUsername").value = admin.username || "";
        document.getElementById("editEmail").value = admin.email || "";

    } else {

        window.location = "login.html";

    }

});

// ========================
// SHOW EDIT FORM
// ========================

function showEditForm() {

    document.getElementById("viewProfileSection").style.display = "none";
    document.getElementById("editProfileSection").style.display = "block";

}

// ========================
// CANCEL EDIT
// ========================

function cancelEdit() {

    document.getElementById("editProfileSection").style.display = "none";
    document.getElementById("viewProfileSection").style.display = "block";

    clearMessages();

}

// ========================
// SAVE PROFILE
// ========================

async function saveProfile() {

    const username = document.getElementById("editUsername").value;
    const email = document.getElementById("editEmail").value;

    if (!username || !email) {
        showError("Please fill in all fields");
        return;
    }

    if (!email.includes("@")) {
        showError("Please enter a valid email address");
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/auth/profile/${admin.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    username: username,
                    email: email
                })
            }
        );

        const result = await response.json();

        if (result.success) {

            // Update localStorage
            admin.username = username;
            admin.email = email;
            localStorage.setItem("admin", JSON.stringify(admin));

            document.getElementById("adminUsername").textContent = username;
            document.getElementById("adminEmail").textContent = email;
            document.getElementById("viewUsername").value = username;
            document.getElementById("viewEmail").value = email;

            showSuccess("Profile updated successfully!");

            setTimeout(() => {
                cancelEdit();
            }, 2000);

        } else {

            showError(result.message || "Failed to update profile");

        }

    } catch (err) {

        console.error(err);
        showError("Unable to connect to server");

    }

}

// ========================
// CHANGE PASSWORD
// ========================

async function changePassword() {

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showError("Please fill in all password fields");
        return;
    }

    if (newPassword.length < 6) {
        showError("New password must be at least 6 characters");
        return;
    }

    if (newPassword !== confirmPassword) {
        showError("Passwords do not match");
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/auth/change-password/${admin.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            }
        );

        const result = await response.json();

        if (result.success) {

            showSuccess("Password changed successfully!");

            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";

        } else {

            showError(result.message || "Failed to change password");

        }

    } catch (err) {

        console.error(err);
        showError("Unable to connect to server");

    }

}

// ========================
// SHOW SUCCESS MESSAGE
// ========================

function showSuccess(message) {

    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";

    setTimeout(() => {
        successDiv.style.display = "none";
    }, 3000);

}

// ========================
// SHOW ERROR MESSAGE
// ========================

function showError(message) {

    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";

    setTimeout(() => {
        errorDiv.style.display = "none";
    }, 3000);

}

// ========================
// CLEAR MESSAGES
// ========================

function clearMessages() {

    document.getElementById("successMessage").style.display = "none";
    document.getElementById("errorMessage").style.display = "none";

}
