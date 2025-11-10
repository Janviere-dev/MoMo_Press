// SETTINGS MODAL FUNCTIONALITY
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-backdrop");
const closeSettingsBtn = document.getElementById("close-settings");
const spendingToggle = document.getElementById("spending-toggle");
const logoutBtn = document.getElementById("logout-btn");

// Open settings modal
settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "flex";
    settingsBackdrop.style.display = "block";
});

// Close settings modal
function closeSettings() {
    settingsModal.style.display = "none";
    settingsBackdrop.style.display = "none";
}

closeSettingsBtn.addEventListener("click", closeSettings);
settingsBackdrop.addEventListener("click", closeSettings);

// Spending breakdown toggle
function updateSpendingVisibility() {
    const spendingNav = document.querySelector('.bottom-nav-link[href="spending.html"]');
    if (spendingNav) {
        if (spendingToggle.checked) {
            spendingNav.style.display = "flex";
        } else {
            spendingNav.style.display = "none";
        }
    }
}

spendingToggle.addEventListener("change", updateSpendingVisibility);
updateSpendingVisibility();

// Logout functionality
logoutBtn.addEventListener("click", function () {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
});