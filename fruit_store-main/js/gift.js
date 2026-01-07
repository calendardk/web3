/**
 * Gift Page JavaScript (Updated)
 * Handles gift product display, filtering, sorting and pagination
 */

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 16;
const STORAGE_KEY = "clean_fruit_products";

/**
 * Initialize the page
 */
async function initGiftPage() {
  try {
    showLoading();

    let dataProducts = [];

    // BƯỚC 1: Kiểm tra kho (LocalStorage)
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      console.log("Gift Page: Load dữ liệu từ LocalStorage");
      dataProducts = JSON.parse(storedData);
    } else {
      console.log("Gift Page: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      if (!response.ok) throw new Error("Cannot load products data");

      const data = await response.json();
      dataProducts = data.products;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataProducts));
    }

    // BƯỚC 2: Chỉ lấy sản phẩm có tag 'gift'
    allProducts = dataProducts.filter((p) => p.tags && p.tags.includes("gift"));

    // Tự động tính discount nếu có
    allProducts = allProducts.map((product) => {
      if (product.newPrice && product.oldPrice && !product.discount) {
        product.discount = calculateDiscount(
          product.oldPrice,
          product.newPrice
        );
      }
      return product;
    });

    // Initialize filtered products
    filteredProducts = [...allProducts];

    // Setup UI
    setupFilters();
    renderProducts(currentPage);
    renderPagination();
    updateProductCount();
    setupLiveSearch(); // Kích hoạt tìm kiếm

    console.log("Gift page loaded successfully");
  } catch (error) {
    console.error("Error loading gift page:", error);
    showError();
  }
}

function calculateDiscount(oldPrice, newPrice) {
  if (!oldPrice || !newPrice) return null;
  const oldPriceNum = parseFloat(oldPrice.replace(/[^0-9]/g, ""));
  const newPriceNum = parseFloat(newPrice.replace(/[^0-9]/g, ""));
  if (oldPriceNum <= newPriceNum) return null;
  return `-${Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100)}%`;
}

/**
 * Setup filter event listeners
 */
function setupFilters() {
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");

  if (priceFilter) priceFilter.addEventListener("change", applyFilters);
  if (sortFilter) sortFilter.addEventListener("change", applyFilters);
}

/**
 * Apply filters and sorting
 */
function applyFilters() {
  const selectedPrice = document.getElementById("price-filter")?.value || "all";
  const selectedSort =
    document.getElementById("sort-filter")?.value || "default";

  // Filter by price logic for Gift
  if (selectedPrice === "all") {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter((p) => {
      const price = getProductPrice(p);
      switch (selectedPrice) {
        case "under-1m":
          return price < 1000000;
        case "1m-2m":
          return price >= 1000000 && price <= 2000000;
        case "above-2m":
          return price > 2000000;
        default:
          return true;
      }
    });
  }

  // Sort logic
  if (selectedSort === "price-asc")
    filteredProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  else if (selectedSort === "price-desc")
    filteredProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  else if (selectedSort === "name-asc")
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (selectedSort === "name-desc")
    filteredProducts.sort((a, b) => b.name.localeCompare(a.name));

  currentPage = 1;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

function getProductPrice(product) {
  const priceStr = product.newPrice || product.price || "0";
  return parseFloat(priceStr.replace(/[^0-9]/g, ""));
}

function getTotalPages() {
  return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
}

function updateProductCount() {
  const countElement = document.getElementById("product-count");
  if (!countElement) return;

  const total = filteredProducts.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

  countElement.textContent =
    total === 0
      ? "Không có sản phẩm"
      : `Hiển thị ${start}-${end} trong ${total} sản phẩm`;
}

/**
 * Render products
 */
function renderProducts(page) {
  const productGrid = document.getElementById("product-grid");
  if (!productGrid) return;

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const items = filteredProducts.slice(start, end);

  if (items.length === 0) {
    productGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-gift"></i>
            <p>Không tìm thấy giỏ quà nào</p>
        </div>`;
    return;
  }

  productGrid.innerHTML = items
    .map((product) => createProductCard(product))
    .join("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createProductCard(product) {
  const detailLink = `product-detail.html?id=${product.id}`;

  // Logic hiển thị giá
  const hasSale = product.newPrice && product.oldPrice;
  let priceHTML = "";

  if (hasSale) {
    priceHTML = `
        <span class="new-price">${product.newPrice}</span>
        <span class="old-price">${product.oldPrice}</span>
        ${
          product.discount
            ? `<span class="discount-badge">${product.discount}</span>`
            : ""
        }
    `;
  } else {
    priceHTML = `<span class="new-price">${
      product.price || product.newPrice || "Liên hệ"
    }</span>`;
    // Chỉ thêm badge nếu không phải sale
    if (product.tags?.includes("gift"))
      priceHTML += `<span class="gift-badge">🎁 GIFT</span>`;
    else if (product.tags?.includes("flash-sale"))
      priceHTML += `<span class="bestseller-badge">⚡ SALE</span>`;
  }

  let cardClass = product.tags?.includes("flash-sale")
    ? "flash-sale"
    : "gift-card";

  return `
        <div class="product-card ${cardClass}">
            <div class="product-img">
                <a href="${detailLink}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </a>
            </div>
            <div class="product-info">
                <div class="product-name">
                    <a href="${detailLink}">${product.name}</a>
                </div>
                <div class="product-price">${priceHTML}</div>
                <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name}')">
                    🎁 Thêm vào giỏ
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

// Hàm thêm giỏ hàng an toàn
function addToCart(productId, productName) {
  const product = allProducts.find((p) => p.id === productId);

  if (!product) {
    alert("Lỗi: Không tìm thấy thông tin sản phẩm!");
    return;
  }

  const price = product.newPrice || product.price || "0₫";
  const image = product.image || "img/placeholder.jpg";

  if (typeof CartManager !== "undefined") {
    // Thêm số lượng 1
    CartManager.addToCart(productId, product.name, price, image, 1);
  } else {
    alert("Lỗi: Hệ thống giỏ hàng chưa tải xong. Vui lòng F5 lại trang!");
  }
}

function showLoading() {
  const grid = document.getElementById("product-grid");
  if (grid)
    grid.innerHTML = `<div class="loading-state"><p>Đang tải dữ liệu...</p></div>`;
}

function showError() {
  const grid = document.getElementById("product-grid");
  if (grid)
    grid.innerHTML = `<div class="empty-state"><p>Lỗi kết nối dữ liệu.</p></div>`;
}

// Chức năng tìm kiếm nhanh
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
            </a>
        `
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

document.addEventListener("DOMContentLoaded", initGiftPage);
