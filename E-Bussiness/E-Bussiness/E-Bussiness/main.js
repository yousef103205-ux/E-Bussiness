const API_BASE_URL = (
  window.OPHELIA_CONFIG?.apiBaseUrl ||
  window.OPHELIA_API_BASE_URL ||
  "http://localhost:5159/api"
).replace(/\/$/, "");
const SESSION_KEY = "ophelia_cart_session";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const EGYPT_PHONE_PATTERN = /^01[0125][0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EGYPT_GOVERNORATES = {
  "Cairo": ["Nasr City", "Heliopolis", "Maadi", "New Cairo", "Shubra", "Downtown", "Mokattam", "Zamalek", "Garden City"],
  "Giza": ["Dokki", "Mohandessin", "Haram", "Faisal", "6th of October", "Sheikh Zayed", "Imbaba", "Agouza"],
  "Alexandria": ["Smouha", "Sidi Gaber", "Gleem", "Miami", "Montaza", "Agami", "Borg El Arab", "Raml Station"],
  "Dakahlia": ["Mansoura", "Talkha", "Mit Ghamr", "Aga", "Belqas", "Sherbin", "Dekernes", "Sinbillawin", "Manzala"],
  "Sharqia": ["Zagazig", "10th of Ramadan", "Belbeis", "Minya El Qamh", "Abu Hammad", "Hehia", "Faqous", "Kafr Saqr"],
  "Gharbia": ["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "Samanoud", "Qutour", "Basyoun", "El Santa"],
  "Monufia": ["Shebin El Kom", "Menouf", "Ashmoun", "Quesna", "Sadat City", "Tala", "Berket El Sabe", "El Bagour"],
  "Beheira": ["Damanhur", "Kafr El Dawar", "Rashid", "Edku", "Abu Hummus", "Hosh Issa", "Itay El Baroud", "Wadi El Natrun"],
  "Qalyubia": ["Banha", "Shubra El Kheima", "Qalyub", "Obour", "Khanka", "Toukh", "Qaha", "Kafr Shukr"],
  "Port Said": ["Port Said", "Port Fouad", "El Arab", "El Manakh", "El Dawahy", "El Zohour"],
  "Suez": ["Suez", "Arbaeen", "Faisal", "Ataqah", "Ganayen"],
  "Ismailia": ["Ismailia", "Fayed", "Qantara East", "Qantara West", "Abu Suwir", "Tell El Kebir", "El Qassasin"],
  "Damietta": ["Damietta", "New Damietta", "Ras El Bar", "Faraskur", "Kafr Saad", "Zarqa", "Kafr El Battikh"],
  "Kafr El Sheikh": ["Kafr El Sheikh", "Desouk", "Baltim", "Fuwwah", "Metoubes", "Sidi Salem", "Qallin", "Biyala"],
  "Fayoum": ["Fayoum", "Sinnuris", "Tamiya", "Ibsheway", "Youssef El Seddik", "Etsa"],
  "Beni Suef": ["Beni Suef", "New Beni Suef", "Wasta", "Nasser", "Biba", "Ihnasia", "Somosta", "Fashn"],
  "Minya": ["Minya", "New Minya", "Mallawi", "Maghagha", "Beni Mazar", "Samalut", "Abu Qurqas", "Deir Mawas"],
  "Assiut": ["Assiut", "New Assiut", "Dayrout", "Manfalut", "Qusiya", "Abnub", "Abu Tig", "El Badari"],
  "Sohag": ["Sohag", "Akhmim", "Girga", "Tahta", "Tama", "El Maragha", "Juhayna", "Dar El Salam"],
  "Qena": ["Qena", "Nag Hammadi", "Qus", "Dishna", "Farshout", "Abu Tesht", "Qift", "Naqada"],
  "Luxor": ["Luxor", "New Luxor", "Esna", "Armant", "El Tod", "El Bayadiya", "Qurna"],
  "Aswan": ["Aswan", "New Aswan", "Edfu", "Kom Ombo", "Daraw", "Nasr El Nuba", "Abu Simbel"],
  "Red Sea": ["Hurghada", "Ras Gharib", "Safaga", "El Quseir", "Marsa Alam", "Shalateen", "Halaib"],
  "New Valley": ["Kharga", "Dakhla", "Farafra", "Paris", "Balat"],
  "Matrouh": ["Marsa Matrouh", "El Alamein", "Siwa", "Dabaa", "Sidi Barrani", "Sallum", "El Negaila"],
  "North Sinai": ["Arish", "Sheikh Zuweid", "Rafah", "Bir El Abd", "Nakhl", "Hasana"],
  "South Sinai": ["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Saint Catherine", "El Tor", "Ras Sidr"]
};

let productsCache = [];

function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "API request failed" }));
    throw new Error(error.message || "API request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatPrice(value) {
  return money.format(Number(value || 0));
}

function showCartToast(message, type = "success") {
  if (typeof showToast === "function") {
    showToast(message, type);
  }
}

function ensureSideCartLayout(sideCart = document.getElementById("side-cart")) {
  if (!sideCart) return null;
  const header = sideCart.querySelector(".cart-header");
  const footer = sideCart.querySelector(".cart-footer");
  if (!header || !footer) return null;

  let itemsArea = sideCart.querySelector(".cart-items-area");
  if (!itemsArea) {
    itemsArea = document.createElement("div");
    itemsArea.className = "cart-items-area";
    footer.insertAdjacentElement("beforebegin", itemsArea);
  }

  sideCart.querySelectorAll(":scope > .cart-item").forEach(item => {
    itemsArea.appendChild(item);
  });

  return itemsArea;
}

function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

function findProductByName(name) {
  return productsCache.find(product => normalizeName(product.name) === normalizeName(name));
}

function findProductById(productId) {
  return productsCache.find(product => String(product.id) === String(productId));
}

function getCurrentProductFromDetails() {
  const requestedId = new URLSearchParams(window.location.search).get("id");
  const detailId = document.querySelector(".main-des")?.dataset.productId;
  const title = document.querySelector(".main-des .title")?.textContent?.trim();
  return findProductById(detailId || requestedId) || findProductByName(title);
}

function getProductNameFromCard(element) {
  const card = element.closest(".product-card");
  return card?.querySelector(".title-row")?.textContent?.trim();
}

async function loadProducts() {
  productsCache = await api("/products");
  hydrateProductCards();
  hydrateProductDetails();
}

function hydrateProductCards() {
  document.querySelectorAll(".product-card").forEach(card => {
    const title = card.querySelector(".title-row")?.textContent?.trim();
    const product = findProductByName(title);
    if (!product) return;

    card.dataset.productId = product.id;
    const price = card.querySelector(".price-row span");
    const image = card.querySelector(".product-img img");
    if (price) price.textContent = formatPrice(product.price).replace(".00", "");
    if (image && product.imageUrl) image.src = product.imageUrl;
  });
}

function hydrateProductDetails() {
  const detailsRoot = document.querySelector(".main-des");
  if (!detailsRoot) return;

  const requestedId = new URLSearchParams(window.location.search).get("id");
  const title = detailsRoot.querySelector(".title")?.textContent?.trim();
  const product = (requestedId ? findProductById(requestedId) : null) || productsCache[0] || findProductByName(title);
  if (!product) return;

  detailsRoot.dataset.productId = product.id;

  const price = document.querySelector(".main-des .price");
  if (price) price.textContent = formatPrice(product.price);

  const detailText = document.querySelector(".main-des .text2");
  if (detailText && product.description) detailText.textContent = product.description;
}

async function loadCart() {
  const cart = await api(`/cart?sessionId=${encodeURIComponent(getSessionId())}`);
  renderSideCart(cart);
  renderCheckoutSummary(cart);
  return cart;
}

function renderSideCart(cart) {
  const sideCart = document.getElementById("side-cart");
  const footer = sideCart?.querySelector(".cart-footer");
  const itemsArea = ensureSideCartLayout(sideCart);
  if (!sideCart || !footer || !itemsArea) return;

  itemsArea.querySelectorAll(".cart-item").forEach(item => item.remove());

  cart.items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}">
      <div class="item-details">
        <h4>${item.name}</h4>
        <p>${item.material || "18k Yellow Gold"}</p>
        <span class="price">${formatPrice(item.unitPrice)}</span>
        <div class="quantity">
          <button data-cart-action="decrease" data-item-id="${item.id}" data-quantity="${item.quantity}">-</button>
          <span>${item.quantity}</span>
          <button data-cart-action="increase" data-item-id="${item.id}" data-quantity="${item.quantity}">+</button>
        </div>
      </div>
      <span class="remove" data-cart-action="remove" data-item-id="${item.id}">REMOVE</span>
    `;
    itemsArea.appendChild(row);
  });

  const subtotal = footer.querySelector(".sub-price");
  if (subtotal) subtotal.textContent = formatPrice(cart.subtotal);
}

function renderCheckoutSummary(cart) {
  const summary = document.querySelector(".order-summary");
  if (!summary) return;

  summary.querySelectorAll(".product").forEach(product => product.remove());
  const heading = summary.querySelector(".summary-title");
  let insertAfter = heading;

  cart.items.forEach(item => {
    const row = document.createElement("div");
    row.className = "product d-flex gap-3 mb-3";
    row.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}">
      <div>
        <h6>${item.name}</h6>
        <small>${item.material || "18k Yellow Gold"}</small>
        <p class="price">${formatPrice(item.lineTotal)}</p>
      </div>
    `;
    insertAfter.insertAdjacentElement("afterend", row);
    insertAfter = row;
  });

  const rows = summary.querySelectorAll(".summary-row .red");
  if (rows[0]) rows[0].textContent = formatPrice(cart.subtotal);
  if (rows[1]) rows[1].textContent = cart.shipping === 0 ? "Free" : formatPrice(cart.shipping);
  if (rows[2]) rows[2].textContent = formatPrice(cart.discount);
  if (rows[3]) rows[3].textContent = formatPrice(cart.tax);

  const total = summary.querySelector(".total-price");
  if (total) total.textContent = `${formatPrice(cart.total)} USD`;
}

async function addProductToCart(product, quantity = 1, material = null) {
  if (!product) {
    showCartToast("Could not add item to cart. Please try again.", "error");
    return;
  }

  try {
    await api("/cart/items", {
      method: "POST",
      body: JSON.stringify({
        productId: product.id,
        quantity,
        material: material || product.material,
        sessionId: getSessionId()
      })
    });
    await loadCart();
    openCart();
    showCartToast("Added to cart successfully", "success");
  } catch (error) {
    console.error(error);
    showCartToast("Could not add item to cart. Please try again.", "error");
  }
}

async function updateCartItem(itemId, quantity) {
  await api(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity, sessionId: getSessionId() })
  });
  await loadCart();
}

async function removeCartItem(itemId) {
  await api(`/cart/items/${itemId}?sessionId=${encodeURIComponent(getSessionId())}`, { method: "DELETE" });
  await loadCart();
}

function openCart() {
  ensureSideCartLayout();
  document.getElementById("side-cart")?.classList.add("active");
  document.getElementById("overlay")?.classList.add("active");
}

function closeCartPanel() {
  document.getElementById("side-cart")?.classList.remove("active");
  document.getElementById("overlay")?.classList.remove("active");
}

function getQuantityFromDetails() {
  const value = Number(document.querySelector(".counter-number")?.textContent?.trim());
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function bindCartControls() {
  document.getElementById("cart-btn")?.addEventListener("click", openCart);
  document.getElementById("close-cart")?.addEventListener("click", closeCartPanel);
  document.getElementById("overlay")?.addEventListener("click", closeCartPanel);

  document.addEventListener("click", async event => {
    const target = event.target.closest(".cart, .add-btn, .checkout, .continue, [data-cart-action], .counter-btn");
    if (!target) return;

    if (target.classList.contains("cart")) {
      const product = findProductByName(getProductNameFromCard(target));
      await addProductToCart(product);
    }

    if (target.classList.contains("add-btn")) {
      const material = document.querySelector(".material-active")?.textContent?.trim();
      await addProductToCart(getCurrentProductFromDetails(), getQuantityFromDetails(), material);
    }

    if (target.classList.contains("checkout")) {
      window.location.href = "add-to-cart.html";
    }

    if (target.classList.contains("continue")) {
      event.preventDefault();
      closeCartPanel();
    }

    if (target.dataset.cartAction === "increase") {
      await updateCartItem(target.dataset.itemId, Number(target.dataset.quantity) + 1);
    }

    if (target.dataset.cartAction === "decrease") {
      await updateCartItem(target.dataset.itemId, Number(target.dataset.quantity) - 1);
    }

    if (target.dataset.cartAction === "remove") {
      await removeCartItem(target.dataset.itemId);
    }

    if (target.classList.contains("counter-btn")) {
      const number = document.querySelector(".counter-number .my-width") || document.querySelector(".counter-number");
      if (!number) return;
      const current = Number(number.textContent.trim()) || 1;
      const isPlus = target.textContent.includes("+");
      number.textContent = Math.max(1, current + (isPlus ? 1 : -1));
    }
  });
}

function checkoutField(name) {
  return document.querySelector(`[data-field="${name}"]`);
}

function fieldValue(name) {
  return checkoutField(name)?.value.trim() || "";
}

function showCheckoutMessage(message) {
  const errorBox = document.getElementById("checkout-error");
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearCheckoutMessage() {
  const errorBox = document.getElementById("checkout-error");
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function setFieldError(field, message) {
  if (!field) return;
  field.classList.toggle("is-invalid", Boolean(message));

  let error = field.parentElement.querySelector(".field-error");
  if (!message && error) {
    error.remove();
    return;
  }

  if (message && !error) {
    error = document.createElement("div");
    error.className = "field-error mt-1";
    field.insertAdjacentElement("afterend", error);
  }

  if (error) error.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll(".is-invalid").forEach(field => field.classList.remove("is-invalid"));
  document.querySelectorAll(".field-error").forEach(error => error.remove());
}

function selectedPaymentMethod() {
  const checked = document.querySelector("input[name='pay']:checked");
  return checked?.value || "";
}

function bindEgyptLocations() {
  const governorateSelect = checkoutField("governorate");
  const citySelect = checkoutField("city");
  if (!governorateSelect || !citySelect) return;

  Object.keys(EGYPT_GOVERNORATES).forEach(governorate => {
    const option = document.createElement("option");
    option.value = governorate;
    option.textContent = governorate;
    governorateSelect.appendChild(option);
  });

  governorateSelect.addEventListener("change", () => {
    const cities = EGYPT_GOVERNORATES[governorateSelect.value] || [];
    citySelect.innerHTML = '<option value="" selected>Select city</option>';

    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  });
}

function bindPaymentOptions() {
  const paymentItems = document.querySelectorAll(".payment-item");
  const cardFields = document.getElementById("card-fields");
  const vodafoneInstructions = document.getElementById("vodafone-instructions");
  if (!paymentItems.length) return;

  const syncPaymentState = () => {
    const paymentMethod = selectedPaymentMethod();
    paymentItems.forEach(item => item.classList.toggle("active", item.querySelector("input")?.checked));

    if (cardFields) cardFields.hidden = paymentMethod !== "Credit / Debit Card";
    if (vodafoneInstructions) vodafoneInstructions.hidden = paymentMethod !== "Vodafone Cash";

    document.querySelectorAll("[data-card-field]").forEach(field => {
      field.required = false;
      if (paymentMethod !== "Credit / Debit Card") setFieldError(field, "");
    });
  };

  paymentItems.forEach(item => {
    item.addEventListener("click", () => {
      const input = item.querySelector("input");
      if (input) input.checked = true;
      syncPaymentState();
    });
  });

  document.querySelectorAll("input[name='pay']").forEach(input => input.addEventListener("change", syncPaymentState));
  syncPaymentState();
}

function bindInputCleanup() {
  checkoutField("phone")?.addEventListener("input", event => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 11);
  });

  document.getElementById("card-number")?.addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
    event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });

  document.getElementById("card-cvv")?.addEventListener("input", event => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  });
}

function validateCheckoutForm() {
  clearFieldErrors();
  clearCheckoutMessage();

  const requiredFields = [
    ["fullName", "Full name is required."],
    ["phone", "Mobile phone is required."],
    ["address", "Address is required."],
    ["governorate", "Governorate is required."],
    ["city", "City is required."],
    ["email", "Email is required."]
  ];

  let isValid = true;

  requiredFields.forEach(([name, message]) => {
    const field = checkoutField(name);
    if (!fieldValue(name)) {
      setFieldError(field, message);
      isValid = false;
    }
  });

  const phone = fieldValue("phone");
  if (phone && !EGYPT_PHONE_PATTERN.test(phone)) {
    setFieldError(checkoutField("phone"), "Enter an Egyptian mobile number starting with 010, 011, 012, or 015 and containing 11 digits.");
    isValid = false;
  }

  const email = fieldValue("email");
  if (email && !EMAIL_PATTERN.test(email)) {
    setFieldError(checkoutField("email"), "Enter a valid email address.");
    isValid = false;
  }

  const paymentMethod = selectedPaymentMethod();
  if (!paymentMethod) {
    showCheckoutMessage("Please choose a payment method.");
    isValid = false;
  }

if (!isValid && !document.getElementById("checkout-error")?.textContent) {
    showCheckoutMessage("Please complete the required fields before placing your order.");
  }

  return isValid;
}

function bindCheckout() {
  const form = document.getElementById("checkout-form");
  const button = document.querySelector(".place-order");
  if (!form || !button) return;

  form.addEventListener("input", clearCheckoutMessage);
  form.addEventListener("change", clearCheckoutMessage);

  button.addEventListener("click", async event => {
    event.preventDefault();

    if (!validateCheckoutForm()) return;

    button.disabled = true;
    const originalButtonHtml = button.innerHTML;

    try {
      const cart = await loadCart();
      if (!cart.items.length) {
        showCheckoutMessage("Your cart is empty. Please add a product before placing your order.");
        return;
      }

      const request = {
        sessionId: getSessionId(),
        customerName: fieldValue("fullName"),
        companyName: fieldValue("companyName"),
        phone: fieldValue("phone"),
        address: fieldValue("address"),
        country: fieldValue("country") || "Egypt",
        region: fieldValue("governorate"),
        city: fieldValue("city"),
        governorate: fieldValue("governorate"),
        email: fieldValue("email"),
        receiptTime: fieldValue("receiptTime"),
        location: fieldValue("location"),
        paymentMethod: selectedPaymentMethod(),
        notes: fieldValue("notes")
      };

      const order = await api("/orders", { method: "POST", body: JSON.stringify(request) });
      localStorage.setItem("ophelia_last_order", JSON.stringify(order));
      window.location.href = "Success.html";
    } catch (error) {
      console.error(error);
      showCheckoutMessage("Could not place order. Please check your information and try again.");
    } finally {
      button.disabled = false;
      button.innerHTML = originalButtonHtml;
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  bindCartControls();
  bindEgyptLocations();
  bindPaymentOptions();
  bindInputCleanup();
  bindCheckout();

  try {
    await loadProducts();
    await loadCart();
  } catch (error) {
    console.error(error);
  }
});

