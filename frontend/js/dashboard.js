const token = localStorage.getItem("token");
const admin = JSON.parse(localStorage.getItem("admin"));

if (admin) {

    document.getElementById("adminName").textContent = admin.full_name;

    document.getElementById("adminRole").textContent = admin.role;

}

if (!token) {
    window.location = "login.html";
}

async function loadDashboard() {

    const res = await fetch(
        "http://localhost:5000/api/dashboard",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const data = await res.json();

    if (!data.success) {

        localStorage.clear();
        window.location = "login.html";
        return;
    }

    document.getElementById("products").innerHTML =
        data.data.totalProducts;

    document.getElementById("customers").innerHTML =
        data.data.totalCustomers;

    document.getElementById("available").innerHTML =
        data.data.availableProducts;

    document.getElementById("stock").innerHTML =
        data.data.outOfStock;
}

function logout() {

    localStorage.clear();

    window.location = "login.html";

}

loadDashboard();