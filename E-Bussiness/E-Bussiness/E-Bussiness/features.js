const FEATURE_API_BASE_URL = (
  window.OPHELIA_CONFIG?.apiBaseUrl ||
  window.OPHELIA_API_BASE_URL ||
  "http://localhost:5159/api"
).replace(/\/$/, "");
const FEATURE_WISHLIST_KEY = "wishlist";
const FEATURE_CATEGORIES = ["Rings", "Earrings", "Necklaces", "Bracelets", "Gifts"];
const FEATURE_PRODUCT_PAGE_URL = "Product Description-page.html";
const FEATURE_PRODUCT_DETAILS = [
  {
    id: 1,
    name: "Aura Diamond Band",
    price: 1850,
    category: "Rings",
    material: "18k Yellow Gold / Size 6",
    description: "Hand-finished diamond band with polished satin finish.",
    images: [
      "Photos/aura-diamond-band/1.jpg",
      "Photos/aura-diamond-band/2.jpg",
      "Photos/aura-diamond-band/3.jpg",
      "Photos/aura-diamond-band/4.jpg"
    ]
  },
  {
    id: 2,
    name: "Lumina Pearl Drops",
    price: 920,
    category: "Earrings",
    material: "18k Yellow Gold / Freshwater Pearl",
    description: "Freshwater pearl drops designed to catch the light with every movement.",
    images: [
      "Photos/lumina-pearl-drops/1.jpg",
      "Photos/lumina-pearl-drops/2.jpg",
      "Photos/lumina-pearl-drops/3.jpg",
      "Photos/lumina-pearl-drops/4.jpg"
    ]
  },
  {
    id: 3,
    name: "Celestial Trace Necklace",
    price: 1450,
    category: "Necklaces",
    material: "18k Yellow Gold",
    description: "A whisper of moonlight, captured for the everyday.",
    images: [
      "Photos/Celestial Trace Necklace/Description 1.png",
      "Photos/Celestial Trace Necklace/Description 2.png",
      "Photos/Celestial Trace Necklace/Description 3.png",
      "Photos/Celestial Trace Necklace/Description 4 .png"
    ]
  },
  {
    id: 4,
    name: "Nocturne Link Bracelet",
    price: 2100,
    category: "Bracelets",
    material: "18k Yellow Gold",
    description: "A sculptural bracelet with a refined nocturne link silhouette.",
    images: [
      "Photos/nocturne-link-bracelet/1.jpg",
      "Photos/nocturne-link-bracelet/2.jpg",
      "Photos/nocturne-link-bracelet/3.jpg",
      "Photos/nocturne-link-bracelet/4.jpg"
    ]
  },
  {
    id: 5,
    name: "Celestial Hoops",
    price: 890,
    category: "Earrings",
    material: "18k Yellow Gold",
    description: "Lightweight hoops with a celestial-inspired profile.",
    images: [
      "Photos/celestial-hoops/1.jpg",
      "Photos/celestial-hoops/2.jpg",
      "Photos/celestial-hoops/WhatsApp Image 2026-04-25 at 1.40.41 AM.jpeg",
      "Photos/celestial-hoops/WhatsApp Image 2026-04-25 at 1.42.27 AM.jpeg"
    ]
  }
];
let featureProducts = [];
let featureInitialCategoryApplied = false;

function featureMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function featureNormalize(value) {
  return (value || "").trim().toLowerCase();
}

function featureEscape(value) {
  return String(value ?? "").replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[char]));
}

function featureIsLandingPage() {
  const path = window.location.pathname.toLowerCase();
  return path.endsWith("landing-page.html") || path.endsWith("/") || path === "";
}

function featureInferCategory(name) {
  const lower = featureNormalize(name);
  if (lower.includes("ring") || lower.includes("band")) return "Rings";
  if (lower.includes("earring") || lower.includes("drop") || lower.includes("hoop")) return "Earrings";
  if (lower.includes("necklace")) return "Necklaces";
  if (lower.includes("bracelet")) return "Bracelets";
  return "Gifts";
}

function featureGetSessionId() {
  if (typeof getSessionId === "function") return getSessionId();
  const key = "ophelia_cart_session";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

async function featureApi(path, options = {}) {
  const response = await fetch(`${FEATURE_API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) throw new Error("API request failed");
  if (response.status === 204) return null;
  return response.json();
}

async function featureLoadProducts() {
  try {
    featureProducts = await featureApi("/products");
  } catch (error) {
    console.error(error);
    featureProducts = [];
  }
}

function featureFindProductByName(name) {
  return featureProducts.find(product => featureNormalize(product.name) === featureNormalize(name));
}

function featureFindProductById(productId) {
  return featureProducts.find(product => String(product.id) === String(productId));
}

function featureProductFromCard(card) {
  const name = card?.querySelector(".title-row")?.textContent?.trim();
  return featureFindProductByName(name);
}

function featureProductFromElement(element) {
  const productId = element?.dataset?.productId;
  if (productId) return featureFindProductById(productId);
  const card = element?.closest(".product-card");
  if (card) return featureProductFromCard(card);
  return featureFindProductByName(document.querySelector(".main-des .title")?.textContent?.trim());
}

function featureCategoryOf(product) {
  return product?.category || featureInferCategory(product?.name || "");
}

function featureProductDetailsFor(product) {
  if (!product) return null;
  return FEATURE_PRODUCT_DETAILS.find(detail =>
    String(detail.id) === String(product.id) || featureNormalize(detail.name) === featureNormalize(product.name)
  ) || null;
}

function featureSelectedProductDetails() {
  const requestedId = new URLSearchParams(window.location.search).get("id");
  const currentTitle = document.querySelector(".main-des .title")?.textContent?.trim();
  return FEATURE_PRODUCT_DETAILS.find(product => String(product.id) === String(requestedId))
    || FEATURE_PRODUCT_DETAILS.find(product => featureNormalize(product.name) === featureNormalize(currentTitle))
    || FEATURE_PRODUCT_DETAILS[0];
}

function featureProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length) return product.images;
  const detail = featureProductDetailsFor(product);
  if (Array.isArray(detail?.images) && detail.images.length) return detail.images;
  return product?.imageUrl ? [product.imageUrl] : ["Photos/aura-diamond-band/1.jpg"];
}

function featureImageOf(product) {
  return featureProductImages(product)[0];
}

function featureRenderProductGallery(images, productName) {
  const thumbnailsContainer = document.querySelector(".thumbs");
  const mainImage = document.querySelector(".main-img img");
  if (!thumbnailsContainer || !mainImage || !Array.isArray(images) || !images.length) return;

  thumbnailsContainer.innerHTML = "";

  const setActiveImage = (src, selectedThumbnail) => {
    mainImage.src = src;
    mainImage.alt = productName;
    thumbnailsContainer.querySelectorAll("img").forEach(image => {
      image.classList.toggle("active", image === selectedThumbnail);
    });
  };

  images.forEach((src, index) => {
    const thumbnail = document.createElement("img");
    thumbnail.src = src;
    thumbnail.alt = `${productName} image ${index + 1}`;
    thumbnail.dataset.productThumb = String(index);
    thumbnail.tabIndex = 0;
    thumbnail.setAttribute("role", "button");
    if (index === 0) thumbnail.classList.add("active");

    const selectThumbnail = () => setActiveImage(src, thumbnail);
    thumbnail.addEventListener("click", selectThumbnail);
    thumbnail.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectThumbnail();
      }
    });

    thumbnailsContainer.appendChild(thumbnail);
  });

  setActiveImage(images[0], thumbnailsContainer.querySelector("img"));
}
function featureProductDetailUrl(product) {
  const id = product?.id && !String(product.id).startsWith("dom-") ? `?id=${encodeURIComponent(product.id)}` : "";
  return `${FEATURE_PRODUCT_PAGE_URL}${id}`;
}

function featureOpenProduct(product) {
  window.location.href = featureProductDetailUrl(product);
}

function featureCatalogProducts() {
  const products = [...featureProducts];
  document.querySelectorAll(".product-card").forEach(card => {
    const name = card.querySelector(".title-row")?.textContent?.trim();
    if (!name || products.some(product => featureNormalize(product.name) === featureNormalize(name))) return;
    const priceText = card.querySelector(".price-row span")?.textContent?.trim() || "$0";
    products.push({
      id: `dom-${featureNormalize(name).replace(/\s+/g, "-")}`,
      name,
      category: card.dataset.category || featureInferCategory(name),
      description: card.dataset.searchText || "OPHELIA jewelry piece",
      imageUrl: card.querySelector(".product-img img")?.getAttribute("src") || "Photos/collection 1.jpg",
      material: "18k Yellow Gold",
      price: Number(priceText.replace(/[^0-9.]/g, "")) || 0
    });
  });
  return products;
}

function ensureFeatureToastContainer() {
  if (document.getElementById("toast-container")) return;
  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);
}

function showToast(message, type = "success") {
  ensureFeatureToastContainer();
  const toast = document.createElement("div");
  const normalizedType = type === "error" ? "error" : "success";
  toast.className = `toast-message toast-${normalizedType}`;
  toast.textContent = message;
  document.getElementById("toast-container").appendChild(toast);
  window.setTimeout(() => toast.classList.add("show"), 20);
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function featureHydrateProductCards() {
  document.querySelectorAll(".product-card").forEach(card => {
    const product = featureProductFromCard(card);
    const title = card.querySelector(".title-row")?.textContent?.trim();
    const heart = card.querySelector(".heart");
    if (heart) {
      heart.innerHTML = "&hearts;";
      heart.setAttribute("role", "button");
      heart.setAttribute("aria-label", "Toggle wishlist");
    }
    if (product) {
      card.dataset.productId = product.id;
      card.dataset.category = featureCategoryOf(product);
      card.dataset.searchText = `${product.name} ${product.category} ${product.description} ${featureMoney(product.price)}`;
      card.querySelectorAll(".product-img img, .title-row").forEach(item => {
        item.setAttribute("role", "link");
        item.setAttribute("tabindex", "0");
        item.dataset.productLink = "true";
      });
    } else {
      card.dataset.category = card.dataset.category || featureInferCategory(title);
    }
  });
  featureHydrateProductDetailsPage();
}

function featureHydrateProductDetailsPage() {
  const detailsRoot = document.querySelector(".main-des");
  if (!detailsRoot) return;

  const selectedProduct = featureSelectedProductDetails();
  const apiProduct = featureFindProductById(selectedProduct.id) || featureFindProductByName(selectedProduct.name) || {};
  const displayProduct = { ...apiProduct, ...selectedProduct };
  const images = selectedProduct.images;

  detailsRoot.dataset.productId = String(selectedProduct.id);
  detailsRoot.querySelector(".title").textContent = displayProduct.name;
  detailsRoot.querySelector(".price").textContent = featureMoney(displayProduct.price);
  const intro = detailsRoot.querySelector(".text1");
  const description = detailsRoot.querySelector(".text2");
  const breadcrumb = document.querySelector(".main-content .text-muted.small");
  const favoriteButton = document.querySelector(".fav");
  const materialButton = document.querySelector(".material-active");
  const detailsMaterial = detailsRoot.querySelector(".details p:first-child");
  if (intro) intro.textContent = `${displayProduct.category} by OPHELIA`;
  if (description) description.textContent = displayProduct.description;
  if (breadcrumb) breadcrumb.textContent = `Home / ${displayProduct.name}`;
  if (favoriteButton) {
    favoriteButton.dataset.productId = String(selectedProduct.id);
    const heart = favoriteButton.querySelector(".my-love");
    if (heart) heart.innerHTML = "&#9825;";
  }
  if (materialButton) materialButton.textContent = displayProduct.material.toUpperCase();
  if (detailsMaterial) detailsMaterial.innerHTML = `<span class="align-details">Material</span> ${featureEscape(displayProduct.material)}`;
  featureRenderProductGallery(images, displayProduct.name);
}
function featureWishlistIds() {
  try {
    const value = JSON.parse(localStorage.getItem(FEATURE_WISHLIST_KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function featureSetWishlistIds(ids) {
  localStorage.setItem(FEATURE_WISHLIST_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

function featureIsWishlisted(productId) {
  return featureWishlistIds().includes(String(productId));
}

function featureToggleWishlist(product) {
  if (!product) return;
  const ids = featureWishlistIds();
  const productId = String(product.id);
  if (ids.includes(productId)) {
    featureSetWishlistIds(ids.filter(id => id !== productId));
    showToast("Removed from wishlist");
  } else {
    ids.push(productId);
    featureSetWishlistIds(ids);
    showToast("Added to wishlist");
  }
  featureSyncWishlistUi();
  featureRenderWishlist();
  featureRenderSearchResults(document.getElementById("search-input")?.value || "");
}

function featureEnsureWishlistPanel() {
  if (document.getElementById("wishlist-panel")) return;
  const panel = document.createElement("aside");
  panel.id = "wishlist-panel";
  panel.innerHTML = `
    <div class="wishlist-header">
      <h2 class="my-selection-title">Wishlist</h2>
      <button class="wishlist-close" type="button" data-close-wishlist>x</button>
    </div>
    <div class="wishlist-body"></div>
  `;
  document.body.appendChild(panel);
}

function featureOpenWishlist() {
  featureEnsureWishlistPanel();
  featureRenderWishlist();
  document.getElementById("side-cart")?.classList.remove("active");
  document.getElementById("wishlist-panel")?.classList.add("active");
  document.getElementById("overlay")?.classList.add("active");
}

function featureCloseWishlist(removeOverlay = true) {
  document.getElementById("wishlist-panel")?.classList.remove("active");
  const cartOpen = document.getElementById("side-cart")?.classList.contains("active");
  if (removeOverlay && !cartOpen) document.getElementById("overlay")?.classList.remove("active");
}

function featureRenderWishlist() {
  featureEnsureWishlistPanel();
  const body = document.querySelector("#wishlist-panel .wishlist-body");
  if (!body) return;
  const products = featureWishlistIds().map(featureFindProductById).filter(Boolean);
  if (!products.length) {
    body.innerHTML = '<p class="wishlist-empty">Your wishlist is empty.</p>';
    return;
  }
  body.innerHTML = products.map(product => `
    <div class="wishlist-item">
      <img src="${featureEscape(featureImageOf(product))}" alt="${featureEscape(product.name)}">
      <div class="wishlist-details">
        <h4>${featureEscape(product.name)}</h4>
        <span>${featureMoney(product.price)}</span>
        <div class="wishlist-actions">
          <button type="button" data-wishlist-remove data-product-id="${product.id}">Remove</button>
          <button type="button" data-wishlist-add-cart data-product-id="${product.id}">Add to cart</button>
        </div>
      </div>
    </div>
  `).join("");
}

function featureSyncWishlistUi() {
  const ids = featureWishlistIds();
  document.querySelectorAll(".product-card").forEach(card => {
    const heart = card.querySelector(".heart");
    if (!heart || !card.dataset.productId) return;
    heart.classList.toggle("active", ids.includes(String(card.dataset.productId)));
  });
  const detailFavorite = document.querySelector(".fav");
  if (detailFavorite?.dataset.productId) {
    detailFavorite.classList.toggle("active", ids.includes(String(detailFavorite.dataset.productId)));
  }
  document.querySelectorAll("[data-search-wishlist]").forEach(button => {
    button.classList.toggle("active", ids.includes(String(button.dataset.productId)));
  });
  document.querySelectorAll(".nav-icons .bi-heart").forEach(icon => {
    icon.classList.toggle("active", ids.length > 0);
  });
}

async function featureAddProductToCart(product, toastMessage = "Added to cart successfully") {
  if (!product || String(product.id).startsWith("dom-")) {
    showToast("Could not add item to cart. Please try again.", "error");
    return;
  }
  await featureApi("/cart/items", {
    method: "POST",
    body: JSON.stringify({
      productId: product.id,
      quantity: 1,
      material: product.material,
      sessionId: featureGetSessionId()
    })
  });
  if (typeof loadCart === "function") await loadCart();
  showToast(toastMessage, "success");
}

function featureBindWishlist() {
  featureEnsureWishlistPanel();
  document.querySelectorAll(".nav-icons .bi-heart").forEach(icon => {
    icon.setAttribute("role", "button");
    icon.setAttribute("aria-label", "Open wishlist");
    icon.addEventListener("click", featureOpenWishlist);
  });

  document.addEventListener("click", async event => {
    const toggle = event.target.closest(".heart, .fav, [data-search-wishlist]");
    const close = event.target.closest("[data-close-wishlist]");
    const remove = event.target.closest("[data-wishlist-remove]");
    const addCart = event.target.closest("[data-wishlist-add-cart]");
    if (toggle) {
      event.preventDefault();
      featureToggleWishlist(featureProductFromElement(toggle));
      return;
    }
    if (close) {
      featureCloseWishlist();
      return;
    }
    if (remove) {
      featureSetWishlistIds(featureWishlistIds().filter(id => id !== String(remove.dataset.productId)));
      featureRenderWishlist();
      featureSyncWishlistUi();
      featureRenderSearchResults(document.getElementById("search-input")?.value || "");
      showToast("Removed from wishlist");
      return;
    }
    if (addCart) {
      try {
        await featureAddProductToCart(featureFindProductById(addCart.dataset.productId), "Added to cart successfully");
      } catch (error) {
        console.error(error);
        showToast("Could not add item to cart. Please try again.", "error");
      }
    }
  });
}

function featureEnsureSearch() {
  if (document.getElementById("search-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "search-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="search-dialog">
      <button class="search-close" type="button" data-close-search>x</button>
      <input id="search-input" type="search" placeholder="Search for rings, necklaces, bracelets..." autocomplete="off">
      <div id="search-results" class="search-results"></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function featureOpenSearch() {
  featureEnsureSearch();
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-input");
  overlay.hidden = false;
  featureRenderSearchResults(input.value || "");
  input.focus();
}

function featureCloseSearch() {
  const overlay = document.getElementById("search-overlay");
  if (overlay) overlay.hidden = true;
}

function featureMatchesSearch(product, query) {
  if (!query) return true;
  const text = [product.name, product.category, product.description, featureMoney(product.price), String(product.price)].join(" ").toLowerCase();
  return text.includes(query.toLowerCase());
}

function featureRenderSearchResults(query = "") {
  const results = document.getElementById("search-results");
  if (!results) return;
  const matches = featureCatalogProducts().filter(product => featureMatchesSearch(product, query.trim()));
  if (!matches.length) {
    results.innerHTML = '<p class="search-empty">No products found</p>';
    return;
  }
  results.innerHTML = matches.map(product => `
    <div class="search-result-item">
      <img src="${featureEscape(featureImageOf(product))}" alt="${featureEscape(product.name)}">
      <div class="search-result-main">
        <h4>${featureEscape(product.name)}</h4>
        <p>${featureEscape(featureCategoryOf(product))}</p>
        <span>${featureMoney(product.price)}</span>
      </div>
      <div class="search-result-actions">
        <button type="button" data-search-view data-product-id="${product.id}">View Product</button>
        <button type="button" data-search-add-cart data-product-id="${product.id}">Add to cart</button>
        <button type="button" class="wishlist-heart ${featureIsWishlisted(product.id) ? "active" : ""}" data-search-wishlist data-product-id="${product.id}" aria-label="Toggle wishlist">&hearts;</button>
      </div>
    </div>
  `).join("");
}

function featureBindSearch() {
  featureEnsureSearch();
  document.querySelectorAll(".nav-icons .bi-search").forEach(icon => {
    icon.setAttribute("role", "button");
    icon.setAttribute("aria-label", "Open search");
    icon.addEventListener("click", featureOpenSearch);
  });
  document.getElementById("search-input")?.addEventListener("input", event => {
    featureRenderSearchResults(event.target.value);
  });
  document.addEventListener("click", async event => {
    if (event.target.closest("[data-close-search]") || event.target.id === "search-overlay") {
      featureCloseSearch();
      return;
    }
    const view = event.target.closest("[data-search-view]");
    if (view) {
      featureOpenProduct(featureFindProductById(view.dataset.productId));
      return;
    }
    const addCart = event.target.closest("[data-search-add-cart]");
    if (addCart) {
      try {
        await featureAddProductToCart(featureFindProductById(addCart.dataset.productId), "Added to cart successfully");
      } catch (error) {
        console.error(error);
        showToast("Could not add item to cart. Please try again.", "error");
      }
    }
  });
}

function featureProductSection() {
  return document.querySelector(".product-card")?.closest(".container") || null;
}

function featureCardWrapper(card) {
  return card.closest(".col-md-3, .col-sm-6") || card;
}

function featureEnsureCategoryMessage(section) {
  if (!section) return null;
  let message = section.querySelector(".category-empty-message");
  if (message) return message;
  message = document.createElement("div");
  message.className = "category-empty-message";
  message.hidden = true;
  const row = section.querySelector(".row.g-4") || section;
  row.insertAdjacentElement("afterend", message);
  return message;
}

function featureActivateCategory(category) {
  document.querySelectorAll(".nav-custom[data-category-filter]").forEach(link => {
    link.classList.toggle("active", Boolean(category) && link.dataset.categoryFilter === category);
  });
}

function featureScrollToProducts() {
  const section = featureProductSection();
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function featureFilterCategory(category = "") {
  const cards = [...document.querySelectorAll(".product-card")];
  if (!cards.length) return false;
  let visibleCount = 0;
  cards.forEach(card => {
    const product = featureProductFromCard(card);
    const cardCategory = card.dataset.category || featureCategoryOf(product);
    const visible = !category || cardCategory === category;
    featureCardWrapper(card).hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const message = featureEnsureCategoryMessage(featureProductSection());
  if (message) {
    message.textContent = category ? "No products found in this category" : "";
    message.hidden = !category || visibleCount > 0;
  }
  featureActivateCategory(category);
  featureScrollToProducts();
  return true;
}

function featureApplyInitialCategory() {
  if (featureInitialCategoryApplied) return;
  const category = new URLSearchParams(window.location.search).get("category");
  if (category && FEATURE_CATEGORIES.includes(category) && featureIsLandingPage()) {
    featureFilterCategory(category);
  }
  featureInitialCategoryApplied = true;
}

function featureBindCategories() {
  document.querySelectorAll(".nav-custom").forEach(link => {
    const category = FEATURE_CATEGORIES.find(item => featureNormalize(item) === featureNormalize(link.textContent));
    if (!category) return;
    link.dataset.categoryFilter = category;
    link.setAttribute("href", `landing-page.html?category=${encodeURIComponent(category)}`);
    link.addEventListener("click", event => {
      event.preventDefault();
      if (!featureIsLandingPage()) {
        window.location.href = `landing-page.html?category=${encodeURIComponent(category)}`;
        return;
      }
      featureFilterCategory(category);
    });
  });

  document.querySelectorAll(".btn-main").forEach(button => {
    button.setAttribute("href", "landing-page.html");
    button.addEventListener("click", event => {
      event.preventDefault();
      if (!featureIsLandingPage()) {
        window.location.href = "landing-page.html";
        return;
      }
      featureFilterCategory("");
    });
  });
}

function featureBindProductLinksAndButtons() {
  document.addEventListener("click", event => {
    const productLink = event.target.closest('[data-product-link="true"]');
    if (productLink) {
      event.preventDefault();
      featureOpenProduct(featureProductFromCard(productLink.closest(".product-card")));
      return;
    }

    const shopButton = event.target.closest(".shop-link, .shop-btn, .view-link");
    if (!shopButton) return;
    event.preventDefault();
    const text = shopButton.closest(".card-body")?.querySelector(".card-title")?.textContent || shopButton.textContent || "";
    const category = FEATURE_CATEGORIES.find(item => featureNormalize(text).includes(featureNormalize(item).slice(0, -1)) || featureNormalize(text).includes(featureNormalize(item)));
    if (!featureIsLandingPage()) {
      window.location.href = category ? `landing-page.html?category=${encodeURIComponent(category)}` : "landing-page.html";
      return;
    }
    featureFilterCategory(category || "");
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const productLink = event.target.closest?.('[data-product-link="true"]');
    if (!productLink) return;
    event.preventDefault();
    featureOpenProduct(featureProductFromCard(productLink.closest(".product-card")));
  });
}

function featureBindGlobalHomeLinks() {
  document.querySelectorAll(".navbar-brand").forEach(link => {
    link.setAttribute("href", "landing-page.html");
  });
}

function featureBindSuccessButtons() {
  document.querySelectorAll(".cancel-btn").forEach(button => {
    button.addEventListener("click", () => {
      window.location.href = "landing-page.html";
    });
  });
  document.querySelectorAll(".view-btn").forEach(button => {
    button.addEventListener("click", () => {
      const order = JSON.parse(localStorage.getItem("ophelia_last_order") || "null");
      if (order?.orderNumber) {
        showToast(`Order ${order.orderNumber} - ${featureMoney(order.total)}`);
      } else {
        showToast("Your order has been received.");
      }
    });
  });
}

function featureBindOverlayClose() {
  document.getElementById("overlay")?.addEventListener("click", () => {
    featureCloseWishlist(false);
  });
}

async function featureInit() {
  ensureFeatureToastContainer();
  featureEnsureWishlistPanel();
  featureEnsureSearch();
  featureBindGlobalHomeLinks();
  featureBindWishlist();
  featureBindSearch();
  featureBindCategories();
  featureBindProductLinksAndButtons();
  featureBindSuccessButtons();
  featureBindOverlayClose();

  await featureLoadProducts();
  featureHydrateProductCards();
  featureSyncWishlistUi();
  featureRenderWishlist();
  featureRenderSearchResults("");
  featureApplyInitialCategory();
}

document.addEventListener("DOMContentLoaded", () => {
  featureInit().catch(error => {
    console.error(error);
    showToast("Could not load store features", "error");
  });
});

