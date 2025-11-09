/**
 MoMo Press Transaction History Script

 This script manages the display, filtering, and interaction of a user's
 transaction history, including loading transactions from a dummy database,
 rendering the transaction list, calculating totals for sent and received
 amounts, and providing search and date-range filtering capabilities.

 Additional features include:
    - rendering transaction icons with dynamic styles based on amount
    - downloading a formatted transaction statement as an HTML file
    - supporting a settings modal for toggling UI features
    - managing bottom navigation button behavior and navigation
    - logging out functionality and UI event bindings

 The script updates the UI dynamically when users interact with search, date
 filters, or navigation elements.
 */


/**
 Returns HTML for an icon inside a colored circular background for transaction item
 based on amount

 @param {string} iconName - FontAwesome icon class (excluding 'fa-solid')
 @param {number} amount - transaction amount to determine +ve/-ve styling
 @returns {string} - HTML string for the icon element
 */
function getIconHTML(iconName, amount) {
    const circleClass = amount > 0 ? 'icon-circle positive' : 'icon-circle negative';
    return `<i class="${circleClass} fa-solid ${iconName}"></i>`;
}

/**
 Renders the transaction history list filtering by search text and optional start/end dates,
 and updates totals for received and sent amounts

 @param {string} filter - text filter for transaction name/phone/category
 @param {Date|null} startDate - start date for filtering transactions
 @param {Date|null} endDate - end date for filtering transactions
 */
function renderTransactions(filter = "", startDate = null, endDate = null) {
    const container = document.getElementById("transactions-list");
    let filtered = transactionsDB.filter((tx) => {
        let matchesFilter =
            tx.name.toLowerCase().includes(filter.toLowerCase()) ||
            tx.phone.includes(filter) ||
            tx.category.toLowerCase().includes(filter.toLowerCase());

        if (!matchesFilter) return false;

        if (startDate || endDate) {
            const txDate = new Date(tx.date);
            if (startDate && txDate < startDate) return false;
            if (endDate && txDate > endDate) return false;
        }
        return true;
    });

    let totalReceived = 0;
    let totalSent = 0;
    let html = filtered
        .map((tx) => {
            if (tx.amount > 0) totalReceived += tx.amount;
            else totalSent += Math.abs(tx.amount);

            return `
      <div class="transaction-card">
        <div class="card-left">
          <div class="card-title">${getIconHTML(tx.icon, tx.amount)}${tx.name}</div>
          ${tx.phone ? `<div class="card-phone">${tx.phone}</div>` : ""}
          <div class="transaction-date">${tx.time}</div>
        </div>
        <div class="card-right">
          <div class="${tx.amount > 0 ? "amount-pos" : "amount-neg"}">
            ${tx.amount > 0 ? "+" : "-"} RWF ${Math.abs(tx.amount).toLocaleString()}
          </div>
          <div class="category-badge">${tx.category}</div>
          <div class="status">${tx.status}</div>
        </div>
      </div>`;
        })
        .join("");
    container.innerHTML = html;
    document.getElementById("total-received").textContent = "RWF " + totalReceived.toLocaleString();
    document.getElementById("total-sent").textContent = "RWF " + totalSent.toLocaleString();
}

/* attach event listener for search input to filter transactions dynamically */
document.getElementById("search").addEventListener("input", (e) => {
    renderTransactions(e.target.value);
});

/* initial render of transactions on page load */
renderTransactions();

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

// remove default settings alert, if present
// only remove when settings work
settingsBtn.removeEventListener("click", () => {
    alert("Settings functionality coming soon!");
});

/* bottom nav buttons redirect without page reload */
document.querySelectorAll(".bottom-nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetUrl = link.getAttribute("href");
        if (targetUrl) {
            window.location.href = targetUrl;
        }
    });
});

/* attach download transaction statement functionality */
document.getElementById("download-btn").addEventListener("click", downloadStatement);

/* generate and download transaction statement as an HTML file styled similarly to app branding */
function downloadStatement() {
    const statementRows = transactionsDB
        .map(
            (tx) => `
      <tr>
        <td class="transaction-id">${tx.id}</td>
        <td><div>${tx.date}</div><div style="font-size:12px;color:#6b7280;">${tx.time}</div></td>
        <td><div style="font-weight:500;">${tx.name}</div>${
                tx.phone ? `<div style="font-size:12px;color:#6b7280;">${tx.phone}</div>` : ""
            }</td>
        <td><span class="category-badge">${tx.category}</span></td>
        <td class="${tx.amount > 0 ? "amount-received" : "amount-sent"}">
          ${tx.amount > 0 ? "+" : "-"} RWF ${Math.abs(tx.amount).toLocaleString()}
        </td>
        <td><span class="status-badge status-completed">${tx.status}</span></td>
      </tr>
    `
        )
        .join("");
    const now = new Date();
    const statementHTML = `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MoMo Press Transaction Statement</title>
  <style>
  /* styles for transaction statement page */
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f3f4f6; padding:40px 20px; color:#1f2937;}
  .container{max-width:900px;margin:0 auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
  .header{background:linear-gradient(135deg, #eab308 0%, #f59e0b 100%); padding:40px; color:#1f2937;}
  .header-top{display:flex; justify-content:space-between; align-items:start; margin-bottom:30px;}
  .logo{font-size:32px;font-weight:bold; color:#1f2937;}
  .logo-subtitle{font-size:14px; color:#374151; margin-top:4px;}
  .statement-info{text-align:right;}
  .statement-info h1{font-size:24px; margin-bottom:8px;}
  .statement-info p{font-size:14px; color:#374151;}
  .account-info{background:rgba(0,0,0,0.1); padding:20px; border-radius:8px; display:grid; grid-template-columns:repeat(2,1fr); gap:15px;}
  .info-item{display:flex; flex-direction:column;}
  .info-label{font-size:12px; color:#374151; margin-bottom:4px;}
  .info-value{font-size:16px; font-weight:600; color:#1f2937;}
  .summary-section{padding:30px 40px; background:#fef3c7; border-bottom:3px solid #eab308;}
  .summary-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; text-align:center;}
  .summary-card{background:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);}
  .summary-label{font-size:14px; color:#6b7280; margin-bottom:8px;}
  .summary-value{font-size:24px; font-weight:bold;}
  .summary-value.positive{color:#10b981;}
  .summary-value.negative{color:#ef4444;}
  .summary-value.neutral{color:#1f2937;}
  .transactions-section{padding:40px;}
  .section-title{font-size:20px; font-weight:bold; margin-bottom:20px; color:#1f2937; padding-bottom:10px; border-bottom:2px solid #eab308;}
  .transaction-table{width:100%; border-collapse:collapse;}
  .transaction-table thead{background:#f9fafb;}
  .transaction-table th{text-align:left; padding:12px; font-size:13px; color:#6b7280; font-weight:600; border-bottom:2px solid #e5e7eb;}
  .transaction-table td{padding:16px 12px; border-bottom:1px solid #e5e7eb; font-size:14px;}
  .transaction-table tbody tr:hover{background:#fef3c7;}
  .transaction-id{font-family:'Courier New', monospace; color:#6b7280; font-size:12px;}
  .amount-sent{color:#ef4444; font-weight:600;}
  .amount-received{color:#10b981; font-weight:600;}
  .status-badge{display:inline-block; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:500;}
  .status-completed{background:#d1fae5; color:#065f46;}
  .category-badge{display:inline-block; padding:4px 10px; border-radius:8px; font-size:11px; background:#fef3c7; color:#92400e; font-weight:500;}
  .footer{padding:30px 40px; background:#f9fafb; border-top:2px solid #e5e7eb; text-align:center;}
  .footer p{font-size:13px; color:#6b7280; margin-bottom:8px;}
  .footer .important{font-weight:600; color:#1f2937;}
  @media print{body{background:#fff; padding:0;} .container{box-shadow:none;}}
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-top">
          <div>
            <div class="logo">MoMo Press</div>
            <div class="logo-subtitle">Mobile Money Management</div>
          </div>
          <div class="statement-info">
            <h1>Transaction Statement</h1>
            <p>Generated: ${now.toLocaleDateString("en-GB")}</p>
            <p style="margin-top:4px;">${now.toLocaleTimeString("en-GB")}</p>
          </div>
        </div>
        <div class="account-info">
          <div class="info-item">
            <span class="info-label">Account Name</span>
            <span class="info-value">MoMo Press User</span>
          </div>
          <div class="info-item">
            <span class="info-label">Account Number</span>
            <span class="info-value">078XXXXXXX</span>
          </div>
          <div class="info-item">
            <span class="info-label">Statement Period</span>
            <span class="info-value">Last 30 Days</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Transactions</span>
            <span class="info-value">${transactionsDB.length}</span>
          </div>
        </div>
      </div>
      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Received</div>
            <div class="summary-value positive">
              + RWF ${transactionsDB.filter((tx) => tx.amount > 0).reduce((a, b) => a + b.amount, 0).toLocaleString()}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Sent</div>
            <div class="summary-value negative">
              - RWF ${transactionsDB.filter((tx) => tx.amount < 0).reduce((a, b) => a + b.amount, 0).toLocaleString().replace("-", "")}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Net Balance</div>
            <div class="summary-value ${
        transactionsDB.reduce((a, b) => a + b.amount, 0) >= 0 ? "positive" : "negative"
    }">
              RWF ${Math.abs(transactionsDB.reduce((a, b) => a + b.amount, 0)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      <div class="transactions-section">
        <h2 class="section-title">Transaction History</h2>
        <table class="transaction-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${statementRows}
          </tbody>
        </table>
      </div>
      <div class="footer">
        <p class="important">This is a computer-generated statement and does not require a signature</p>
        <p>For any queries or disputes, please contact MoMo Press Support</p>
        <p>Email: <a href="mailto:support@momopress.rw">support@momopress.rw</a> | Phone: *182# or call 100</p>
        <p style="margin-top: 15px;">MoMo Press - Powered by MTN Mobile Money Rwanda</p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 8px;">
          This statement is confidential and intended for the addressee only
        </p>
      </div>
    </div>
  </body>
  </html>`;

    const blob = new Blob([statementHTML], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "MoMo_Transaction_Statement.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

