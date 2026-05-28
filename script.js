// Inventory data
let products = [];
let editingId = null;

// DOM elements
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productQuantity = document.getElementById("productQuantity");
const productPrice = document.getElementById("productPrice");
const productReorder = document.getElementById("productReorder");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const inventoryBody = document.getElementById("inventoryBody");

// Stats spans
const totalProductsSpan = document.getElementById("totalProducts");
const lowStockCountSpan = document.getElementById("lowStockCount");
const totalValueSpan = document.getElementById("totalValue");

// Load initial data
function loadData() {
  const stored = localStorage.getItem("inventoryProducts");
  if (stored) {
    products = JSON.parse(stored);
  } else {
    // realistic demo data
    products = [
      {
        id: 101,
        name: "Ergonomic Chair",
        category: "Furniture",
        quantity: 12,
        price: 249.99,
        reorderLevel: 4,
      },
      {
        id: 102,
        name: "Wireless Mouse",
        category: "Electronics",
        quantity: 8,
        price: 29.99,
        reorderLevel: 5,
      },
      {
        id: 103,
        name: "Cotton T-Shirt",
        category: "Clothing",
        quantity: 3,
        price: 19.5,
        reorderLevel: 6,
      },
      {
        id: 104,
        name: "Stainless Pan",
        category: "Tools",
        quantity: 2,
        price: 45.0,
        reorderLevel: 3,
      },
    ];
  }
}

function saveToLocalStorage() {
  localStorage.setItem("inventoryProducts", JSON.stringify(products));
}

// Helper: get low stock count
function getLowStockCount() {
  return products.filter((p) => p.quantity <= p.reorderLevel).length;
}

// Helper: total inventory value
function getTotalValue() {
  return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
}

// Update stats cards
function updateStats() {
  totalProductsSpan.innerText = products.length;
  lowStockCountSpan.innerText = getLowStockCount();
  totalValueSpan.innerText = `$${getTotalValue().toFixed(2)}`;
}

// Filter & search logic
function getFilteredProducts() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;
  return products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "ALL" || p.category === category;
    return matchesSearch && matchesCategory;
  });
}

// Render product table
function renderTable() {
  const filtered = getFilteredProducts();
  if (filtered.length === 0) {
    inventoryBody.innerHTML =
      '<tr class="empty-row"><td colspan="8">No products match your filters.</td></tr>';
    updateStats();
    return;
  }
  inventoryBody.innerHTML = filtered
    .map((product) => {
      const isLowStock = product.quantity <= product.reorderLevel;
      const statusText = isLowStock ? " Low stock" : " In stock";
      const statusClass = isLowStock ? "status-low" : "status-ok";
      return `
            <tr data-id="${product.id}">
                <td>${product.id}</td>
                <td><strong>${escapeHtml(product.name)}</strong></td>
                <td>${escapeHtml(product.category)}</td>
                <td>${product.quantity}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.reorderLevel}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="btn-icon btn-edit" data-action="edit" data-id="${product.id}"> Edit</button>
                    <button class="btn-icon btn-delete" data-action="delete" data-id="${product.id}"> Delete</button>
                </td>
            </tr>
        `;
    })
    .join("");
  updateStats();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Reset form fields
function resetForm() {
  productName.value = "";
  productCategory.value = "Electronics";
  productQuantity.value = "0";
  productPrice.value = "";
  productReorder.value = "5";
  formMessage.innerText = "";
}

// Add or update product
function addOrUpdateProduct(e) {
  e.preventDefault();
  const name = productName.value.trim();
  const category = productCategory.value;
  const quantity = parseInt(productQuantity.value);
  const price = parseFloat(productPrice.value);
  const reorderLevel = parseInt(productReorder.value);

  if (!name) {
    formMessage.innerText = " Product name is required.";
    return;
  }
  if (isNaN(quantity) || quantity < 0) {
    formMessage.innerText = " Quantity must be a positive number.";
    return;
  }
  if (isNaN(price) || price < 0) {
    formMessage.innerText = " Price must be a positive number.";
    return;
  }
  if (isNaN(reorderLevel) || reorderLevel < 0) {
    formMessage.innerText = " Reorder level must be 0 or higher.";
    return;
  }
  formMessage.innerText = "";

  if (editingId !== null) {
    // update existing
    const index = products.findIndex((p) => p.id === editingId);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        category,
        quantity,
        price,
        reorderLevel,
      };
      editingId = null;
      submitBtn.innerText = " Add product";
      cancelEditBtn.style.display = "none";
      formTitle.innerText = " Add new product";
      resetForm();
    } else {
      editingId = null;
    }
  } else {
    // create new product with unique ID
    const newId = Date.now();
    products.push({
      id: newId,
      name,
      category,
      quantity,
      price,
      reorderLevel,
    });
    resetForm();
  }
  saveToLocalStorage();
  renderTable();
}

// Edit product
function startEditProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  editingId = product.id;
  productName.value = product.name;
  productCategory.value = product.category;
  productQuantity.value = product.quantity;
  productPrice.value = product.price;
  productReorder.value = product.reorderLevel;
  submitBtn.innerText = " Update product";
  cancelEditBtn.style.display = "inline-block";
  formTitle.innerText = " Edit product";
  formMessage.innerText = "";
  // smooth scroll
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
}

// Delete product
function deleteProductById(id) {
  if (confirm("Delete this product permanently?")) {
    products = products.filter((p) => p.id !== id);
    if (editingId === id) {
      cancelEdit();
    }
    saveToLocalStorage();
    renderTable();
    formMessage.innerText = " Product deleted.";
    setTimeout(() => {
      if (formMessage.innerText === " Product deleted.")
        formMessage.innerText = "";
    }, 2000);
  }
}

function cancelEdit() {
  editingId = null;
  resetForm();
  submitBtn.innerText = " Add product";
  cancelEditBtn.style.display = "none";
  formTitle.innerText = " Add new product";
  formMessage.innerText = "";
}

// Delete all products
function deleteAllProducts() {
  if (products.length === 0) return;
  if (confirm(" DELETE ALL PRODUCTS? This action cannot be undone.")) {
    products = [];
    if (editingId !== null) cancelEdit();
    saveToLocalStorage();
    renderTable();
    formMessage.innerText = " All products have been removed.";
    setTimeout(() => {
      if (formMessage.innerText === " All products have been removed.")
        formMessage.innerText = "";
    }, 2000);
  }
}

// Reset filters
function resetFilters() {
  searchInput.value = "";
  categoryFilter.value = "ALL";
  renderTable();
}

// Event delegation for edit/delete buttons in table
function handleTableActions(e) {
  const target = e.target;
  if (!target.classList || !target.classList.contains("btn-icon")) return;
  const action = target.getAttribute("data-action");
  const id = parseInt(target.getAttribute("data-id"));
  if (action === "edit") {
    startEditProduct(id);
  } else if (action === "delete") {
    deleteProductById(id);
  }
}

// Listeners and init
function initEventListeners() {
  document
    .getElementById("productForm")
    .addEventListener("submit", addOrUpdateProduct);
  cancelEditBtn.addEventListener("click", cancelEdit);
  deleteAllBtn.addEventListener("click", deleteAllProducts);
  resetFilterBtn.addEventListener("click", resetFilters);
  searchInput.addEventListener("input", () => renderTable());
  categoryFilter.addEventListener("change", () => renderTable());
  inventoryBody.addEventListener("click", handleTableActions);
}

function init() {
  loadData();
  renderTable();
  initEventListeners();
  resetForm();
}

init();
