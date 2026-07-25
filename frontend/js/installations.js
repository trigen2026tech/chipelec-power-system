const token = localStorage.getItem("token");

let editingInstallationId = null;

// ==========================
// Load Installations
// ==========================

async function loadInstallations() {

    const response = await fetch(
        "http://localhost:5000/api/installations",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("installationTable");

    table.innerHTML = "";

    result.data.forEach(item => {

        table.innerHTML += `
        <tr>
            <td>${item.customer_name}</td>
            <td>${item.product_name}</td>
            <td>${item.installation_date}</td>
            <td>${item.technician_name}</td>
            <td>${item.installation_status}</td>

            <td>
                <button onclick="editInstallation(${item.id})">✏️</button>
                <button onclick="deleteInstallation(${item.id})">🗑</button>
            </td>

        </tr>
        `;

    });

}

loadInstallations();


// ==========================
// Load Customers
// ==========================

async function loadCustomers() {

    const response = await fetch(
        "http://localhost:5000/api/customers",
        {
            headers:{
                Authorization:"Bearer " + token
            }
        }
    );

    const result = await response.json();

    const select=document.getElementById("customer_id");

    select.innerHTML="";

    result.data.forEach(customer=>{

        select.innerHTML +=
        `<option value="${customer.id}">
            ${customer.customer_name}
        </option>`;

    });

}


// ==========================
// Load Products
// ==========================

async function loadProducts(){

    const response=await fetch(
        "http://localhost:5000/api/products",
        {
            headers:{
                Authorization:"Bearer "+token
            }
        }
    );

    const result=await response.json();

    const select=document.getElementById("product_id");

    select.innerHTML="";

    result.data.forEach(product=>{

        select.innerHTML +=
        `<option value="${product.id}">
            ${product.product_name}
        </option>`;

    });

}

loadCustomers();
loadProducts();


// ==========================
// Modal
// ==========================

function showForm(){

    document.getElementById("installationModal").style.display="flex";

}

function closeModal(){

    document.getElementById("installationModal").style.display="none";

}


// ==========================
// Save
// ==========================

async function saveInstallation() {

    if (editingInstallationId) {

        await updateInstallation();

    } else {

        await addInstallation();

    }

}

// ==========================
// Add Installation
// ==========================

async function addInstallation() {

    const installation = {

        customer_id: document.getElementById("customer_id").value,
        product_id: document.getElementById("product_id").value,
        installation_date: document.getElementById("installation_date").value,
        technician_name: document.getElementById("technician_name").value,
        installation_address: document.getElementById("installation_address").value,
        installation_status: document.getElementById("installation_status").value,
        remarks: document.getElementById("remarks").value

    };

    const response = await fetch(
        "http://localhost:5000/api/installations",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(installation)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        closeModal();

        loadInstallations();

    }

}

// ==========================
// EDIT INSTALLATION
// ==========================

async function editInstallation(id) {

    editingInstallationId = id;

    const response = await fetch(
        `http://localhost:5000/api/installations/${id}`,
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

    const installation = result.data;

    document.getElementById("customer_id").value = installation.customer_id;
    document.getElementById("product_id").value = installation.product_id;
    document.getElementById("installation_date").value = installation.installation_date;
    document.getElementById("technician_name").value = installation.technician_name;
    document.getElementById("installation_address").value = installation.installation_address;
    document.getElementById("installation_status").value = installation.installation_status;
    document.getElementById("remarks").value = installation.remarks;

    showForm();

}

// ==========================
// UPDATE INSTALLATION
// ==========================

async function updateInstallation() {

    const installation = {
        customer_id: document.getElementById("customer_id").value,
        product_id: document.getElementById("product_id").value,
        installation_date: document.getElementById("installation_date").value,
        technician_name: document.getElementById("technician_name").value,
        installation_address: document.getElementById("installation_address").value,
        installation_status: document.getElementById("installation_status").value,
        remarks: document.getElementById("remarks").value
    };

    const response = await fetch(
        `http://localhost:5000/api/installations/${editingInstallationId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(installation)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        editingInstallationId = null;

        closeModal();

        loadInstallations();

    }

}

// ==========================
// DELETE INSTALLATION
// ==========================

async function deleteInstallation(id) {

    if (!confirm("Delete this installation?")) return;

    const response = await fetch(
        `http://localhost:5000/api/installations/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {
        loadInstallations();
    }

}