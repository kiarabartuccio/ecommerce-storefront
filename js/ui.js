/**
 * Handles small global UI behaviours:
 * - Sets the current year in the footer
 * - Applies dark mode toggle using a CSS class and localStorage
 * - Runs the simple hero slider on the home page
 */

/* Wait until the entire HTML page is fully loaded before running any code */
$(document).ready(function () {

    /* FOOTER YEAR */

    /* Find the element with id="year" and set its text to the current year */
    $("#year").text(new Date().getFullYear());

    /* DARK MODE */

    /* Name used to store dark mode preference in localStorage */
    const DARK_KEY = "myshop_dark";

    /* Get the saved dark mode value from localStorage */
    const savedDark = localStorage.getItem(DARK_KEY);

    /* If the saved value is "1", enable dark mode */
    if (savedDark === "1") {
        $("body").addClass("dark"); /* Adds the "dark" class to <body> */
    }

    /* Listen for clicks on the dark mode toggle button */
    $("#dark-mode-toggle").on("click", function () {

        /* Toggle (add/remove) the "dark" class on the body */
        $("body").toggleClass("dark");

        /* Save the current dark mode state to localStorage */
        localStorage.setItem(
            DARK_KEY, /* Key name */
            $("body").hasClass("dark") ? "1" : "0" /* 1 = dark, 0 = light */
        );
    });

    /* HERO SLIDER */

    /* Get all elements with class="hero-slide" */
    const slides = $(".hero-slide");

    /* NEWSLETTER FORM */

    /* Get the newsletter form */
    const newsletter = $("#newsletter-form");

    /* If the newsletter form exists on this page */
    if (newsletter.length) {

        /* Listen for form submission */
        newsletter.on("submit", function (e) {

            /* Prevent the page from refreshing */
            e.preventDefault();

            /* Get the email input value and remove extra spaces */
            const email = $("#newsletter-email").val().trim();

            /* If email field is empty */
            if (!email) {

                /* Show warning message */
                alert("Please enter an email address.");

            } else {

                /* Show success message (demo only) */
                alert("Thanks for subscribing! (Demo only, no real emails will be sent.)");
            }
        });
    }

    /* HERO SLIDE ROTATION */

    /* If there is at least one hero slide */
    if (slides.length > 0) {

        /* Track the current slide index */
        let idx = 0;

        /* Run this code every 4 seconds (4000 milliseconds) */
        setInterval(function () {

            /* Remove the 'active' class from all slides */
            slides.removeClass("active");

            /* Move to the next slide (loop back to 0 if at the end) */
            idx = (idx + 1) % slides.length;

            /* Add 'active' class to the current slide */
            slides.eq(idx).addClass("active");

        }, 4000); /* 4-second delay between slides */
    }
});
