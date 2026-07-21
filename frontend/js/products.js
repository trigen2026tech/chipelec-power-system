

async function loadProducts() {

    const response = await fetch(
        "http://localhost:5000/api/products",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const result = await response.json();

    const table = document.getElementById("productTable");

    table.innerHTML = "";

    result.data.forEach(product => {

        table.innerHTML += `

        <tr>

            <td>
                <img
                src="http://localhost:5000/uploads/${product.image || 'no-image.png'}"
                width="70">
            </td>

            <td>${product.product_name}</td>

            <td>${product.brand_name}</td>

            <td>${product.category_name}</td>

            <td>₹${product.price}</td>

            <td>${product.stock_quantity}</td>
            <td>

    <button onclick="editProduct(${product.id})">
        ✏️ Edit
    </button>

    <button onclick="deleteProduct(${product.id})">
        🗑 Delete
    </button>

</td>

        </tr>

        `;

    });

}

loadProducts();

async function addProduct() {

    const product = {

        product_name:
            document.getElementById("product_name").value,

        model_number:
            document.getElementById("model_number").value,

        capacity:
            document.getElementById("capacity").value,

        warranty:
            document.getElementById("warranty").value,

        price:
            document.getElementById("price").value,

        stock_quantity:
            document.getElementById("stock_quantity").value,

        description:
            document.getElementById("description").value,

        brand_id:
            document.getElementById("brand_id").value,

        category_id:
            document.getElementById("category_id").value

    };

    const response = await fetch(
        "http://localhost:5000/api/products",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },

            body: JSON.stringify(product)

        }
    );

    const result = await response.json();

    if (result.success) {

        alert(result.message);

        loadProducts();

        closeModal();

    } else {

        alert(result.message);

    }

}

function showForm() {

    document.getElementById("productModal").style.display = "flex";

    document.body.style.overflow = "hidden";

}

function closeModal() {

    document.getElementById("productModal").style.display = "none";

    document.body.style.overflow = "auto";

    clearForm();

}

function clearForm() {

    document.getElementById("product_name").value = "";
    document.getElementById("model_number").value = "";
    document.getElementById("capacity").value = "";
    document.getElementById("warranty").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock_quantity").value = "";
    document.getElementById("description").value = "";
    document.getElementById("brand_id").selectedIndex = 0;
    document.getElementById("category_id").selectedIndex = 0;

    editingProductId = null;

}
window.onclick = function(event) {

    const modal = document.getElementById("productModal");

    if (event.target === modal) {

        closeModal();

    }

};
async function deleteProduct(id) {

    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/products/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        alert(result.message);

        if (response.ok) {
            loadProducts();
        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

}
let editingProductId = null;

async function editProduct(id) {

    editingProductId = id;

    const response = await fetch(
        `http://localhost:5000/api/products/${id}`,
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

    const product = result.data;

    document.getElementById("product_name").value = product.product_name;
    document.getElementById("model_number").value = product.model_number;
    document.getElementById("capacity").value = product.capacity;
    document.getElementById("warranty").value = product.warranty;
    document.getElementById("price").value = product.price;
    document.getElementById("stock_quantity").value = product.stock_quantity;
    document.getElementById("description").value = product.description;
    document.getElementById("brand_id").value = product.brand_id;
    document.getElementById("category_id").value = product.category_id;

    showForm();
    

}
async function saveProduct() {

    if (editingProductId) {

        await updateProduct();

    } else {

        await addProduct();

    }

}
async function updateProduct() {

    const product = {

        product_name: document.getElementById("product_name").value,
        model_number: document.getElementById("model_number").value,
        capacity: document.getElementById("capacity").value,
        warranty: document.getElementById("warranty").value,
        price: document.getElementById("price").value,
        stock_quantity: document.getElementById("stock_quantity").value,
        description: document.getElementById("description").value,
        brand_id: document.getElementById("brand_id").value,
        category_id: document.getElementById("category_id").value,
        status: "Available"

    };

    const response = await fetch(
        `http://localhost:5000/api/products/${editingProductId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(product)
        }
    );

    const result = await response.json();

    alert(result.message);

    if (result.success) {

        editingProductId = null;

        closeModal();

        loadProducts();

    }

}