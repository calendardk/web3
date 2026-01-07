/**
 * All Products Page JavaScript (Updated)
 */

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 16;
const STORAGE_KEY = "clean_fruit_products";

async function initAllProductsPage() {
  try {
    showLoading();
    let dataProducts = [];

    // 1. Kiểm tra kho LocalStorage
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      console.log("AllProducts: Load dữ liệu từ LocalStorage");
      dataProducts = JSON.parse(storedData);
    } else {
      // 2. Nếu kho rỗng thì load file JSON
      console.log("AllProducts: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      if (!response.ok) throw new Error("Cannot load products data");
      const data = await response.json();
      dataProducts = data.products;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataProducts));
    }

    allProducts = dataProducts;

    // Tính discount nếu chưa có
    allProducts = allProducts.map((product) => {
      if (product.newPrice && product.oldPrice && !product.discount) {
        product.discount = calculateDiscount(
          product.oldPrice,
          product.newPrice
        );
      }
      return product;
    });

    filteredProducts = [...allProducts];

    setupFilters();
    checkURLParams();
    renderProducts(currentPage);
    renderPagination();
    updateProductCount();
    setupLiveSearch();
  } catch (error) {
    console.error("Error loading all products page:", error);
    showError();
  }
}

function checkURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  if (category) {
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
      categoryFilter.value = category;
      applyFilters();
    }
  }
}

function calculateDiscount(oldPrice, newPrice) {
  if (!oldPrice || !newPrice) return null;
  const oldPriceNum = parseFloat(oldPrice.replace(/[^0-9]/g, ""));
  const newPriceNum = parseFloat(newPrice.replace(/[^0-9]/g, ""));
  if (oldPriceNum <= newPriceNum) return null;
  return `-${Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100)}%`;
}

function setupFilters() {
  const ids = ["category-filter", "price-filter", "sort-filter"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", applyFilters);
  });
}

function applyFilters() {
  const category = document.getElementById("category-filter")?.value || "all";
  const price = document.getElementById("price-filter")?.value || "all";
  const sort = document.getElementById("sort-filter")?.value || "default";

  filteredProducts = [...allProducts];

  if (category !== "all") {
    filteredProducts = filteredProducts.filter((p) => p.category === category);
  }

  if (price !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      const pVal = getProductPrice(p);
      if (price === "under-500k") return pVal < 500000;
      if (price === "500k-1m") return pVal >= 500000 && pVal < 1000000;
      if (price === "1m-2m") return pVal >= 1000000 && pVal <= 2000000;
      if (price === "above-2m") return pVal > 2000000;
      return true;
    });
  }

  if (sort === "price-asc")
    filteredProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  else if (sort === "price-desc")
    filteredProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  else if (sort === "name-asc")
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name-desc")
    filteredProducts.sort((a, b) => b.name.localeCompare(a.name));

  currentPage = 1;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

function getProductPrice(product) {
  return parseFloat(
    (product.newPrice || product.price || "0").replace(/[^0-9]/g, "")
  );
}

function getTotalPages() {
  return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
}

function updateProductCount() {
  const el = document.getElementById("product-count");
  if (!el) return;
  const total = filteredProducts.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, total);
  el.textContent =
    total === 0
      ? "Không có sản phẩm"
      : `Hiển thị ${start}-${end} trong ${total} sản phẩm`;
}

function renderProducts(page) {
  const productGrid = document.getElementById("product-grid");
  if (!productGrid) return;

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const items = filteredProducts.slice(start, end);

  if (items.length === 0) {
    productGrid.innerHTML = `<div class="empty-state"><p>Không tìm thấy sản phẩm nào</p></div>`;
    return;
  }

  productGrid.innerHTML = items.map((p) => createProductCard(p)).join("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createProductCard(product) {
  const detailLink = `product-detail.html?id=${product.id}`;
  const priceHTML =
    product.newPrice && product.oldPrice
      ? `<span class="new-price">${product.newPrice}</span> <span class="old-price">${product.oldPrice}</span>`
      : `<span class="new-price">${product.price || product.newPrice}</span>`;

  return `
        <div class="product-card">
            <div class="product-img">
                <a href="${detailLink}"><img src="${product.image}" alt="${product.name}"></a>
            </div>
            <div class="product-info">
                <div class="product-name"><a href="${detailLink}">${product.name}</a></div>
                <div class="product-price">${priceHTML}</div>
                <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name}')">
                    Thêm vào giỏ
                </button>
            </div>
        </div>
    `;
}

function renderPagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
  const total = getTotalPages();
  if (total <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = `<button onclick="changePage(${currentPage - 1})" ${
    currentPage === 1 ? "disabled" : ""
  }>Trước</button>`;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `<div class="page-number ${
        i === currentPage ? "active" : ""
      }" onclick="changePage(${i})">${i}</div>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span>...</span>`;
    }
  }
  html += `<button onclick="changePage(${currentPage + 1})" ${
    currentPage === total ? "disabled" : ""
  }>Sau</button>`;
  pagination.innerHTML = html;
}

function changePage(page) {
  if (page < 1 || page > getTotalPages()) return;
  currentPage = page;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

// Hàm thêm giỏ hàng đã được sửa
function addToCart(productId, productName) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) {
    alert("Lỗi: Không tìm thấy sản phẩm!");
    return;
  }

  const price = product.newPrice || product.price || "0₫";
  const image = product.image || "img/placeholder.jpg";

  if (typeof CartManager !== "undefined") {
    CartManager.addToCart(productId, product.name, price, image, 1);
  } else {
    alert("Lỗi: CartManager chưa được tải. Hãy tải lại trang!");
  }
}

function showLoading() {
  const grid = document.getElementById("product-grid");
  if (grid)
    grid.innerHTML = `<div class="loading-state"><p>Đang tải...</p></div>`;
}

function showError() {
  const grid = document.getElementById("product-grid");
  if (grid)
    grid.innerHTML = `<div class="empty-state"><p>Lỗi tải dữ liệu.</p></div>`;
}

function setupLiveSearch() {
  const searchBox = document.querySelector(".search-box");
  const input = searchBox?.querySelector("input");
  if (!input) return;

  let container = document.querySelector(".search-results");
  if (!container) {
    container = document.createElement("div");
    container.className = "search-results";
    searchBox.appendChild(container);
  }

  input.addEventListener("input", (e) => {
    const key = e.target.value.toLowerCase().trim();
    if (key.length < 1) {
      container.classList.remove("active");
      return;
    }

    const matches = allProducts.filter((p) =>
      p.name.toLowerCase().includes(key)
    );
    if (matches.length > 0) {
      container.innerHTML = matches
        .map(
          (p) => `
        <a href="product-detail.html?id=${p.id}" class="search-item">
            <img src="${p.image}" alt="${p.name}">
            <div><span>${p.name}</span><br><span>${
            p.newPrice || p.price
          }</span></div>
        </a>`
        )
        .join("");
    } else {
      container.innerHTML = `<div class="search-item">Không tìm thấy sản phẩm</div>`;
    }
    container.classList.add("active");
  });

  document.addEventListener("click", (e) => {
    if (!searchBox.contains(e.target)) container.classList.remove("active");
  });
}

document.addEventListener("DOMContentLoaded", initAllProductsPage);
