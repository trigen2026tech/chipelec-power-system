const token = localStorage.getItem("token");

let editingId = null;

async function loadCustomers() {

    const res = await fetch("http://localhost:5000/api/customers", {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    const result = await res.json();

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

async function loadServiceRequests() {

    const res = await fetch(
        "http://localhost:5000/api/service-requests",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await res.json();

    const table = document.getElementById("serviceTable");

    table.innerHTML = "";

    result.data.forEach(service => {

        table.innerHTML += `
        <tr>

            <td>${service.id}</td>

            <td>${service.customer_name}</td>

            <td>${service.request_type}</td>

            <td>${service.request_date}</td>

            <td>${service.service_status}</td>

            <td>${service.technician_name || "-"}</td>

            <td>₹${service.service_charge}</td>

            <td>

                <button onclick="editService(${service.id})">
                    Edit
                </button>

                <button onclick="deleteService(${service.id})">
                    Delete
                </button>

            </td>

        </tr>
        `;

    });

}

function showForm() {

    document.getElementById("serviceModal").style.display = "flex";

}

function closeModal() {

    document.getElementById("serviceModal").style.display = "none";

    editingId = null;

}

loadCustomers();
loadServiceRequests();

// ========================
// SAVE SERVICE REQUEST
// ========================

async function saveService() {

    if (editingId) {

        await updateService();

    } else {

        await addService();

    }

}

// ========================
// ADD SERVICE REQUEST
// ========================

async function addService() {

    const service = {
        customer_id: document.getElementById("customer_id").value,
        request_type: document.getElementById("request_type").value,
        request_date: document.getElementById("request_date").value,
        issue_description: document.getElementById("issue_description").value,
        service_status: document.getElementById("service_status").value,
        technician_name: document.getElementById("technician_name").value,
        service_charge: document.getElementById("service_charge").value,
        completed_date: document.getElementById("completed_date").value || null
    };

    const res = await fetch(
        "http://localhost:5000/api/service-requests",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(service)
        }
    );

    const result = await res.json();

    alert(result.message);

    if (result.success) {
        closeModal();
        loadServiceRequests();
    }

}

// ========================
// EDIT SERVICE REQUEST
// ========================

async function editService(id) {

    editingId = id;

    const res = await fetch(
        `http://localhost:5000/api/service-requests/${id}`,
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await res.json();

    if (!result.success) {
        alert(result.message);
        return;
    }

    const service = result.data;

    document.getElementById("customer_id").value = service.customer_id;
    document.getElementById("request_type").value = service.request_type;
    document.getElementById("request_date").value = service.request_date;
    document.getElementById("issue_description").value = service.issue_description;
    document.getElementById("service_status").value = service.service_status;
    document.getElementById("technician_name").value = service.technician_name;
    document.getElementById("service_charge").value = service.service_charge;
    document.getElementById("completed_date").value = service.completed_date || "";

    showForm();

}

// ========================
// UPDATE SERVICE REQUEST
// ========================

async function updateService() {

    const service = {
        customer_id: document.getElementById("customer_id").value,
        request_type: document.getElementById("request_type").value,
        request_date: document.getElementById("request_date").value,
        issue_description: document.getElementById("issue_description").value,
        service_status: document.getElementById("service_status").value,
        technician_name: document.getElementById("technician_name").value,
        service_charge: document.getElementById("service_charge").value,
        completed_date: document.getElementById("completed_date").value || null
    };

    const res = await fetch(
        `http://localhost:5000/api/service-requests/${editingId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(service)
        }
    );

    const result = await res.json();

    alert(result.message);

    if (result.success) {

        editingId = null;

        closeModal();

        loadServiceRequests();

    }

}

// ========================
// DELETE SERVICE REQUEST
// ========================

async function deleteService(id) {

    if (!confirm("Delete this service request?")) return;

    const res = await fetch(
        `http://localhost:5000/api/service-requests/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await res.json();

    alert(result.message);

    if (result.success) {
        loadServiceRequests();
    }

}