/**
 * Responsible for:
 * - Live search suggestions under the header search bar
 * - Navigating to products.html?q=... when user presses Enter
 * - Using allProducts from products.js to match product names
 */

// Initialize the search functionality
function initSearch() {

    // Get the search input field
    const input = $("#search-input");

    // Get the container where search suggestions will appear
    const suggestions = $("#search-suggestions");

    // If either the input or suggestions element does not exist, stop
    if (input.length === 0 || suggestions.length === 0) return;

    // Hide the suggestions dropdown
    function closeSuggestions() {
        suggestions.hide();
    }

    // Show the suggestions dropdown if it has items
    function openSuggestions() {
        if (suggestions.children().length > 0) {
            suggestions.show();
        }
    }

    // Listen for typing inside the search input
    input.on("input", function () {

        // Get the search query, trim spaces, and convert to lowercase
        const q = $(this).val().trim().toLowerCase();

        // Clear previous suggestions
        suggestions.empty();

        // If query is empty or products are not loaded, hide suggestions
        if (!q || allProducts.length === 0) {
            closeSuggestions();
            return;
        }

        // Find products whose names include the search query
        const matches = allProducts
            .filter(p => p.name.toLowerCase().includes(q)) // Match product names
            .slice(0, 10);                                 // Limit to 10 results

        // Loop through matching products
        matches.forEach(p => {

            // Highlight the matching part of the product name
            const highlighted = p.name.replace(
                new RegExp("(" + q + ")", "ig"), // Match search term
                "<mark>$1</mark>"                // Wrap match in <mark>
            );

            // Create a suggestion item with product ID
            const item = $(`<div data-id="${p.id}">${highlighted}</div>`);

            // When a suggestion is clicked
            item.on("click", function () {

                // Redirect to the product detail page
                window.location.href = "product.html?id=" + encodeURIComponent(p.id);
            });

            // Add the suggestion item to the suggestions container
            suggestions.append(item);
        });

        // Show the suggestions dropdown
        openSuggestions();
    });

    // Listen for key presses inside the search input
    input.on("keydown", function (e) {

        // If the Enter key is pressed
        if (e.key === "Enter") {

            // Prevent the default form submission behavior
            e.preventDefault();

            // Get the search query
            const q = $(this).val().trim();

            // If a query exists
            if (q) {

                // Redirect to the products page with search query
                window.location.href = "products.html?q=" + encodeURIComponent(q);
            }
        }
    });

    // Close suggestions when clicking outside the search area
    $(document).on("click", function (e) {

        // If the click was not inside the search wrapper
        if (!$(e.target).closest(".search-wrapper").length) {

            // Hide the suggestions dropdown
            closeSuggestions();
        }
    });
}

// Run when the document is fully loaded
$(document).ready(function () {

    // Load product data first, then initialize search
    loadProducts(function () {
        initSearch();
    });
});
