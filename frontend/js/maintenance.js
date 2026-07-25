const maintenanceToken = localStorage.getItem("token");

let editingMaintenance = null;

// ----------------------------
// LOAD MAINTENANCE
// ----------------------------
async function loadMaintenance() {

    const response = await fetch(
        "http://localhost:5000/api/maintenance",
        {
            headers: {
                Authorization: "Bearer " + maintenanceToken
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("maintenanceTable");

    table.innerHTML = "";

    result.data.forEach(item => {

        table.innerHTML += `

        <tr>

            <td>${item.id}</td>
            <td>${item.customer_name}</td>
            <td>${item.product_name}</td>
            <td>${item.maintenance_date}</td>
            <td>${item.maintenance_type}</td>
            <td>${item.technician_name || "-"}</td>
            <td>${item.status}</td>

            <td>

                <button onclick="editMaintenance(${item.id})">
                    ✏️
                </button>

                <button onclick="deleteMaintenance(${item.id})">
                    🗑
                </button>

            </td>

        </tr>

        `;

    });

}

loadMaintenance();

function showForm() {

    document.getElementById("maintenanceModal").style.display = "flex";

    loadCustomers();
    loadProducts();

}

function closeModal() {

    document.getElementById("maintenanceModal").style.display = "none";

}

// ----------------------------
// LOAD CUSTOMERS
// ----------------------------
async function loadCustomers() {

    const response = await fetch(
        "http://localhost:5000/api/customers"
    );

    const result = await response.json();

    const customer = document.getElementById("customer_id");

    customer.innerHTML = "";

    result.data.forEach(c => {

        customer.innerHTML += `
            <option value="${c.id}">
                ${c.full_name}
            </option>
        `;

    });

}

// ----------------------------
// LOAD PRODUCTS
// ----------------------------
async function loadProducts() {

    const response = await fetch(
        "http://localhost:5000/api/products"
    );

    const result = await response.json();

    const product = document.getElementById("product_id");

    product.innerHTML = "";

    result.data.forEach(p => {

        product.innerHTML += `
            <option value="${p.id}">
                ${p.product_name}
            </option>
        `;

    });

}

// ----------------------------
// SAVE MAINTENANCE
// ----------------------------
async function saveMaintenance() {

    if (editingMaintenance) {

        await updateMaintenance();

    } else {

        await addMaintenance();

    }

}

// ----------------------------
// ADD MAINTENANCE
// ----------------------------
async function addMaintenance() {

    const maintenance = {

        customer_id: document.getElementById("customer_id").value,
        product_id: document.getElementById("product_id").value,
        maintenance_date: document.getElementById("maintenance_date").value,
        maintenance_type: document.getElementById("maintenance_type").value,
        technician_name: document.getElementById("technician_name").value,
        status: document.getElementById("status").value,
        remarks: document.getElementById("remarks").value

    };

    const response = await fetch(
        "http://localhost:5000/api/maintenance",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + maintenanceToken
            },

            body: JSON.stringify(maintenance)

        }
    );

    const result = await response.json();

    alert(result.message);

    if(result.success){

        closeModal();

        loadMaintenance();

    }

}

// ----------------------------
// EDIT MAINTENANCE
// ----------------------------
async function editMaintenance(id) {

    editingMaintenance = id;

    const response = await fetch(
        `http://localhost:5000/api/maintenance/${id}`,
        {
            headers: {
                Authorization: "Bearer " + maintenanceToken
            }
        }
    );

    const result = await response.json();

    if (!result.success) {
        alert(result.message);
        return;
    }

    const maintenance = result.data;

    document.getElementById("customer_id").value = maintenance.customer_id;
    document.getElementById("product_id").value = maintenance.product_id;
    document.getElementById("maintenance_date").value = maintenance.maintenance_date;
    document.getElementById("maintenance_type").value = maintenance.maintenance_type;
    document.getElementById("technician_name").value = maintenance.technician_name;
    document.getElementById("status").value = maintenance.status;
    document.getElementById("remarks").value = maintenance.remarks;

    showForm();

}

// ----------------------------
// UPDATE MAINTENANCE
// ----------------------------
async function updateMaintenance() {

    const maintenance = {
        customer_id: document.getElementById("customer_id").value,
        product_id: document.getElementById("product_id").value,
        maintenance_date: document.getElementById("maintenance_date").value,
        maintenance_type: document.getElementById("maintenance_type").value,
        technician_name: document.getElementById("technician_name").value,
        status: document.getElementById("status").value,
        remarks: document.getElementById("remarks").value
    };

    const response = await fetch(
        `http://localhost:5000/api/maintenance/${editingMaintenance}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + maintenanceToken
            },
            body: JSON.stringify(maintenance)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        editingMaintenance = null;

        closeModal();

        loadMaintenance();

    }

}

// ----------------------------
// DELETE MAINTENANCE
// ----------------------------
async function deleteMaintenance(id) {

    if (!confirm("Delete this maintenance record?")) return;

    const response = await fetch(
        `http://localhost:5000/api/maintenance/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + maintenanceToken
            }
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {
        loadMaintenance();
    }

}