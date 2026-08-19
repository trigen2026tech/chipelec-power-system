// Note: token is handled in auth.js
let editingProductId = null;
let allProducts = []; // For search filtering

async function loadProducts() {
    try {
        const response = await fetch("https://chipelec-power-system-production.up.railway.app/api/products", {
            headers: { Authorization: "Bearer " + token }
        });

        const result = await response.json();
        allProducts = result.data || [];
        renderTable(allProducts);

    } catch (err) {
        console.error(err);
        if(window.showToast) window.showToast('Failed to load products', 'error');
        document.getElementById("productTable").innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 30px; color: #e11d48;">
                <i class="bi bi-exclamation-triangle" style="font-size: 24px;"></i><br>
                Failed to load data
            </td></tr>`;
    }
}

function renderTable(data) {
    const table = document.getElementById("productTable");
    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state-content">
                        <i class="bi bi-box-seam"></i>
                        <p>No products found.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    data.forEach(product => {
        table.innerHTML += `
        <tr>
            <td>
                <img src="https://chipelec-power-system-production.up.railway.app/uploads/${product.image || 'no-image.png'}" alt="${product.product_name}" onerror="this.src='https://placehold.co/100x100?text=No+Image'">
            </td>
            <td style="font-weight: 500;">${product.product_name}</td>
            <td><span class="badge-status badge-info">${product.brand_name || '-'}</span></td>
            <td><span class="badge-status badge-primary">${product.category_name || '-'}</span></td>
            <td class="price-column">₹${product.price.toLocaleString()}</td>
            <td>
                <span style="font-weight: 600; color: ${product.stock_quantity < 10 ? '#e11d48' : '#059669'}">
                    ${product.stock_quantity}
                </span>
            </td>
            <td class="actions">
                <button class="btn-icon edit" onclick="editProduct(${product.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.product_name.toLowerCase().includes(term) || 
        (p.brand_name && p.brand_name.toLowerCase().includes(term)) ||
        (p.category_name && p.category_name.toLowerCase().includes(term))
    );
    renderTable(filtered);
});

async function loadBrands() {
    const response = await fetch("https://chipelec-power-system-production.up.railway.app/api/brands", {
        headers: { Authorization: "Bearer " + token }
    });
    const result = await response.json();
    const brand = document.getElementById("brand_id");
    brand.innerHTML = '<option value="">Select Brand</option>';
    result.data.forEach(item => {
        brand.innerHTML += `<option value="${item.id}">${item.brand_name}</option>`;
    });
}

async function loadCategories() {
    const response = await fetch("https://chipelec-power-system-production.up.railway.app/api/categories", {
        headers: { Authorization: "Bearer " + token }
    });
    const result = await response.json();
    const category = document.getElementById("category_id");
    category.innerHTML = '<option value="">Select Category</option>';
    result.data.forEach(item => {
        category.innerHTML += `<option value="${item.id}">${item.category_name}</option>`;
    });
}

loadProducts();

async function addProduct() {
    // Form validation
    const name = document.getElementById("product_name").value;
    const brandId = document.getElementById("brand_id").value;
    const categoryId = document.getElementById("category_id").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock_quantity").value;

    if (!name || !brandId || !categoryId || !price || !stock) {
        if(window.showToast) window.showToast('Please fill all required fields (*)', 'warning');
        else alert('Please fill all required fields');
        return;
    }

    const product = {
        product_name: name,
        model_number: document.getElementById("model_number").value,
        capacity: document.getElementById("capacity").value,
        warranty: document.getElementById("warranty").value,
        price: price,
        stock_quantity: stock,
        description: document.getElementById("description").value,
        brand_id: brandId,
        category_id: categoryId
    };

    const response = await fetch("https://chipelec-power-system-production.up.railway.app/api/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify(product)
    });

    const result = await response.json();

    if (result.success) {
        if(window.showToast) window.showToast('Product added successfully!');
        loadProducts();
        closeModal();
    } else {
        if(window.showToast) window.showToast(result.message, 'error');
    }
}

async function showForm() {
    document.getElementById("modalTitle").innerHTML = '<i class="bi bi-plus-circle"></i> Add New Product';
    
    // Bug Fix: Need to load dropdowns for Add form too
    await loadBrands();
    await loadCategories();
    
    document.getElementById("productModal").style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("productModal");
    if (event.target === modal) {
        closeModal();
    }
};

async function deleteProduct(id) {
    const product = allProducts.find(p => p.id === id);
    const productName = product ? product.product_name : 'this product';
    const modelNumber = product && product.model_number ? ` (Model: ${product.model_number})` : '';
    
    if (!confirm(`Are you sure you want to delete ${productName}${modelNumber}?`)) {
        return;
    }

    try {
        const response = await fetch(`https://chipelec-power-system-production.up.railway.app/api/products/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });

        const result = await response.json();

        if (response.ok && result && result.success) {
            if(window.showToast) window.showToast(result.message || 'Product deleted successfully');
            loadProducts();
        } else {
            if(window.showToast) window.showToast(result.message || 'Error deleting product', 'error');
        }
    } catch (error) {
        console.error(error);
        if(window.showToast) window.showToast("Unable to connect to the server.", 'error');
    }
}

async function editProduct(id) {
    editingProductId = id;
    document.getElementById("modalTitle").innerHTML = '<i class="bi bi-pencil-square"></i> Edit Product';

    const response = await fetch(`https://chipelec-power-system-production.up.railway.app/api/products/${id}`, {
        headers: { Authorization: "Bearer " + token }
    });

    const result = await response.json();

    if (!result.success) {
        if(window.showToast) window.showToast(result.message, 'error');
        return;
    }

    const product = result.data;

    // Load dropdowns before selecting values
    await loadBrands();
    await loadCategories();

    document.getElementById("product_name").value = product.product_name;
    document.getElementById("model_number").value = product.model_number || "";
    document.getElementById("capacity").value = product.capacity || "";
    document.getElementById("warranty").value = product.warranty || "";
    document.getElementById("price").value = product.price;
    document.getElementById("stock_quantity").value = product.stock_quantity;
    document.getElementById("description").value = product.description || "";
    document.getElementById("brand_id").value = product.brand_id;
    document.getElementById("category_id").value = product.category_id;

    document.getElementById("productModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

async function saveProduct() {
    if (editingProductId) {
        await updateProduct();
    } else {
        await addProduct();
    }
}

async function updateProduct() {
    // Form validation
    const name = document.getElementById("product_name").value;
    const brandId = document.getElementById("brand_id").value;
    const categoryId = document.getElementById("category_id").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock_quantity").value;

    if (!name || !brandId || !categoryId || !price || !stock) {
        if(window.showToast) window.showToast('Please fill all required fields (*)', 'warning');
        return;
    }

    const product = {
        product_name: name,
        model_number: document.getElementById("model_number").value,
        capacity: document.getElementById("capacity").value,
        warranty: document.getElementById("warranty").value,
        price: price,
        stock_quantity: stock,
        description: document.getElementById("description").value,
        brand_id: brandId,
        category_id: categoryId,
        status: "Available"
    };

    const response = await fetch(`https://chipelec-power-system-production.up.railway.app/api/products/${editingProductId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify(product)
    });

    const result = await response.json();

    if (result.success) {
        if(window.showToast) window.showToast('Product updated successfully!');
        editingProductId = null;
        closeModal();
        loadProducts();
    } else {
        if(window.showToast) window.showToast(result.message, 'error');
    }
}
