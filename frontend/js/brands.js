const token = localStorage.getItem("token");

let editingBrand = null;

async function loadBrands() {

    const response = await fetch(
        "http://localhost:5000/api/brands",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("brandTable");

    table.innerHTML = "";

    result.data.forEach(brand => {

        table.innerHTML += `

        <tr>

            <td>${brand.id}</td>

            <td>${brand.brand_name}</td>

            <td>

                <button onclick="editBrand(${brand.id}, '${brand.brand_name}')">
                    ✏️ Edit
                </button>

                <button onclick="deleteBrand(${brand.id})">
                    🗑 Delete
                </button>

            </td>

        </tr>

        `;

    });

}

loadBrands();

function showForm() {

    document.getElementById("brandModal").style.display = "flex";

}

function closeModal() {

    document.getElementById("brandModal").style.display = "none";

    document.getElementById("brand_name").value = "";

    editingBrand = null;

}

async function saveBrand() {

    if (editingBrand) {

        return updateBrand();

    }

    const brand = {
        brand_name: document.getElementById("brand_name").value
    };

    const response = await fetch(
        "http://localhost:5000/api/brands",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(brand)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        closeModal();

        loadBrands();

    }

}

function editBrand(id, name) {

    editingBrand = id;

    document.getElementById("brand_name").value = name;

    showForm();

}

async function updateBrand() {

    const response = await fetch(
        `http://localhost:5000/api/brands/${editingBrand}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                brand_name: document.getElementById("brand_name").value
            })
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        closeModal();

        loadBrands();

    }

}

async function deleteBrand(id) {

    if (!confirm("Delete this brand?")) return;

    const response = await fetch(
        `http://localhost:5000/api/brands/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    alert(result.message);

    loadBrands();

}