const token = localStorage.getItem("token");
let editingSaleId = null;

async function loadSales() {
    const response = await fetch("http://localhost:5000/api/sales", {
        headers: { Authorization: "Bearer " + token }
    });

    const result = await response.json();
    const table = document.getElementById("salesTable");
    table.innerHTML = "";

    result.data.forEach(sale => {
        table.innerHTML += `
        <tr>
            <td>${sale.id}</td>
            <td>${sale.customer_name}</td>
            <td>${sale.product_name}</td>
            <td>${sale.quantity}</td>
            <td>₹${sale.unit_price}</td>
            <td>₹${sale.total_amount}</td>
            <td>${sale.sale_date}</td>
            <td>${sale.payment_status}</td>
            <td>
                <button onclick="editSale(${sale.id})">✏️</button>
                <button onclick="deleteSale(${sale.id})">🗑</button>
            </td>
        </tr>`;
    });
}

loadSales();

async function loadCustomers() {
    const response = await fetch("http://localhost:5000/api/customers", {
        headers: { Authorization: "Bearer " + token }
    });
    const result = await response.json();
    const select = document.getElementById("customer_id");
    select.innerHTML = "";
    result.data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.full_name}</option>`;
    });
}

async function loadProducts() {
    const response = await fetch("http://localhost:5000/api/products", {
        headers: { Authorization: "Bearer " + token }
    });
    const result = await response.json();
    const select = document.getElementById("product_id");
    select.innerHTML = "";
    result.data.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.product_name}</option>`;
    });
}

loadCustomers();
loadProducts();

function showForm() {
    document.getElementById("salesModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("salesModal").style.display = "none";
}

function calculateTotal() {
    const qty = parseFloat(document.getElementById("quantity").value) || 0;
    const price = parseFloat(document.getElementById("unit_price").value) || 0;
    document.getElementById("total_amount").value = qty * price;
}

document.getElementById("quantity").addEventListener("input", calculateTotal);
document.getElementById("unit_price").addEventListener("input", calculateTotal);

async function saveSale() {
    const sale = {
        customer_id: document.getElementById("customer_id").value,
        product_id: document.getElementById("product_id").value,
        quantity: document.getElementById("quantity").value,
        unit_price: document.getElementById("unit_price").value,
        total_amount: document.getElementById("total_amount").value,
        sale_date: document.getElementById("sale_date").value,
        payment_status: document.getElementById("payment_status").value
    };

    const response = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify(sale)
    });

    const result = await response.json();
    alert(result.message);

    if (result.success) {
        closeModal();
        loadSales();
    }
}