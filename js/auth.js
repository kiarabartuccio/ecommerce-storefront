/**
 * Responsible for:
 * - Front-end authentication using the ReqRes demo API
 * - Saving the auth token + email into a cookie
 * - Updating the account link in the header (login vs profile)
 * - Handling:
 *      • Login form (login.html)
 *      • Register form (register.html)
 *      • Profile page (profile.html) using mock data + cookies
 */

/* CONSTANTS */

/* Name of the cookie used to store login info */
const AUTH_COOKIE = "myshop_auth";

/* AUTH STATUS HELPERS */

/* Check if the user is logged in */
function isLoggedIn() {
    /* readCookie returns the cookie value (or null/empty if missing)
       !! converts the result into true or false */
    return !!readCookie(AUTH_COOKIE);
}

/* Save login token + email to a cookie */
function setAuthToken(token, email) {
    /* Convert token + email into a JSON string and store it for 7 days */
    writeCookie(AUTH_COOKIE, JSON.stringify({ token, email }), 7);

    /* Update the account link (Login vs Profile) */
    updateAccountLink();
}

/* Log the user out */
function clearAuth() {
    /* Overwrite the cookie with an expired date to delete it */
    writeCookie(AUTH_COOKIE, "", -1);

    /* Update the account link after logout */
    updateAccountLink();
}

/* Get login info from the cookie */
function getAuth() {
    /* Read raw cookie value */
    const raw = readCookie(AUTH_COOKIE);

    /* If cookie does not exist, return null */
    if (!raw) return null;

    /* Try to convert JSON string back into an object */
    try {
        return JSON.parse(raw);
    } catch {
        /* If parsing fails, return null */
        return null;
    }
}

/* HEADER ACCOUNT LINK */

/* Update the Account / Login link in the header */
function updateAccountLink() {
    /* Get the account link element using jQuery */
    const link = $("#account-link");

    /* If the user is logged in */
    if (isLoggedIn()) {
        /* Point link to profile page */
        link.attr("href", "profile.html");

        /* Tooltip text */
        link.attr("title", "Profile");
    } else {
        /* Otherwise, point to login page */
        link.attr("href", "login.html");

        /* Tooltip text */
        link.attr("title", "Login");
    }
}

/* LOGIN PAGE LOGIC */

function initLoginPage() {
    /* Get the login form */
    const form = $("#login-form");

    /* If this page does not have the login form, stop */
    if (form.length === 0) return;

    /* Message area for feedback */
    const msg = $("#login-message");

    /* Listen for form submission */
    form.on("submit", function (e) {

        /* Prevent page reload */
        e.preventDefault();

        /* Get email input value and remove spaces */
        const email = $("#login-email").val().trim();

        /* Get password input value and remove spaces */
        const password = $("#login-password").val().trim();

        /* Show loading message */
        msg.text("Logging in...")
           .removeClass("success error")
           .addClass("loading");

        /* Send login request to demo API */
        $.ajax({
            url: "https://reqres.in/api/login", /* API endpoint */
            method: "POST",                     /* HTTP method */
            contentType: "application/json",    /* Sending JSON */
            data: JSON.stringify({              /* Data sent */
                email: email,
                password: password
            }),

            /* If login is successful */
            success: function (response) {

                /* Save token + email to cookie */
                setAuthToken(response.token, email);

                /* Show success message */
                msg.text("Login successful! Redirecting...")
                   .removeClass("error loading")
                   .addClass("success");

                /* Redirect to homepage */
                window.location.href = "index.html";
            },

            /* If login fails */
            error: function (xhr) {

                /* Try to get error message from API */
                const errorMsg =
                    (xhr.responseJSON && xhr.responseJSON.error)
                        ? xhr.responseJSON.error
                        : "Login failed. Please try a different email or password.";

                /* Show error message */
                msg.text(errorMsg)
                   .removeClass("success loading")
                   .addClass("error");
            }
        });
    });
}

/* REGISTER PAGE LOGIC*/

function initRegisterPage() {
    /* Get the register form */
    const form = $("#register-form");

    /* If form not on this page, stop */
    if (form.length === 0) return;

    /* Message display area */
    const msg = $("#register-message");

    /* Handle form submission */
    form.on("submit", function (e) {

        /* Prevent page refresh */
        e.preventDefault();

        /* Get email input */
        const email = $("#register-email").val().trim();

        /* Get password input */
        const password = $("#register-password").val().trim();

        /* Show loading message */
        msg.text("Registering...")
           .removeClass("success error")
           .addClass("loading");

        /* Send register request */
        $.ajax({
            url: "https://reqres.in/api/register", /* API endpoint */
            method: "POST",                        /* HTTP method */
            contentType: "application/json",       /* JSON data */
            data: JSON.stringify({                 /* Request body */
                email: email,
                password: password
            }),

            /* If registration succeeds */
            success: function (response) {

                /* Save token and email */
                setAuthToken(response.token, email);

                /* Show success message */
                msg.text("Registration successful! Redirecting to login...")
                   .removeClass("error loading")
                   .addClass("success");

                /* Redirect after 1.5 seconds */
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            },

            /* If registration fails */
            error: function (xhr) {

                /* Extract error message */
                const errorMsg =
                    (xhr.responseJSON && xhr.responseJSON.error)
                        ? xhr.responseJSON.error
                        : "Registration failed. Try a different email.";

                /* Show error */
                msg.text(errorMsg)
                   .removeClass("success loading")
                   .addClass("error");
            }
        });
    });
}

/* PROFILE PAGE LOGIC */

function initProfilePage() {

    /* Get profile page container */
    const page = $("#profile-page");

    /* Stop if not on profile page */
    if (page.length === 0) return;

    /* Redirect to login if not logged in */
    if (!requireLoginOrRedirect()) return;

    /* Get auth info from cookie */
    const auth = getAuth();

    /* Extract email */
    const email = auth ? auth.email : "";

    /* Get profile elements */
    const avatarEl = $("#profile-avatar");
    const nameEl = $("#profile-name");
    const emailEl = $("#profile-email");
    const phoneEl = $("#profile-phone");

    /* Load stored profile from cookie */
    const stored = readCookie("myshop_profile");

    /* Convert cookie data into object or empty object */
    let userProfile = stored ? JSON.parse(stored) : {};

    /* Display profile data on page */
    function renderProfile() {
        nameEl.text(userProfile.name || "");
        emailEl.text(email);
        phoneEl.text(userProfile.phone || "");
        avatarEl.attr(
            "src",
            userProfile.avatar || "https://reqres.in/img/faces/2-image.jpg"
        );

        /* Fill form inputs */
        $("#profile-name-input").val(userProfile.name || "");
        $("#profile-phone-input").val(userProfile.phone || "");
    }

    /* Fetch demo user data */
    $.getJSON("https://reqres.in/api/users/2", function (data) {

        const user = data.data;

        /* Fill missing data from API */
        if (!userProfile.name)
            userProfile.name = user.first_name + " " + user.last_name;

        if (!userProfile.avatar)
            userProfile.avatar = user.avatar;

        if (!userProfile.phone)
            userProfile.phone = "(555) 000-0000";

        /* Save profile to cookie */
        writeCookie("myshop_profile", JSON.stringify(userProfile), 7);

        /* Update page */
        renderProfile();

    }).fail(function () {

        /* Fallback values if API fails */
        if (!userProfile.name) userProfile.name = "Demo User";
        if (!userProfile.phone) userProfile.phone = "(555) 000-0000";

        renderProfile();
    });

    /* Handle profile form submission */
    $("#profile-form").on("submit", function (e) {

        /* Prevent page refresh */
        e.preventDefault();

        /* Save updated values */
        userProfile.name = $("#profile-name-input").val().trim();
        userProfile.phone = $("#profile-phone-input").val().trim();

        /* Save to cookie */
        writeCookie("myshop_profile", JSON.stringify(userProfile), 7);

        /* Update page */
        renderProfile();

        /* Show confirmation */
        $("#profile-message").text("Saved to cookie (front-end only).");
    });
}

/* PAGE INITIALIZATION */

/* Run when the page is fully loaded */
$(document).ready(function () {

    /* Update header account link */
    updateAccountLink();

    /* Initialize login page if present */
    initLoginPage();

    /* Initialize register page if present */
    initRegisterPage();

    /* Profile page disabled for now */
    // initProfilePage();
});