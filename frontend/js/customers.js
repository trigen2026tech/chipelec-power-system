const token = localStorage.getItem("token");

let editingCustomer = null;

// ----------------------------
// LOAD CUSTOMERS
// ----------------------------
async function loadCustomers() {

    const response = await fetch(
        "http://localhost:5000/api/customers",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("customerTable");

    table.innerHTML = "";

    result.data.forEach(customer => {

        table.innerHTML += `

        <tr>

            <td>${customer.id}</td>
            <td>${customer.full_name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || "-"}</td>
            <td>${customer.city || "-"}</td>
            <td>${customer.state || "-"}</td>

            <td>

                <button onclick="editCustomer(${customer.id})">
                    ✏️ Edit
                </button>

                <button onclick="deleteCustomer(${customer.id})">
                    🗑 Delete
                </button>

            </td>

        </tr>

        `;

    });

}

loadCustomers();


// ----------------------------
// SHOW MODAL
// ----------------------------
function showForm() {

    document.getElementById("customerModal").style.display = "flex";

}

// ----------------------------
// CLOSE MODAL
// ----------------------------
function closeModal() {

    document.getElementById("customerModal").style.display = "none";

    clearForm();

}

// ----------------------------
// CLEAR FORM
// ----------------------------
function clearForm() {

    editingCustomer = null;

    document.getElementById("full_name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("address").value = "";
    document.getElementById("city").value = "";
    document.getElementById("state").value = "";
    document.getElementById("pincode").value = "";

}


// ----------------------------
// SAVE CUSTOMER
// ----------------------------
async function saveCustomer(){

    if(editingCustomer){

        updateCustomer();

    }

    else{

        addCustomer();

    }

}

// ----------------------------
// ADD CUSTOMER
// ----------------------------
async function addCustomer() {

    const customer = {
        full_name: document.getElementById("full_name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        pincode: document.getElementById("pincode").value
    };

    const response = await fetch(
        "http://localhost:5000/api/customers",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(customer)
        }
    );

    const result = await response.json();

    alert(result.message);

    if(result.success){

        closeModal();

        loadCustomers();

    }

}

// ----------------------------
// EDIT CUSTOMER
// ----------------------------
async function editCustomer(id){

    editingCustomer = id;

    const response = await fetch(
        `http://localhost:5000/api/customers/${id}`
    );

    const result = await response.json();

    const c = result.data;

    document.getElementById("full_name").value = c.full_name;
    document.getElementById("phone").value = c.phone;
    document.getElementById("email").value = c.email;
    document.getElementById("address").value = c.address;
    document.getElementById("city").value = c.city;
    document.getElementById("state").value = c.state;
    document.getElementById("pincode").value = c.pincode;

    showForm();

}

// ----------------------------
// UPDATE CUSTOMER
// ----------------------------
async function updateCustomer(){

    const customer = {
        full_name: document.getElementById("full_name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        pincode: document.getElementById("pincode").value
    };

    const response = await fetch(
        `http://localhost:5000/api/customers/${editingCustomer}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(customer)
        }
    );

    const result = await response.json();

    alert(result.message);

    if(result.success){

        editingCustomer=null;

        closeModal();

        loadCustomers();

    }

}

// ----------------------------
// DELETE CUSTOMER
// ----------------------------
async function deleteCustomer(id){

    if(!confirm("Delete this customer?")) return;

    const response = await fetch(
        `http://localhost:5000/api/customers/${id}`,
        {
            method:"DELETE"
        }
    );

    const result = await response.json();

    alert(result.message);

    loadCustomers();

}