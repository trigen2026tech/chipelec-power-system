const token = localStorage.getItem("token");

let editingCategory = null;

// ----------------------------
// LOAD CATEGORIES
// ----------------------------
async function loadCategories() {

    const response = await fetch(
        "http://localhost:5000/api/categories",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("categoryTable");

    table.innerHTML = "";

    result.data.forEach(category => {

        table.innerHTML += `

        <tr>

            <td>${category.id}</td>

            <td>${category.category_name}</td>

            <td>

                <button onclick="editCategory(${category.id}, '${category.category_name}')">
                    ✏️ Edit
                </button>

                <button onclick="deleteCategory(${category.id})">
                    🗑 Delete
                </button>

            </td>

        </tr>

        `;

    });

}

loadCategories();

// ----------------------------
// SHOW MODAL
// ----------------------------
function showForm() {

    document.getElementById("categoryModal").style.display = "flex";

}

// ----------------------------
// CLOSE MODAL
// ----------------------------
function closeModal() {

    document.getElementById("categoryModal").style.display = "none";

    document.getElementById("category_name").value = "";

    editingCategory = null;

}

// ----------------------------
// SAVE CATEGORY
// ----------------------------
async function saveCategory() {

    if (editingCategory) {

        return updateCategory();

    }

    const category = {
        category_name: document.getElementById("category_name").value
    };

    const response = await fetch(
        "http://localhost:5000/api/categories",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(category)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        closeModal();

        loadCategories();

    }

}

// ----------------------------
// EDIT CATEGORY
// ----------------------------
function editCategory(id, name) {

    editingCategory = id;

    document.getElementById("category_name").value = name;

    showForm();

}

// ----------------------------
// UPDATE CATEGORY
// ----------------------------
async function updateCategory() {

    const response = await fetch(
        `http://localhost:5000/api/categories/${editingCategory}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                category_name: document.getElementById("category_name").value
            })
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        closeModal();

        loadCategories();

    }

}

// ----------------------------
// DELETE CATEGORY
// ----------------------------
async function deleteCategory(id) {

    if (!confirm("Delete this category?")) return;

    const response = await fetch(
        `http://localhost:5000/api/categories/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    alert(result.message);

    loadCategories();

}