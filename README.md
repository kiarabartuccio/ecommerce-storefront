# MyShop E-Commerce Storefront

A multi-page e-commerce storefront built with HTML, CSS, JavaScript, jQuery, JSON, and XML. The application demonstrates product discovery, browser-based account state, cart management, checkout, and responsive interface design.

## Screenshots

<p align="center">
  <img src="docs/screenshots/home-featured-products.jpg" width="900" alt="MyShop home page with featured products"><br>
  <b>Home Page and Featured Products</b>
</p>

<p align="center">
  <img src="docs/screenshots/home-product-catalog.jpg" width="900" alt="MyShop home page product catalogue"><br>
  <b>Home Product Catalogue</b>
</p>

<p align="center">
  <img src="docs/screenshots/products-page.jpg" width="900" alt="MyShop products page with filters"><br>
  <b>Products and Filtering</b>
</p>

<p align="center">
  <img src="docs/screenshots/product-pagination.jpg" width="900" alt="MyShop product pagination"><br>
  <b>Product Pagination</b>
</p>

<p align="center">
  <img src="docs/screenshots/about-page.jpg" width="900" alt="MyShop about page"><br>
  <b>About Page</b>
</p>

<p align="center">
  <img src="docs/screenshots/login-page.jpg" width="900" alt="MyShop login page"><br>
  <b>Login Page</b>
</p>

<p align="center">
  <img src="docs/screenshots/cart-login-validation.jpg" width="900" alt="MyShop cart login validation message"><br>
  <b>Cart Login Validation</b>
</p>

## Quick Start

HOW I START: IN WAMPOON HTDOCS, OPEN LOCAL HOST ON WAMPOON, OPEN ecommerce-storefront-main, RUNS

**Windows:** Download the repository ZIP, extract it, and double-click `start-demo.bat`. The site opens at `http://localhost:8000`.

**macOS/Linux:**

```bash
chmod +x start-demo.sh
./start-demo.sh
```

Press `Ctrl+C` in the terminal when finished.

## Features

- Product catalogue with category filtering and pagination
- Search suggestions and individual product pages
- Shopping cart with persistent browser storage
- Registration and login through a demonstration API
- Checkout and confirmation flow
- User profile page
- Product ratings and reviews
- Responsive layout and dark mode
- Product and category data loaded from JSON and XML

## Technologies

- HTML5
- CSS3
- JavaScript and jQuery
- AJAX
- JSON and XML
- Cookies and local storage

## Run Locally

Because the site loads local data files, serve it through a local web server rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Important Note

Authentication uses the ReqRes demonstration API and is intended only to demonstrate front-end request handling. This is an educational project, not a production shopping service.

## What I Practiced

This project strengthened my skills in DOM manipulation, asynchronous requests, persistent client-side state, responsive design, structured data, reusable JavaScript, and multi-page navigation.
