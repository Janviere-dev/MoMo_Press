// // Settings modal, toggle, logout setup
// const settingsBtn = document.getElementById("settings-btn");
// const settingsModal = document.getElementById("settings-modal");
// const settingsBackdrop = document.getElementById("settings-backdrop");
// const closeSettingsBtn = document.getElementById("close-settings");
// const spendingToggle = document.getElementById("spending-toggle");
// const logoutBtn = document.getElementById("logout-btn");
//
// settingsBtn.addEventListener("click", () => {
//     settingsModal.style.display = "flex";
//     settingsBackdrop.style.display = "block";
// });
//
// function closeSettings() {
//     settingsModal.style.display = "none";
//     settingsBackdrop.style.display = "none";
// }
//
// closeSettingsBtn.addEventListener("click", closeSettings);
// settingsBackdrop.addEventListener("click", closeSettings);
//
// spendingToggle.addEventListener("change", () => {
//     const spendingNav = document.querySelector('.bottom-nav-link[href="spending.html"]');
//     if (spendingNav) {
//         spendingNav.style.display = spendingToggle.checked ? "flex" : "none";
//     }
// });
// spendingToggle.dispatchEvent(new Event("change"));
//
// logoutBtn.addEventListener("click", () => {
//     if (confirm("Are you sure you want to log out?")) window.location.href = "login.html";
// });

/* --- settings modal functionality */
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-backdrop");
const closeSettingsBtn = document.getElementById("close-settings");
const spendingToggle = document.getElementById("spending-toggle");
const logoutBtn = document.getElementById("logout-btn");

// open modal by clicking settings icon
settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "block";
    settingsBackdrop.style.display = "block";
});
// close modal using x button or backdrop
function closeSettings() {
    settingsModal.style.display = "none";
    settingsBackdrop.style.display = "none";
}
closeSettingsBtn.addEventListener("click", closeSettings);
settingsBackdrop.addEventListener("click", closeSettings);

// spending breakdown toggle
function updateSpendingVisibility() {
    // hide/show the spending nav link
    const spendingNav = document.querySelector('.bottom-nav-link[href="spending.html"]');
    if (spendingToggle.checked) {
        spendingNav.style.display = "flex";
    } else {
        spendingNav.style.display = "none";
    }
    // optionally persist toggle: localStorage.setItem('showSpending', spendingToggle.checked);
}
spendingToggle.addEventListener("change", updateSpendingVisibility);
// spendingToggle.checked = localStorage.getItem('showSpending') !== "false";
// updateSpendingVisibility();
updateSpendingVisibility(); // initial state

// dark mode toggle logic
const themeToggle = document.getElementById('theme-toggle');

// apply saved theme preference on load
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
} else if (!localStorage.getItem('theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // apply system preference if no theme saved
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
}

// handle toggle change event
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
});

// log out
logoutBtn.addEventListener("click", function () {
    // sessionStorage.clear(); localStorage.clear(); // (simulate session end)
    window.location.href = "html/login.html";
});

// Filter settings API call
const applySettingsBtn = document.getElementById("apply-settings-btn");
const yearInput = document.getElementById("filter-year-input");
const monthInput = document.getElementById("filter-month-input");

applySettingsBtn.addEventListener("click", () => {
    const year = parseInt(yearInput.value);
    const month = parseInt(monthInput.value);

    if (!year || !month || month < 1 || month > 12) {
        alert("Please enter a valid year and month.");
        return;
    }

    fetch(`/api/updateTransactions?year=${year}&month=${month}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error("Failed to update transactions.")))
        .then(() => {
            alert("Transactions updated successfully!");
            closeSettings();
            window.location.reload();
        })
        .catch(err => alert(err.message));
});

// Rendering transaction summary
function renderTransactionSummary() {
    if (!window.transactionsDB) return;
    const transactions = window.transactionsDB;
    let balance = 0;
    let monthAmount = 0;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let sentCount = 0;
    let receivedCount = 0;
    const totalTransactions = transactions.length;

    transactions.forEach(tx => {
        balance += tx.amount;
        const txDate = new Date(tx.date);
        if (txDate >= last7Days && txDate <= now) monthAmount += tx.amount;

        if (tx.amount < 0) sentCount++;
        if (tx.amount > 0) receivedCount++;
    });

    document.getElementById('availableBalance').textContent = `RWF ${balance.toFixed(2)}`;
    document.getElementById('monthAmount').textContent = `RWF ${monthAmount.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('sentCount').textContent = sentCount;
    document.getElementById('receivedCount').textContent = receivedCount;
}

// Donut chart segment rendering
function renderCharts() {
    const transactions = window.transactionsDB || [];
    let totals = { Transfers: 0, Airtime: 0, Merchants: 0, Utilities: 0 };
    let totalSpending = 0;

    transactions.forEach(tx => {
        if (tx.amount < 0) {
            const category = tx.category.toLowerCase();
            if (category.includes('transfer')) totals.Transfers += Math.abs(tx.amount);
            else if (category.includes('airtime')) totals.Airtime += Math.abs(tx.amount);
            else if (category.includes('merchant')) totals.Merchants += Math.abs(tx.amount);
            else if (category.includes('utility')) totals.Utilities += Math.abs(tx.amount);
            totalSpending += Math.abs(tx.amount);
        }
    });

    [{cat: 'Transfers', pctId: 'transfersPercent', segId: 'transfersSegment'},
        {cat: 'Airtime', pctId: 'airtimePercent', segId: 'airtimeSegment'},
        {cat: 'Merchants', pctId: 'merchantsPercent', segId: 'merchantsSegment'},
        {cat: 'Utilities', pctId: 'utilitiesPercent', segId: 'utilitiesSegment'}
    ].forEach(({cat, pctId, segId}) => {
        const val = totals[cat];
        const pct = totalSpending ? ((val / totalSpending) * 100).toFixed(0) : 0;
        document.getElementById(pctId).textContent = pct + '%';
        const seg = document.getElementById(segId);
        if (seg) seg.setAttribute('stroke-dasharray', `${(251.2 * pct) / 100} ${251.2 - (251.2 * pct) / 100}`);
    });

    document.getElementById('totalSpending').textContent = totalSpending.toFixed(0);
}

// Bar chart rendering by day of week
function renderBarChartByDay() {
    const transactions = window.transactionsDB || [];
    const daysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let dayTotals = [0,0,0,0,0,0,0];

    transactions.forEach(tx => {
        if (tx.amount < 0) {
            let txDate = new Date(tx.date);
            let dayIdx = txDate.getDay();
            dayIdx = dayIdx === 0 ? 6 : dayIdx -1;  // Monday=0 .. Sunday=6
            dayTotals[dayIdx] += Math.abs(tx.amount);
        }
    });

    const maxVal = Math.max(...dayTotals, 1);
    const barChart = document.getElementById('barChart');
    if (!barChart) return;
    barChart.innerHTML = '';

    dayTotals.forEach((val, idx) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(val / maxVal) * 100}%`;
        bar.style.background = '#FFC107';

        barContainer.appendChild(bar);

        const barLabel = document.createElement('div');
        barLabel.className = 'bar-label';
        barLabel.textContent = daysShort[idx];
        barContainer.appendChild(barLabel);

        barChart.appendChild(barContainer);
    });
}

// Load and render on window load
window.addEventListener("load", () => {
    renderTransactionSummary();
    renderCharts();
    renderBarChartByDay();
});
