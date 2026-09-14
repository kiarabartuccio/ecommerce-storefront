/**
 * CORE MODULE: Responsible for cart, checkout, and confirmation flow.
 * NOTE: Assumes readCookie/writeCookie are available globally (e.g., in ui.js or a shared helpers.js)
 */

// Cookie name used to store cart data
const CART_COOKIE = "myshop_cart";

// Tax rate (10%)
const TAX_RATE = 0.10;

// Re-defining cookie helpers here for completeness if they are not in a shared utility file
function readCookie(name) {

    // Get all cookies as a single string and prepend a semicolon for easier splitting
    const value = `; ${document.cookie}`;

    // Split the cookie string by the cookie name
    const parts = value.split(`; ${name}=`);

    // If the cookie exists, return its value
    if (parts.length === 2) return parts.pop().split(";").shift();

    // Otherwise return null
    return null;
}

function writeCookie(name, value, days) {

    // Initialize expiration string
    let expires = "";

    // If a number of days is provided
    if (days) {

        // Create a date object for the expiration
        const date = new Date();

        // Set expiration time in milliseconds
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

        // Convert date to UTC string for cookies
        expires = "; expires=" + date.toUTCString();
    }

    // Write the cookie with path=/ so it works on all pages
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCart() {

    // Read the cart cookie
    const raw = readCookie(CART_COOKIE);

    // If cookie does not exist, return empty cart
    if (!raw) return [];

    // Try to convert JSON string into array
    try {
        return JSON.parse(raw);
    } catch (e) {
        // If parsing fails, return empty array
        return [];
    }
}

function saveCart(cart) {
   
    // Save cart array to cookie for 7 days
    writeCookie(CART_COOKIE, JSON.stringify(cart), 7);

    // Update the cart badge count in the header
    updateCartCountBadge();
}

// Calculate subtotal, tax, and total
function cartTotals(cart) {

    // Start subtotal at zero
    let subtotal = 0;

    // Loop through each cart item
    cart.forEach(item => {

        // Get product data using the product ID
        const p = getProductById(item.id);

        // If product exists and has a price
        if (p && p.price) {

            // Add price multiplied by quantity to subtotal
            subtotal += p.price * item.qty;
        }
    });

    // Calculate tax amount
    const tax = subtotal * TAX_RATE;

    // Calculate total amount
    const total = subtotal + tax;

    // Return totals as an object
    return { 
        subtotal: subtotal,
        tax: tax,
        total: total
    };
}

// Event handler to change item quantity
function handleQuantityChange() {

    // Get product ID from data attribute
    const id = $(this).data("product-id");

    // Convert input value to integer, default to 1 if invalid
    let newQty = parseInt($(this).val(), 10) || 1;

    // Ensure quantity is at least 1
    newQty = Math.max(1, newQty);

    // Update input field value
    $(this).val(newQty);

    // Get current cart
    const cart = getCart();

    // Find index of matching cart item
    const itemIndex = cart.findIndex(item => item.id == id);

    // If item exists in cart
    if (itemIndex > -1) {

        // Update quantity
        cart[itemIndex].qty = newQty;

        // Save updated cart
        saveCart(cart);

        // Re-render cart display
        renderCart();
    }
}

function addToCart(productId, quantity = 1) {

    // Get existing cart
    let cart = getCart();

    // Get product data
    const product = getProductById(productId); 

    // If product not found, stop execution
    if (!product) {
        console.error(`Product with ID ${productId} not found.`);
        return;
    }

    // Check if product already exists in cart
    const existing = cart.find(item => item.id == productId);

    // If product exists, increase quantity
    if (existing) {
        existing.qty += quantity;
    } else {
        // Otherwise add new item to cart
        cart.push({ id: productId, qty: quantity });
    }

    // Remove items with invalid quantities
    cart = cart.filter(item => item.qty > 0); 

    // Save updated cart
    saveCart(cart);
}

function updateCartItemQuantity(productId, quantity) {

    // Get cart data
    const cart = getCart();

    // Find matching item
    const item = cart.find(i => i.id === productId);

    // If item exists
    if (item) {

        // Update quantity
        item.qty = quantity;

        // If quantity is zero or less, remove item
        if (item.qty <= 0) {
            saveCart(cart.filter(i => i.id !== productId));
        } else {
            // Otherwise save updated cart
            saveCart(cart);
        }
    }
}

function removeFromCart(productId) {

    // Get current cart
    const cart = getCart();

    // Remove matching item
    saveCart(cart.filter(item => item.id !== productId));

    // Save updated cart
    saveCart(cart);

    // If cart section exists, re-render cart
    if ($("#cart-section").length) {
        renderCart(cart);
    }
}

// Event handler to remove an item from the cart
function handleRemoveItem() {

    // Get product ID from button
    const id = $(this).data("product-id");

    // Get cart data
    const cart = getCart();

    // Filter out removed item
    const newCart = cart.filter(item => item.id != id);

    // Save updated cart
    saveCart(newCart);

    // Re-render cart
    renderCart();
}

function updateQuantity(id, newQty) {

    // Get cart data
    let cart = getCart();

    // Find matching item
    const existingItem = cart.find(item => item.id == id);

    // Convert quantity to number
    const qty = parseInt(newQty, 10);

    // If item exists and quantity is invalid, remove it
    if (existingItem && qty < 1) {
        removeFromCart(id);
        return;
    }

    // If cart page exists, re-render cart
    if ($('#cart-section').length) {
        renderCart(getCart());
    }
}

function renderCart(cart) {

    // Get cart item list container
    const cartItemsContainer = $("#cart-items-list");

    // Get cart summary container
    const cartSummaryContainer = $("#cart-summary-totals");

    // Clear previous content
    cartItemsContainer.empty();
    cartSummaryContainer.empty();

    // If cart is empty
    if (cart.length === 0) {

        // Show empty cart message
        cartItemsContainer.html("<p class=\"empty-cart-message\">Your cart is empty.</p>");

        // Show zero totals
        cartSummaryContainer.html(`
            <p>Subtotal: $0.00</p>
            <p>Tax (10%): $0.00</p>
            <p class="cart-total-line">Total: <span>$0.00</span></p>
        `);

        // Disable checkout button
        $("#cart-checkout-btn").prop('disabled', true);

        return;
    }

    // Render each cart item
    cart.forEach(cartItem => {

        // Get product info
        const product = getProductById(cartItem.id);

        // Skip item if product not found
        if (!product) return;
        
        // Format price values
        const priceFormatted = product.price.toFixed(2);
        const subtotalFormatted = (product.price * cartItem.qty).toFixed(2);

        // Append cart item HTML
        cartItemsContainer.append(`
            <li class="cart-item" data-product-id="${product.id}">
                <div class="cart-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="cart-details">
                    <a href="product.html?id=${product.id}" class="cart-title">${product.title}</a>
                    <p class="cart-price">$${priceFormatted}</p>
                </div>
                <div class="cart-quantity">
                    <input type="number" 
                           min="1" 
                           value="${cartItem.qty}" 
                           class="cart-qty-input" 
                           data-product-id="${product.id}">
                </div>
                <div class="cart-subtotal">
                    $${subtotalFormatted}
                </div>
                <div class="cart-actions">
                    <button class="btn secondary cart-remove-btn" data-product-id="${product.id}">Remove</button>
                </div>
            </li>
        `);
    });

    // Calculate totals
    const totals = cartTotals(cart);

    // Render totals section
    cartSummaryContainer.html(`
        <p>Subtotal: $${totals.subtotal.toFixed(2)}</p>
        <p>Tax (${(TAX_RATE * 100).toFixed(0)}%): $${totals.tax.toFixed(2)}</p>
        <p class="cart-total-line">Total: <span>$${totals.total.toFixed(2)}</span></p>
    `);

    // Enable checkout button
    $("#cart-checkout-btn").prop('disabled', false);

    // Attach remove button click handler
    $(".cart-remove-btn").on("click", function() {
        const id = $(this).data("product-id");
        removeFromCart(id);
    });

    // Attach quantity change handler
    $(".cart-qty-input").on("change", function() {
        const id = $(this).data("product-id");
        const qty = $(this).val();
        updateQuantity(id, qty);
    });
}

// Initialize cart page
function initCartPage() {

    // Ensure product loading function exists
    if (typeof loadProducts !== 'function') {
        console.error("loadProducts is required but not defined.");
        return;
    }

    // Load products first, then render cart
    loadProducts(function() {

        // Check if cart section exists
        const section = $("#cart-section");
        if (section.length === 0) return;

        // Redirect if user is not logged in
        if (!isLoggedIn()) {
            alert("You must be logged in to view your cart.");
            window.location.href = "login.html?redirect=cart.html";
            return;
        }

        // Get cart data
        const cart = getCart();

        // Render cart
        renderCart(cart);

        // Update cart badge
        updateCartCountBadge();

        // Checkout button handler
        $("#cart-checkout-btn").on("click", function(e) {
            e.preventDefault();
            if (isLoggedIn()) {
                window.location.href = "checkout.html";
            } else {
                window.location.href = "login.html?redirect=checkout.html";
            }
        });
    });
}

function initCheckoutPage() {

    // Get checkout section
    const section = $("#checkout-section");
    if (section.length === 0) return;

    // Redirect if user not logged in
    if (!isLoggedIn()) {
        alert("You must be logged in to proceed to checkout.");
        window.location.href = "login.html";
        return;
    }

    // Get cart data
    const cart = getCart();

    // If cart is empty, show message
    if (cart.length === 0) {
        section.html("<h2>Checkout</h2><p>Your cart is empty.</p><a href='products.html' class='btn primary'>Continue Shopping</a>");
        return;
    }

    // Render checkout summary
    renderCheckoutSummary(cart);

    // Handle checkout form submission
    $("#checkout-form").on("submit", function (e) {
        e.preventDefault();

        // Read form fields
        const name = $("#checkout-name").val().trim();
        const email = $("#checkout-email").val().trim();
        const phone = $("#checkout-phone").val().trim();
        const address = $("#checkout-address").val().trim();
        const city = $("#checkout-city").val().trim();
        const postal = $("#checkout-postal").val().trim();

        // Validate required fields
        if (!name || !email || !phone || !address || !city || !postal) {
            alert("Please fill out all required fields.");
            return;
        }

        // Calculate totals
        const totals = cartTotals(cart);

        // Create order object
        const order = {
            orderNumber: "ORD-" + Math.floor(Math.random() * 900000 + 100000),
            total: totals.total,
            items: cart
        };

        // Save order in session storage
        sessionStorage.setItem("myshop_last_order", JSON.stringify(order));

        // Clear cart
        saveCart([]);

        // Redirect to confirmation page
        window.location.href = "confirmation.html";
    });
}

function initConfirmationPage() {

    // Get confirmation section
    const section = $("#confirmation-section");
    if (section.length === 0) return;

    // Get last order from session storage
    const raw = sessionStorage.getItem("myshop_last_order");

    // If no order found
    if (!raw) {
        section.html("<p>No recent order found.</p>");
        return;
    }

    // Parse order data
    const order = JSON.parse(raw);

    // Display order number
    $("#order-number").text(order.orderNumber);

    // Display order total
    $("#confirmation-total").text(order.total.toFixed(2));

    // Get items container
    const itemsContainer = $("#confirmation-items");
    itemsContainer.empty();

    // Render each ordered item
    order.items.forEach(ci => {

        // Get product info
        const p = getProductById(ci.id);
        if (!p) return;

        // Append item summary
        itemsContainer.append(
            `<p>${p.title} × ${ci.qty} - $${(p.price * ci.qty).toFixed(2)}</p>`
        );
    });
}

// Run page initialization when document is ready
$(document).ready(function () {

    // Initialize cart page
    initCartPage();

    // Initialize checkout page
    initCheckoutPage();

    // Initialize confirmation page
    initConfirmationPage();
});