/**
  MoMo Press Budget and Spending Breakdown UI Script

  This script manages the logic for the spending breakdown screen.

  Features include:
     - modal toggling for general settings & budget limits
     - rendering budgeting categories
     - emergency plan input toggle linked to the block toggle and emergency icon click
     - alert display for budget exceedance with precise exceeded amounts at the top of the UI
     - animated spending donut chart and progress bars
     - dark mode toggle with theme persistence
     - downloadable detailed HTML analytics report following a predefined template
     - handling logout button and bottom nav tab visibility

  This script maintains modularity and dynamic UI reactivity according to user settings and data changes.
 */

document.addEventListener("DOMContentLoaded", () => {
    // cache modal & button elements to avoid repeated DOM queries
    const settingsBtn = document.getElementById("settings-btn");
    const budgetSettingsBtn = document.getElementById("settings-btn2");

    const settingsModal = document.getElementById("settings-modal");
    const settingsBackdrop = document.getElementById("settings-backdrop");
    const closeSettingsBtn = document.getElementById("close-settings");

    const budgetModal = document.getElementById("budgetModal");
    const budgetBackdrop = document.getElementById("budgetBackdrop");
    const budgetCancelBtn = document.getElementById("budgetCancel");
    const budgetSaveBtn = document.getElementById("budgetSave");

    // handle modal open/close 

    // show general settings modal
    settingsBtn.addEventListener("click", () => {
        settingsModal.style.display = "block";
        settingsBackdrop.style.display = "block";
    });

    // hide general settings modal
    function closeSettings() {
        settingsModal.style.display = "none";
        settingsBackdrop.style.display = "none";
    }
    closeSettingsBtn.addEventListener("click", closeSettings);
    // click backdrop to close settings modal if budget modal not open
    settingsBackdrop.addEventListener("click", () => {
        if (!budgetModal.style.display || budgetModal.style.display === "none") {
            closeSettings();
        }
    });

    // show budget limit settings modal
    budgetSettingsBtn.addEventListener("click", () => {
        renderBudgetModal();
        budgetModal.style.display = "block";
        budgetBackdrop.style.display = "block";
    });

    // hide budget limit settings modal
    function closeBudgetModal() {
        budgetModal.style.display = "none";
        budgetBackdrop.style.display = "none";
    }
    budgetCancelBtn.addEventListener("click", closeBudgetModal);
    budgetBackdrop.addEventListener("click", () => {
        if (budgetModal.style.display && budgetModal.style.display !== "none") {
            closeBudgetModal();
        }
    });

    // inject inline styles
    const style = document.createElement("style");
    style.textContent = `
    .breakdown-icon, .category-icon {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
    }
    .breakdown-icon i, .category-icon i {
      color: #fff !important; font-size: 12px !important;
      width: 12px !important; height: 12px !important;
      line-height: 1 !important; vertical-align: middle !important;
      display: inline-block !important;
    }
    .block-toggle input[type="checkbox"] {
      position: absolute; opacity: 0; width: 0; height: 0;
      margin: 0; padding: 0; overflow: hidden;
      clip: rect(0 0 0 0); clip-path: inset(50%); border: 0;
    }
    .budget-modal-content {
      display: flex; flex-direction: column; height: 100vh;
      padding: 16px 19px; box-sizing: border-box;
    }
    .budget-category-container {
      flex: 1 1 auto; overflow-y: auto;
      max-height: calc(100vh - 170px); margin-bottom: 10px;
    }
    .budget-modal-actions {
      flex-shrink: 0; display: flex; justify-content: flex-end;
      gap: 9px; padding-top: 10px; border-top: 1px solid #f0db50aa;
      background-color: inherit; box-shadow: 0 -2px 8px #f0db50aa;
      position: sticky; bottom: 0; z-index: 10;
    }
    #spending-alert-root {
      position: absolute; top: 10px; left: 50%;
      transform: translateX(-50%);
      max-width: 400px; width: 90%;
      z-index: 1200; pointer-events: auto;
    }
    .budget-alert {
      background: #fff2f2; border: 1.5px solid #d90c0c;
      border-radius: 12px; padding: 10px 15px;
      font-weight: 600; font-size: 14px;
      box-shadow: 0 2px 8px #fbbf2412;
      display: flex; align-items: center; gap: 10px;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .budget-alert i {
      font-size: 20px; color: #d90c0c;
    }
    .close-budget-alert {
      background: none; border: none; color: #d90c0c;
      font-size: 20px; cursor: pointer;
      margin-left: auto; padding: 0 7px;
    }
  `;
    document.head.appendChild(style);

    // initialize data & state

    const categories = ["Transfers", "Airtime", "Merchant", "Utilities", "Cash Out", "Others"];
    const categoryLabels = {
        Transfers: "Money Transfers",
        Airtime: "Airtime & Data",
        Merchant: "Merchant Payments",
        Utilities: "Utilities & Bills",
        "Cash Out": "Cash Out",
        Others: "Others",
    };

    let budgetSettings = {};
    categories.forEach(cat => {
        budgetSettings[cat] = {
            limit: Infinity,
            block: false,
            emergencyPlan: "",
        };
    });

    // render budget limits modal
    function renderBudgetModal() {
        const container = document.getElementById("budgetCategoryControls");
        container.innerHTML = "";
        categories.forEach(cat => {
            const budget = budgetSettings[cat];
            container.insertAdjacentHTML("beforeend", `
      <div class="budget-setting-option" style="padding: 8px 14px; margin-bottom: 8px; font-size: 13px;">
        <div class="category-budget-header" style="margin-bottom: 6px; font-size: 0.9em;">
          <span class="category-name">${categoryLabels[cat]}</span>
          <label class="block-toggle" style="gap: 5px; display: flex; align-items: center;">
            <input type="checkbox" id="block-${cat}" ${budget.block ? "checked" : ""} />
            <span class="switch-slider round"></span>
            <span class="label-text">Block</span>
          </label>
        </div>
        <div class="limit-input-row" style="gap: 5px; margin-bottom: 8px;">
          <span>RWF</span>
          <input type="number" id="limit-${cat}" class="limit-input" min="0"
            style="width: 60px; padding: 3px 6px; font-size: 13px;"
            placeholder="No limit" value="${budget.limit === Infinity ? "" : budget.limit}" />
          <span>/ month</span>
        </div>
        <div class="emergency-plan-section" style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
          <label id="emergency-label-${cat}" for="emergency-plan-${cat}"
            class="emergency-label"
            style="cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; color: #fbbf24;">
            <i class="fa-regular fa-lightbulb" title="Emergency Plan" style="font-size: 16px;"></i> Emergency Plan
          </label>
          <input type="text" id="emergency-plan-${cat}" class="emergency-plan-input"
            style="font-size: 12px; padding: 3px 6px; display: none;"
            placeholder="Describe what to do in emergency (e.g. ‘Call 100’)"
            value="${budget.emergencyPlan}" />
          <div class="emergency-note" id="emergency-note-${cat}"
            style="font-size: 11px; color: #a59d33; display: none;">
            This plan will be shown when emergency transactions are needed
          </div>
        </div>
      </div>
      `);
        });
        categories.forEach(cat => {
            const label = document.getElementById(`emergency-label-${cat}`);
            const input = document.getElementById(`emergency-plan-${cat}`);
            const note = document.getElementById(`emergency-note-${cat}`);
            const blockCheckbox = document.getElementById(`block-${cat}`);

            function updateEmergencyVisibility() {
                if (blockCheckbox.checked || input.dataset.toggled === "true") {
                    input.style.display = "block";
                } else {
                    input.style.display = "none";
                }
                note.style.display = input.dataset.toggled === "true" ? "block" : "none";
            }

            input.dataset.toggled = "false";
            input.style.display = blockCheckbox.checked ? "block" : "none";
            note.style.display = "none";

            label.addEventListener("click", e => {
                e.preventDefault();
                input.dataset.toggled = input.dataset.toggled === "true" ? "false" : "true";
                updateEmergencyVisibility();
            });

            blockCheckbox.addEventListener("change", () => {
                if (!blockCheckbox.checked) input.dataset.toggled = "false";
                updateEmergencyVisibility();
            });

            updateEmergencyVisibility();
        });
    }

    // save budget settings
    budgetSaveBtn.addEventListener("click", () => {
        categories.forEach(cat => {
            const limitInput = document.getElementById(`limit-${cat}`);
            const blockInput = document.getElementById(`block-${cat}`);
            const emergencyInput = document.getElementById(`emergency-plan-${cat}`);

            budgetSettings[cat].limit = limitInput.value.trim() === "" ? Infinity : Number(limitInput.value);
            budgetSettings[cat].block = blockInput.checked;
            budgetSettings[cat].emergencyPlan = emergencyInput.value.trim();
        });
        closeBudgetModal();
        checkBudgetAlerts();
    });

    // budget alert UI
    function showBudgetAlertUi(exceededList) {
        if (exceededList.length === 0) {
            document.getElementById("spending-alert-root").innerHTML = "";
            return;
        }
        const htmlItems = exceededList.map(({ category, amount }) =>
            `<li>${category}: exceeded by RWF ${amount.toLocaleString()}</li>`
        ).join("");
        const html = `
      <div class="budget-alert-root">
        <div class="budget-alert">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <div>
            <strong>Budget Alert!</strong><br>
            You've exceeded your limit in these categories:<br>
            <ul style="margin-top:4px; padding-left: 18px;">${htmlItems}</ul>
          </div>
          <button onclick="dismissBudgetAlert()" aria-label="Dismiss Alert" class="close-budget-alert">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
        document.getElementById("spending-alert-root").innerHTML = html;
    }

    function showBlockAlertUi(category, emergencyText) {
        const emergencyHtml = emergencyText ? `<br><div class="emergency-message">Emergency plan: ${emergencyText}</div>` : "";
        document.getElementById("spending-alert-root").innerHTML = `
      <div class="budget-alert-root">
        <div class="budget-alert">
          <i class="fa-solid fa-ban"></i>
          <div>
            <strong>Transactions Blocked</strong><br>
            You've exceeded your limit for <b>${categoryLabels[category]}</b>. All normal transactions blocked.
            ${emergencyHtml}
          </div>
          <button onclick="dismissBudgetAlert()" aria-label="Dismiss Alert" class="close-budget-alert">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>`;
    }

    // dismiss alert UI function
    window.dismissBudgetAlert = () => {
        document.getElementById("spending-alert-root").innerHTML = "";
    };

    // check budget exceedance
    function checkBudgetAlerts() {
        const exceededCategories = [];
        categories.forEach(cat => {
            const spent = window.categorySums ? window.categorySums[cat] : 0;
            if (spent > budgetSettings[cat].limit && budgetSettings[cat].limit !== Infinity) {
                if (budgetSettings[cat].block) {
                    showBlockAlertUi(cat, budgetSettings[cat].emergencyPlan);
                } else {
                    exceededCategories.push({
                        category: categoryLabels[cat],
                        amount: spent - budgetSettings[cat].limit
                    });
                }
            }
        });
        if (exceededCategories.length) showBudgetAlertUi(exceededCategories);
        else window.dismissBudgetAlert();
    }
    setInterval(checkBudgetAlerts, 2000);

    // verify transaction
    window.canPerformTransaction = function (category, amount) {
        const spent = window.categorySums ? window.categorySums[category] : 0;
        const budget = budgetSettings[category];
        if (!budget) return true;
        if (spent + amount > budget.limit && budget.limit !== Infinity) {
            if (budget.block) {
                showBlockAlertUi(category, budget.emergencyPlan);
                if (budget.emergencyPlan) {
                    return confirm(`This transaction requires emergency plan:\n${budget.emergencyPlan}`);
                } else {
                    return false;
                }
            } else {
                showBudgetAlertUi([{category: categoryLabels[category], amount: (spent + amount - budget.limit)}]);
                return true;
            }
        }
        return true;
    };

    // initialize spending & Chart UI
    function initApp() {
        if (!document.getElementById("donutChart")) return;
        if (!window.transactionsDB) window.transactionsDB = [];

        const positiveNames = new Set([
            "Sarah Uwase", "Income Salary", "James Nkusi",
            "Airtel Money", "Bank Transfer", "Salary Bonus",
        ]);
        const categoryMap = {
            Transfers: "Transfers", Merchant: "Merchant", Airtime: "Airtime",
            Utilities: "Utilities", Income: "Income",
        };
        const displayCategories = {
            Transfers: { color: "#FFCC08", iconBg: "#FFCC08", icon: '<i class="fa-solid fa-arrow-right-arrow-left"></i>' },
            Merchant: { color: "#f59e0b", iconBg: "#f59e0b", icon: '<i class="fa-solid fa-store"></i>' },
            Airtime: { color: "#10b981", iconBg: "#10b981", icon: '<i class="fa-solid fa-signal"></i>' },
            Utilities: { color: "#6fc1ff", iconBg: "#6fc1ff", icon: '<i class="fa-solid fa-file-invoice"></i>' },
            "Cash Out": { color: "#6b7280", iconBg: "#6b7280", icon: '<i class="fa-solid fa-wallet"></i>' },
            Others: { color: "#9ca3af", iconBg: "#9ca3af", icon: '<i class="fa-solid fa-ellipsis"></i>' },
        };

        let categorySums = {
            Transfers: 0, Merchant: 0, Airtime: 0, Utilities: 0, "Cash Out": 0, Others: 0,
        };

        let totalPositive = 0, totalNegative = 0;

        window.transactionsDB.forEach(tx => {
            const isPositive = positiveNames.has(tx.name) || (tx.amount > 0 && tx.category === "Income");
            if (isPositive) {
                totalPositive += tx.amount;
            } else if (tx.amount < 0) {
                const dispCat = categoryMap[tx.category] || "Others";
                if (!(dispCat in categorySums)) categorySums[dispCat] = 0;
                categorySums[dispCat] += Math.abs(tx.amount);
                totalNegative += Math.abs(tx.amount);
            }
        });
        window.categorySums = categorySums;

        // build categories UI for donut & breakdown cards
        const categoriesUI = Object.keys(categorySums).map(name => ({
            name,
            value: categorySums[name],
            color: displayCategories[name]?.color || "#9ca3af",
            iconBg: displayCategories[name]?.iconBg || "#9ca3af",
            icon: displayCategories[name]?.icon || '',
            initial: name.charAt(0),
        }));

        categoriesUI.forEach(cat => {
            cat.percent = totalNegative ? Math.round((cat.value / totalNegative) * 100) : 0;
        });

        document.getElementById("spent-amount").textContent = "RWF " + totalNegative.toLocaleString();

        // draw donut chart
        const canvas = document.getElementById("donutChart");
        const ctx = canvas.getContext("2d");
        canvas.width = 220; canvas.height = 220;
        const cx = 110, cy = 110, outer = 80, inner = 55;
        let animProgress = 0;

        function drawDonutFrame(progress) {
            const gap = Math.PI / 180 * 1; // 1 degree gap between slices
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let startAngle = Math.PI * 1.11;

            categoriesUI.forEach(cat => {
                const catFrac = cat.value / totalNegative;
                const arcLength = catFrac * 2 * Math.PI * progress;
                const arcFrac = arcLength > gap ? arcLength - gap : arcLength;
                const endAngle = startAngle + arcFrac;

                ctx.beginPath();
                ctx.arc(cx, cy, outer, startAngle, endAngle);
                ctx.arc(cx, cy, inner, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = cat.color;
                ctx.fill();

                startAngle = endAngle + gap;
            });

            ctx.font = "16px Segoe UI";
            ctx.fillStyle = document.body.classList.contains("dark-mode") ? "#ccc" : "#555";
            ctx.textAlign = "center";
            ctx.fillText("Total", cx, cy - 10);
            ctx.font = "bold 23px Segoe UI";
            ctx.fillStyle = document.body.classList.contains("dark-mode") ? "#fff" : "#555";
            ctx.fillText((totalNegative / 1000).toFixed(0) + "k", cx, cy + 15);
        }

        function animateDonut() {
            animProgress += 0.017;
            if (animProgress > 1) animProgress = 1;
            drawDonutFrame(animProgress);
            if (animProgress < 1) requestAnimationFrame(animateDonut);
        }
        animateDonut();

        // build breakdown cards with animation
        const detailsElem = document.getElementById("category-details");
        detailsElem.innerHTML = "";
        categoriesUI.forEach((cat, idx) => {
            const card = document.createElement("div");
            card.className = "breakdown-card";
            card.innerHTML = `
        <div class="breakdown-icon" style="background:${cat.iconBg}; color:${cat.color};">${cat.icon}</div>
        <div class="breakdown-main">
          <div class="breakdown-title-row">
            <span class="breakdown-cat">${cat.name}</span>
            <span class="breakdown-percent">${cat.percent}% of spending</span>
          </div>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="background:${cat.color}; width:0%" id="bar-fill-${idx}"></div>
          </div>
        </div>
        <div class="breakdown-amount">RWF ${cat.value.toLocaleString()}</div>
      `;
            detailsElem.appendChild(card);

            // animate bars visually increasing to percent
            let w = 0;
            function animateBar() {
                w += 2;
                if (w > cat.percent) w = cat.percent;
                card.querySelector(".breakdown-bar-fill").style.width = w + "%";
                if (w < cat.percent) requestAnimationFrame(animateBar);
            }
            animateBar();
        });

        // animate main progress bar
        let mainProg = 0;
        const balance = totalPositive - totalNegative;
        const balancePercent = totalPositive ? Math.min(Math.max(Math.round((balance / totalPositive) * 100), 0), 100) : 0;

        function animateMainBar() {
            mainProg++;
            if (mainProg > balancePercent) mainProg = balancePercent;
            document.getElementById("progress-fill").style.width = mainProg + "%";
            if (mainProg < balancePercent) requestAnimationFrame(animateMainBar);
        }
        animateMainBar();
    }
    initApp();

    // bottom nav spending toggle visibility
    const spendingToggle = document.getElementById("spending-toggle");
    const spendingNav = document.querySelector('.bottom-nav-link[href="spending.html"]');
    function updateSpendingVisibility() {
        spendingNav.style.display = spendingToggle.checked ? "flex" : "none";
    }
    spendingToggle.addEventListener("change", updateSpendingVisibility);
    updateSpendingVisibility();

    // dark mode theme toggle with saved preference
    const themeToggle = document.getElementById("theme-toggle");
    if (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
        document.body.classList.add("dark-mode");
        themeToggle.checked = true;
    }
    themeToggle.addEventListener("change", () => {
        if (themeToggle.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    });

    // handle logout button
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.addEventListener("click", () => {
        window.location.href = "html/login.html";
    });

    // download a HTML report of analytics:
    // include:
    //      budget alerts with exceeded amount details
    //      summary cards & category breakdown
    //      styles provided in predefined template

    document.getElementById("download-analytics").addEventListener("click", () => {
        const now = new Date();

        const exceededCategories = [];
        const blockedCategories = [];
        categories.forEach(cat => {
            const spent = window.categorySums ? window.categorySums[cat] : 0;
            if (budgetSettings[cat] && budgetSettings[cat].limit !== Infinity && spent > budgetSettings[cat].limit) {
                if (budgetSettings[cat].block) {
                    blockedCategories.push({
                        name: categoryLabels[cat],
                        spent,
                        limit: budgetSettings[cat].limit
                    });
                } else {
                    exceededCategories.push({
                        name: categoryLabels[cat],
                        spent,
                        limit: budgetSettings[cat].limit
                    });
                }
            }
        });

        // compose alert messages HTML for report
        const alertMsgs = [];
        if (exceededCategories.length > 0) {
            const items = exceededCategories.map(c => `<li>${c.name}: exceeded by RWF ${(c.spent - c.limit).toLocaleString()}</li>`).join('');
            alertMsgs.push(`<p>Exceeded limits in:<ul>${items}</ul></p>`);
        }
        if (blockedCategories.length > 0) {
            const items = blockedCategories.map(c => `<li>${c.name}: exceeded by RWF ${(c.spent - c.limit).toLocaleString()}</li>`).join('');
            alertMsgs.push(`<p>Blocked categories:<ul>${items}</ul></p>`);
        }
        if (alertMsgs.length === 0) alertMsgs.push(`<p>All budget limits respected.</p>`);

        const alertsHTML = `
      <div class="alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <h4>Budget Alert!</h4>
          ${alertMsgs.join('')}
        </div>
      </div>`;

        // compose summary cards for report download
        const summaryCardsHTML = `
      <div class="summary-cards">
        <div class="card">
          <h3>Total Spent</h3>
          <div class="value">RWF ${window.categorySums ? Object.values(window.categorySums).reduce((a,b) => a + b, 0).toLocaleString() : "0"}</div>
          <div class="subvalue">This month</div>
        </div>
        <div class="card">
          <h3>Transactions</h3>
          <div class="value">${categories.length}</div>
          <div class="subvalue">Categories tracked</div>
        </div>
        <div class="card">
          <h3>Top Category</h3>
          <div class="value">${categories.reduce((max, c) => {
            const csums = window.categorySums || {};
            return (csums[c] || 0) > (csums[max] || 0) ? c : max;
        }, categories[0])}</div>
          <div class="subvalue">${categories.reduce((max, c) => {
            const csums = window.categorySums || {};
            return (csums[c] || 0) > (csums[max] || 0) ? c : max;
        }, categories[0])} % of total spending</div>
        </div>
        <div class="card">
          <h3>Average Weekly</h3>
          <div class="value">RWF ${window.categorySums ? (Object.values(window.categorySums).reduce((a,b) => a + b, 0) / 4).toLocaleString() : "0"}</div>
          <div class="subvalue">~4 weeks</div>
        </div>
      </div>`;

        // compose category details with over budget flags for download report
        const categoriesHTML = categories.map(cat => {
            const valueNum = window.categorySums ? window.categorySums[cat] : 0;
            const displayCategories = {
                Transfers: "#eab308",
                Airtime: "#f59e0b",
                Merchant: "#fbbf24",
                Utilities: "#10b981",
                "Cash Out": "#6b7280",
                Others: "#9ca3af"
            };
            const colorRgb = displayCategories[cat] || '#999';
            const isBlocked = blockedCategories.find(c => c.name === categoryLabels[cat]);
            const isExceeded = exceededCategories.find(c => c.name === categoryLabels[cat]);

            return `<div class="category-item" style="border-left-color: ${colorRgb};">
    <div class="category-info">
      <div class="category-icon" style="background-color: ${colorRgb}; color:#fff;">${cat.charAt(0)}</div>
      <div class="category-details" style="color:#1f2937;">
        <h4>${categoryLabels[cat]} ${isBlocked ? '⚠️' : ''}</h4>
        <p>${((valueNum / Object.values(window.categorySums).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}% of total spending ${isBlocked ? `• Budget: RWF ${budgetSettings[cat].limit.toLocaleString()}` : ''}</p>
        ${isExceeded ? `<p style="color: #dc2626; font-weight: 600;">Over budget by RWF ${(valueNum - budgetSettings[cat].limit).toLocaleString()}</p>` : ''}
      </div>
    </div>
    <div class="category-amount" style="text-align: right;">
      <div class="amount" style="${isExceeded || isBlocked ? 'color: #dc2626;' : 'color: #1f2937;'}">RWF ${valueNum.toLocaleString()}</div>
      <div class="percentage" style="color:#6b7280;">${((valueNum / Object.values(window.categorySums).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</div>
    </div>
  </div>`;
        }).join('');

        // assemble full HTML document for download
        const fullHTML = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MoMo Press Analytics Report</title>
        <style>
          * {margin:0;padding:0;box-sizing:border-box;}
          body {font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:linear-gradient(135deg,#fef3c7 0%,#f3f4f6 100%);padding:40px 20px;color:#1f2937;}
          .container {max-width:1000px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.1);overflow:hidden;}
          .header {background:linear-gradient(135deg,#eab308 0%,#f59e0b 100%);padding:40px;text-align:center;color:#1f2937;}
          .header h1{font-size:32px;font-weight:700;margin-bottom:8px;}
          .header p{font-size:16px;opacity:.9;margin-top:8px;}
          .content{padding:40px;}
          .summary-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:40px;}
          .card{background:linear-gradient(135deg,#f9fafb 0%,#fff 100%);padding:24px;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,.05);}
          .card h3{font-size:14px;color:#6b7280;margin-bottom:8px;font-weight:500;}
          .card .value{font-size:28px;font-weight:700;color:#1f2937;}
          .card .subvalue{font-size:14px;color:#9ca3af;margin-top:4px;}
          .section{margin-bottom:40px;}
          .section h2{font-size:24px;font-weight:700;margin-bottom:20px;color:#1f2937;padding-bottom:12px;border-bottom:3px solid #eab308;}
          .category-list{display:grid;gap:16px;}
          .category-item{background:#f9fafb;padding:20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid;}
          .category-info{display:flex;align-items:center;gap:16px;}
          .category-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;}
          .category-details h4{font-size:16px;font-weight:600;margin-bottom:4px;}
          .category-details p{font-size:14px;color:#6b7280;}
          .category-amount{text-align:right;}
          .category-amount .amount{font-size:20px;font-weight:700;margin-bottom:4px;}
          .category-amount .percentage{font-size:14px;color:#6b7280;}
          .alert{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;gap:12px;}
          .alert-icon{color:#dc2626;font-size:20px;}
          .alert-content h4{color:#dc2626;font-size:16px;font-weight:600;margin-bottom:4px;}
          .alert-content p{color:#991b1b;font-size:14px;}
          .footer{background:#f9fafb;padding:24px 40px;text-align:center;color:#6b7280;font-size:14px;border-top:1px solid #e5e7eb;}
          @media print {body{background:#fff;padding:0;}.container{box-shadow:none;}}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 MoMo Press Analytics</h1>
            <p>Monthly Spending Report - ${now.toLocaleDateString()}</p>
            <p style="margin-top: 8px; font-size: 14px;">Generated on ${now.toLocaleDateString()}</p>
          </div>
          <div class="content">
            ${alertsHTML}
            <div class="summary-cards">${summaryCardsHTML}</div>
            <div class="section">
              <h2>Category Details</h2>
              <div class="category-list">${categoriesHTML}</div>
            </div>
          </div>
          <div class="footer">
            <p><strong>MoMo Press</strong> - Your Mobile Money Management Assistant</p>
            <p style="margin-top: 8px;">This report is generated automatically based on your transaction history.</p>
          </div>
        </div>
      </body>
      </html>`;

        // create blob & trigger download
        const blob = new Blob([fullHTML], {type: "text/html"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "MoMo_Press_Analytics_Report.html";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
    });
});

