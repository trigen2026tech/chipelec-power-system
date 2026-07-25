const token = localStorage.getItem("token");
const admin = JSON.parse(localStorage.getItem("admin"));

if (admin) {
    document.getElementById("adminName").textContent = admin.username;
    document.getElementById("adminRole").textContent = "Administrator";
}

async function loadDashboard() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/dashboard",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!result.success) {
            alert(result.message);
            return;
        }

        document.getElementById("totalProducts").innerText =
            result.data.products;

        document.getElementById("totalBrands").innerText =
            result.data.brands;

        document.getElementById("totalCustomers").innerText =
            result.data.customers;

        document.getElementById("totalInstallations").innerText =
            result.data.installations;

    } catch (err) {

        console.error(err);

    }

}

loadDashboard();