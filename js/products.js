/**
 * Responsible for:
 * - Loading product, category, and review JSON data via AJAX
 * - Normalizing and storing all products in memory
 * - Rendering:
 *      • Home page categories and featured products
 *      • Product Listing Page (filters, sorting, pagination)
 *      • Product Detail Page (details, related products, reviews)
 * - Providing helper functions (getProductById, getReviewsForProduct)
 * - Integrating with the cart logic via addToCart()
 */

// Store all product data loaded from JSON
let allProducts = [];

// Store all category data loaded from XML
let allCategories = [];

// Store all reviews in a single flat array
let allReviews = []; // flattened

// Convert a category name into a URL-friendly slug, cleans text in URLs
function slugifyCategory(name) {
    return name
        .toLowerCase()                 // Convert text to lowercase
        .replace(/&/g, "and")          // Replace & with the word "and"
        .replace(/[^a-z0-9]+/g, "-")   // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, "");      // Remove leading and trailing hyphens
}

// Load products, categories, and reviews
function loadProducts(callback) {

    // If products are already loaded, skip loading again
    if (allProducts.length > 0) {
        if (callback) callback(); // Run callback if provided
        return;
    }

    // Temporary storage for raw review data
    let rawReviews = [];
    
    // Array of AJAX requests to load all data files
    const productRequests = [

        // Load products from JSON file
        $.getJSON("data/products.json", function (data) {
            allProducts = data; // Save products
        }),
        
        // Load categories from XML file
        $.ajax({
            url: "data/categories.xml", // XML file path
            dataType: "xml",            // Expect XML data
            success: function(xmlData) {

                // Reset categories array
                allCategories = [];

                // Find each <category> element
                $(xmlData).find('category').each(function() {

                    // Extract category name
                    const categoryName = $(this).find('name').text();

                    // Store category as an object
                    allCategories.push({ name: categoryName }); 
                });
            }
        }),

        // Load reviews from JSON file
        $.getJSON("data/reviews.json", function (data) {
            rawReviews = data; // Save raw reviews
        })
    ];

    // Wait until all AJAX requests finish
    $.when(...productRequests).then(function () {

        // Normalize product data structure
        allProducts = allProducts.map(p => ({
            ...p,                               // Copy original product fields
            title: p.name,                     // Rename name → title
            categoryName: p.category,          // Store category name
            categorySlug: slugifyCategory(p.category), // Generate category slug
            reviews: []                        // Prepare empty reviews array
        }));

        // Merge reviews into products
        rawReviews.forEach(pr => {

            // Find product matching the review’s product_id
            const product = allProducts.find(p => p.id == pr.product_id);

            // If product exists, attach its reviews
            if (product) {
                product.reviews = pr.reviews.map(r => ({
                    id: r.review_id, // Review ID
                    author: r.user,  // Reviewer name
                    rating: r.rating,// Review rating
                    title: r.title,  // Review title
                    text: r.comment  // Review text
                }));
            }
        });

        // Flatten all reviews into a single array
        allReviews = allProducts.flatMap(p => p.reviews);

        // Run callback after data is loaded
        if (callback) callback();

        // Initialize pages that depend on product data
        initProductListingPage();
        initHomePage();
        initProductDetailPage();
    });
}

// Get a product by its ID
function getProductById(id) {

    // Convert ID to integer
    const searchId = parseInt(id, 10);

    // Find and return matching product
    return allProducts.find(p => p.id === searchId);
}

// Get all reviews for a specific product
function getReviewsForProduct(id) {

    // Convert product ID to string
    const pid = String(id);

    // Filter reviews that match this product ID
    return allReviews.filter(r => r.productId === pid);
}

// Render categories on the home page
function renderCategoriesOnHome() {

    // Get category container
    const container = $("#home-categories");

    // Stop if container does not exist
    if (container.length === 0) return;

    // Clear existing content
    container.empty();

    // Loop through all categories
    allCategories.forEach(cat => {

        // Create category card HTML
        const card = $(
            `<article class="category-card">
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
                <a href="products.html?category=${encodeURIComponent(cat.slug)}" class="btn secondary">Shop ${cat.name}</a>
            </article>`
        );

        // Add card to page
        container.append(card);
    });
}

// Generate HTML for a product card
function productCardHtml(p, searchTerm) {

    // Use placeholder image if product image is missing
    const img = p.image || "assets/placeholder.png";

    // Default title HTML
    let titleHtml = p.title;

    // Highlight search term if provided
    if (searchTerm) {

        // Escape special regex characters
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Create regex to highlight matches
        const reHigh = new RegExp("(" + escaped + ")", "ig");

        // Wrap matched text in <mark>
        titleHtml = p.title.replace(reHigh, "<mark>$1</mark>");
    }

    // Return product card HTML
    return `
    <article class="product-card">
        <img src="${img}" alt="${p.title}">
        <h3>${titleHtml}</h3>
        <p class="price">$${p.price.toFixed(2)}</p>
        <p>${p.categoryName}</p>
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn secondary">View details</a>
    </article>`;
}

// Render featured products on home page
function renderFeaturedProducts() {

    // Get featured products container
    const container = $("#featured-products");

    // Stop if container does not exist
    if (container.length === 0) return;

    // Clear existing content
    container.empty();

    // Select first 49 products as featured
    const featured = allProducts.slice(0, 49);

    // Render each featured product
    featured.forEach(p => container.append(productCardHtml(p)));
}

// Initialize Product Listing Page (PLP)
function initPLP() {

    // Get main product list container
    const list = $("#product-list");

    // Get breadcrumbs container
    const breadcrumbs = $("#breadcrumbs");

    // Stop if page is not PLP
    if (list.length === 0) return;

    // Get filter controls
    const categoryFilter = $("#category-filter");
    const priceRange = $("#price-range");
    const priceLabel = $("#price-range-value");
    const sortSelect = $("#sort-select");
    const pagination = $("#pagination");
    const info = $("#product-results-info");

    // Populate category dropdown
    allCategories.forEach(cat => {
        categoryFilter.append(`<option value="${cat.slug}">${cat.name}</option>`);
    });

    // Read URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q") || "";
    const categoryQ = urlParams.get("category") || "";

    // Preselect category from URL
    if (categoryQ) {
        categoryFilter.val(categoryQ);
    }

    // Pagination settings
    let currentPage = 1;
    const perPage = 50;

    // Apply filters, sorting, pagination, and render products
    function applyFiltersAndRender() {

        // Copy all products
        let filtered = [...allProducts];

        // Apply category filter
        const cat = categoryFilter.val();
        if (cat) {
            filtered = filtered.filter(p => p.categorySlug === cat);
        }

        // Apply price filter
        const maxPrice = parseFloat(priceRange.val());
        priceLabel.text(maxPrice);
        filtered = filtered.filter(p => p.price <= maxPrice);

        // Apply search filter
        if (q) {
            const qLower = q.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(qLower) ||
                p.description.toLowerCase().includes(qLower)
            );
        }

        // Apply sorting
        const sortVal = sortSelect.val();
        if (sortVal === "price-asc") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortVal === "price-desc") {
            filtered.sort((a, b) => b.price - a.price);
        }

        // Pagination calculations
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);

        // Render products
        list.empty();
        pageItems.forEach(p => list.append(productCardHtml(p, q)));

        // Update results info text
        info.text(`Showing ${pageItems.length} of ${total} products${q ? ` for "${q}"` : ""}.`);

        // Update breadcrumbs
        if (breadcrumbs.length) {
            let crumb = '<a href="index.html">Home</a> / <span>All products</span>';
            if (cat && q) {
                const catObj = allCategories.find(c => c.slug === cat);
                const catName = catObj ? catObj.name : cat;
                crumb = '<a href="index.html">Home</a> / <a href="products.html">All products</a> / <span>' + catName + ' & search "' + q + '"</span>';
            } else if (cat) {
                const catObj = allCategories.find(c => c.slug === cat);
                const catName = catObj ? catObj.name : cat;
                crumb = '<a href="index.html">Home</a> / <span>' + catName + '</span>';
            } else if (q) {
                crumb = '<a href="index.html">Home</a> / <span>Search "' + q + '"</span>';
            }
            breadcrumbs.html(crumb);
        }

        // Render pagination buttons
        pagination.empty();
        for (let i = 1; i <= totalPages; i++) {
            const btn = $(`<button type="button">${i}</button>`);
            if (i === currentPage) btn.addClass("active");
            btn.on("click", function () {
                currentPage = i;
                applyFiltersAndRender();
            });
            pagination.append(btn);
        }
    }

    // Attach filter listeners
    priceRange.on("input change", applyFiltersAndRender);
    categoryFilter.on("change", function () {
        currentPage = 1;
        applyFiltersAndRender();
    });
    sortSelect.on("change", applyFiltersAndRender);

    // Initial render
    applyFiltersAndRender();
}

// Initialize Product Detail Page (PDP)
function initPDP() {

    // Get product detail container
    const container = $("#product-detail");

    // Get breadcrumbs container
    const breadcrumbs = $("#breadcrumbs");

    // Stop if not on PDP
    if (container.length === 0) return;

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    // Get product data
    const product = getProductById(id);

    // If product not found, show message
    if (!product) {
        container.html("<p>Product not found.</p>");
        return;
    }

    // Render breadcrumbs
    if (breadcrumbs.length) {
        const catSlug = product.categorySlug;
        const catObj = allCategories.find(c => c.slug === catSlug);
        const catName = catObj ? catObj.name : product.categoryName;
        const catLink = "products.html?category=" + encodeURIComponent(catSlug);
        breadcrumbs.html(`<a href="index.html">Home</a> / <a href="products.html">All products</a> / <a href="${catLink}">${catName}</a> / <span>${product.title}</span>`);
    }

    // Use placeholder if image missing
    const img = product.image || "assets/placeholder.png";

    // Render product details
    container.html(`
        <div>
            <img src="${img}" alt="${product.title}">
        </div>
        <div>
            <h1>${product.title}</h1>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p>SKU: ${product.sku}</p>
            <p>Availability: ${product.stock > 0 ? "In stock" : "Out of stock"}</p>
            <p>${product.description}</p>
            <div class="quantity-selector">
                <label for="pdp-qty">Qty:</label>
                <input type="number" id="pdp-qty" min="1" value="1">
            </div>
            <button class="btn primary" id="pdp-add-cart">Add to Cart</button>
        </div>
    `);

    // Add-to-cart button handler
    $("#pdp-add-cart").on("click", function () {

        // Read quantity
        const qty = parseInt($("#pdp-qty").val(), 10) || 1;

        // Add product to cart
        addToCart(product.id, qty);

        // Show confirmation
        alert("Added to cart!");
    });

    // Render related products
    const relatedContainer = $("#related-products");
    const related = allProducts.filter(p => p.category === product.category && p.id !== product.id);
    related.slice(0, 8).forEach(p => relatedContainer.append(productCardHtml(p)));

    // Render reviews
    const reviews = getReviewsForProduct(product.id);
    const reviewsList = $("#reviews-list");
    reviewsList.empty();

    // If no reviews exist
    if (reviews.length === 0) {
        reviewsList.append("<p>No reviews yet.</p>");
    } else {

        // Render each review
        reviews.forEach(r => {
            reviewsList.append(`
                <article class="review-card">
                    <strong>${r.author}</strong> - Rating: ${r.rating}/5
                    <p><em>${r.title}</em></p>
                    <p>${r.text}</p>
                </article>
            `);
        });
    }
}

// Run once the document is ready
$(document).ready(function () {

    // Load product data first
    loadProducts(function () {

        // Render home categories
        renderCategoriesOnHome();

        // Render featured products
        renderFeaturedProducts();

        // Initialize product listing page
        initPLP();

        // Initialize product detail page
        initPDP();
    });
});
