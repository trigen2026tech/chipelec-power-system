const token = localStorage.getItem("token");

let currentReport = null;

// ========================
// SHOW SALES REPORT
// ========================

function showSalesReport() {

    hideAllReports();
    document.getElementById("salesReportSection").style.display = "block";
    currentReport = "sales";
    generateSalesReport();

}

// ========================
// SHOW CUSTOMER REPORT
// ========================

function showCustomerReport() {

    hideAllReports();
    document.getElementById("customerReportSection").style.display = "block";
    currentReport = "customer";
    generateCustomerReport();

}

// ========================
// SHOW MAINTENANCE REPORT
// ========================

function showMaintenanceReport() {

    hideAllReports();
    document.getElementById("maintenanceReportSection").style.display = "block";
    currentReport = "maintenance";
    generateMaintenanceReport();

}

// ========================
// SHOW INVENTORY REPORT
// ========================

function showInventoryReport() {

    hideAllReports();
    document.getElementById("inventoryReportSection").style.display = "block";
    currentReport = "inventory";
    generateInventoryReport();

}

// ========================
// HIDE ALL REPORTS
// ========================

function hideAllReports() {

    document.getElementById("salesReportSection").style.display = "none";
    document.getElementById("customerReportSection").style.display = "none";
    document.getElementById("maintenanceReportSection").style.display = "none";
    document.getElementById("inventoryReportSection").style.display = "none";

}

// ========================
// GENERATE SALES REPORT
// ========================

async function generateSalesReport() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/sales",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            return;
        }

        const sales = result.data;

        let totalSales = 0;
        let totalRevenue = 0;

        const tableBody = document.getElementById("salesTableBody");
        tableBody.innerHTML = "";

        if (sales.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6' class='no-data'>No sales data available</td></tr>";
        } else {

            sales.forEach(sale => {
                totalSales++;
                totalRevenue += sale.total_amount;

                const row = `
                    <tr>
                        <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td>${sale.customer_name}</td>
                        <td>${sale.product_name}</td>
                        <td>${sale.quantity}</td>
                        <td>₹${sale.total_amount.toLocaleString()}</td>
                        <td>${sale.payment_status}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

        }

        document.getElementById("totalSales").textContent = totalSales;
        document.getElementById("totalRevenue").textContent = "₹" + totalRevenue.toLocaleString();
        document.getElementById("avgTransaction").textContent = totalSales > 0 ? "₹" + (totalRevenue / totalSales).toLocaleString() : "₹0";

    } catch (err) {

        console.error(err);

    }

}

// ========================
// GENERATE CUSTOMER REPORT
// ========================

async function generateCustomerReport() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/customers",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            return;
        }

        const customers = result.data;

        const tableBody = document.getElementById("customerTableBody");
        tableBody.innerHTML = "";

        if (customers.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' class='no-data'>No customer data available</td></tr>";
        } else {

            customers.forEach(customer => {
                const row = `
                    <tr>
                        <td>${customer.full_name}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.email || "-"}</td>
                        <td>${customer.city || "-"}</td>
                        <td>-</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

        }

        document.getElementById("totalCustomers").textContent = customers.length;
        document.getElementById("activeCustomers").textContent = customers.length;

    } catch (err) {

        console.error(err);

    }

}

// ========================
// GENERATE MAINTENANCE REPORT
// ========================

async function generateMaintenanceReport() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/maintenance",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            return;
        }

        const maintenance = result.data;

        let completed = 0;
        let pending = 0;

        const tableBody = document.getElementById("maintenanceTableBody");
        tableBody.innerHTML = "";

        if (maintenance.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6' class='no-data'>No maintenance data available</td></tr>";
        } else {

            maintenance.forEach(item => {

                if (item.status === "Completed") completed++;
                if (item.status === "Pending") pending++;

                const row = `
                    <tr>
                        <td>${new Date(item.maintenance_date).toLocaleDateString()}</td>
                        <td>${item.customer_name}</td>
                        <td>${item.product_name}</td>
                        <td>${item.maintenance_type}</td>
                        <td>${item.status}</td>
                        <td>${item.technician_name || "-"}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

        }

        document.getElementById("totalMaintenance").textContent = maintenance.length;
        document.getElementById("completedMaintenance").textContent = completed;
        document.getElementById("pendingMaintenance").textContent = pending;

    } catch (err) {

        console.error(err);

    }

}

// ========================
// GENERATE INVENTORY REPORT
// ========================

async function generateInventoryReport() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/products",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            return;
        }

        const products = result.data;

        let totalProducts = 0;
        let lowStockItems = 0;
        let totalValue = 0;

        const tableBody = document.getElementById("inventoryTableBody");
        tableBody.innerHTML = "";

        if (products.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7' class='no-data'>No product data available</td></tr>";
        } else {

            products.forEach(product => {

                totalProducts++;
                const value = product.stock_quantity * product.price;
                totalValue += value;

                if (product.stock_quantity < 10) {
                    lowStockItems++;
                }

                const row = `
                    <tr>
                        <td>${product.product_name}</td>
                        <td>${product.brand_name}</td>
                        <td>${product.category_name}</td>
                        <td>${product.stock_quantity}</td>
                        <td>₹${product.price.toLocaleString()}</td>
                        <td>₹${value.toLocaleString()}</td>
                        <td>${product.stock_quantity < 10 ? '<span style="color:red;">Low</span>' : 'OK'}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

        }

        document.getElementById("totalProducts").textContent = totalProducts;
        document.getElementById("lowStockItems").textContent = lowStockItems;
        document.getElementById("totalInventoryValue").textContent = "₹" + totalValue.toLocaleString();

    } catch (err) {

        console.error(err);

    }

}

// ========================
// EXPORT FUNCTIONS (Placeholder)
// ========================

function exportSalesPDF() {
    alert("PDF export feature coming soon!");
}

function exportSalesExcel() {
    alert("Excel export feature coming soon!");
}

function exportCustomerPDF() {
    alert("PDF export feature coming soon!");
}

function exportCustomerExcel() {
    alert("Excel export feature coming soon!");
}

function exportMaintenancePDF() {
    alert("PDF export feature coming soon!");
}

function exportMaintenanceExcel() {
    alert("Excel export feature coming soon!");
}

function exportInventoryPDF() {
    alert("PDF export feature coming soon!");
}

function exportInventoryExcel() {
    alert("Excel export feature coming soon!");
}

// Load reports on page load
window.addEventListener("DOMContentLoaded", () => {
    generateSalesReport();
});
