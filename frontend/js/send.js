// // Modal and settings variables
// const settingsBtn = document.getElementById("settings-btn");
// const settingsModal = document.getElementById("settings-modal");
// const settingsBackdrop = document.getElementById("settings-backdrop");
// const closeSettingsBtn = document.getElementById("close-settings");
// const spendingToggle = document.getElementById("spending-toggle");
// const logoutBtn = document.getElementById("logout-btn");
//
// let currentTab = 'phone';
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
//     if (spendingNav) spendingNav.style.display = spendingToggle.checked ? "flex" : "none";
// });
// spendingToggle.dispatchEvent(new Event("change"));
//
// logoutBtn.addEventListener("click", () => {
//     if (confirm("Are you sure you want to log out?")) window.location.href = "login.html";
// });

/* --- New Change: settings modal functionality */
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

// Tab switch function
function switchTab(tab) {
    currentTab = tab;
    document.getElementById('phoneTab').classList.toggle('active', tab === 'phone');
    document.getElementById('merchantTab').classList.toggle('active', tab === 'merchant');
    document.getElementById('phoneForm').classList.toggle('active', tab === 'phone');
    document.getElementById('merchantForm').classList.toggle('active', tab === 'merchant');
    clearErrors();
}

// Quick amount buttons
function setAmount(value) {
    document.getElementById('amount').value = value;
    clearError('amountError');
}

// Validation functions
function validatePhone(phone) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(cleanPhone);
}

function validateMerchantCode(code) {
    return code && code.length >= 4 && code.length <= 8 && /^\d+$/.test(code);
}

function validateAmount(amount) {
    return amount && amount > 0;
}

// Show and clear errors
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    const input = document.getElementById(id.replace('Error', ''));
    if (input) input.classList.add('error');
}

function clearError(id) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = '';
    const input = document.getElementById(id.replace('Error', ''));
    if (input) input.classList.remove('error');
}

function clearErrors() {
    clearError('phoneError');
    clearError('merchantError');
    clearError('amountError');
}

// Fetch transactions and update window.transactionsDB
async function fetchTransactions(year = 2024, month = 5) {
    const response = await fetch(`/api/updateTransactions?year=${year}&month=${month}`);
    if (!response.ok) {
        throw new Error("Failed to fetch transactions");
    }
    await response.json();
    if (!window.transactionsDB) {
        throw new Error("Transactions data missing");
    }
    return window.transactionsDB;
}

// Render recent transactions where amount < 0 (sent money)
function renderRecentTransactions() {
    const recentList = document.getElementById('recentList');
    if (!window.transactionsDB || !recentList) return;

    const sends = window.transactionsDB.filter(tx => tx.amount < 0);

    if (sends.length === 0) {
        recentList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No recent transactions</p>';
        return;
    }

    recentList.innerHTML = sends.slice(0, 10).map(tx => `
        <div class="recent-item" title="Sent to ${tx.name} - ${tx.phone}">
            <div class="recent-info">
                <div class="recent-name">${tx.name}</div>
                <div class="recent-phone">${tx.phone || ''}</div>
            </div>
            <div class="contact-badge">Sent</div>
        </div>
    `).join('');
}

// Send money logic with validation and UI feedback
async function sendMoney() {
    clearErrors();

    let recipient = '';
    let recipientType = '';
    let isValid = true;

    if (currentTab === 'phone') {
        const phone = document.getElementById('phoneNumber').value.trim();
        if (!phone) {
            showError('phoneError', 'Please enter a phone number');
            isValid = false;
        } else if (!validatePhone(phone)) {
            showError('phoneError', 'Invalid phone number. Must be 10-15 digits');
            isValid = false;
        } else {
            recipient = phone;
            recipientType = 'Money Transfer';
        }
    } else {
        const code = document.getElementById('merchantCode').value.trim();
        if (!code) {
            showError('merchantError', 'Please enter a merchant code');
            isValid = false;
        } else if (!validateMerchantCode(code)) {
            showError('merchantError', 'Invalid merchant code. Must be 4-8 digits');
            isValid = false;
        } else {
            recipient = code;
            recipientType = 'Merchant Payment';
        }
    }

    const amount = parseFloat(document.getElementById('amount').value);
    if (!amount) {
        showError('amountError', 'Please enter an amount');
        isValid = false;
    } else if (!validateAmount(amount)) {
        showError('amountError', 'Amount must be greater than 0');
        isValid = false;
    }

    if (!isValid) return;

    showProcessingModal(amount, recipient);

    try {
        const result = await processTransaction(recipient, amount, recipientType);
        closeProcessingModal();
        setTimeout(() => {
            showSuccessModal(result);
        }, 300);
        saveRecentTransaction(recipient, recipientType);
        clearForm();
    } catch (error) {
        closeProcessingModal();
        alert('Transaction failed: ' + error.message);
    }
}

// Simulate API transaction
async function processTransaction(recipient, amount, type) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const currentBalance = 487350;
    const newBalance = currentBalance - amount;
    const transactionId = 'MPR' + Date.now();
    const now = new Date();
    return {
        recipient: recipient,
        amount: amount,
        type: type,
        transactionId: transactionId,
        date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        newBalance: newBalance
    };
}

function showProcessingModal(amount, recipient) {
    const modal = document.getElementById('processingModal');
    const text = document.getElementById('processingText');
    text.textContent = `Sending RWF ${amount.toLocaleString()} to ${recipient}...`;
    modal.classList.add('active');
}

function closeProcessingModal() {
    const modal = document.getElementById('processingModal');
    modal.classList.remove('active');
}

function showSuccessModal(result) {
    const modal = document.getElementById('successModal');
    document.getElementById('successAmount').textContent = `RWF ${result.amount.toLocaleString()}`;
    document.getElementById('successRecipient').textContent = result.recipient;
    document.getElementById('successType').textContent = result.type;
    document.getElementById('successDateTime').innerHTML = `${result.date}<br>${result.time}`;
    document.getElementById('successBalance').textContent = `RWF ${result.newBalance.toLocaleString()}`;
    document.getElementById('transactionId').textContent = result.transactionId;
    const phoneRow = document.getElementById('phoneNumberRow');
    if (result.type === 'Money Transfer') {
        phoneRow.style.display = 'flex';
        document.getElementById('successPhone').textContent = result.recipient;
    } else {
        phoneRow.style.display = 'none';
    }
    modal.classList.add('active');
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('active');
}

function downloadReceipt() {
    const amount = document.getElementById('successAmount').textContent;
    const recipient = document.getElementById('successRecipient').textContent;
    const type = document.getElementById('successType').textContent;
    const dateTime = document.getElementById('successDateTime').textContent;
    const balance = document.getElementById('successBalance').textContent;
    const transactionId = document.getElementById('transactionId').textContent;
    const receiptContent = `
MoMo Press - Transaction Receipt
================================

Transaction Successful!

Amount Sent: ${amount}
Recipient: ${recipient}
Type: ${type}
Date & Time: ${dateTime.replace('<br>', ' ')}
New Balance: ${balance}

Transaction ID: ${transactionId}

Thank you for using MoMo Press
Powered by MTN Mobile Money
    `.trim();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveRecentTransaction(recipient, type) {
    let recentTransactions = JSON.parse(localStorage.getItem('recentTransactions') || '[]');
    const existingIndex = recentTransactions.findIndex(t => t.recipient === recipient);
    if (existingIndex !== -1) {
        const existing = recentTransactions.splice(existingIndex, 1)[0];
        recentTransactions.unshift(existing);
    } else {
        recentTransactions.unshift({
            recipient: recipient,
            type: type,
            name: type === 'Money Transfer' ? 'Phone Number' : 'Merchant',
            date: new Date().toISOString()
        });
    }
    recentTransactions = recentTransactions.slice(0, 10);
    localStorage.setItem('recentTransactions', JSON.stringify(recentTransactions));
    loadRecentTransactions();
}

function loadRecentTransactions() {
    const recentList = document.getElementById('recentList');
    const recentTransactions = JSON.parse(localStorage.getItem('recentTransactions') || '[]');
    if (recentTransactions.length === 0) {
        recentList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No recent transactions</p>';
        return;
    }
    recentList.innerHTML = recentTransactions.map(t => `
        <div class="recent-item" onclick='fillFromRecent(${JSON.stringify(t)})'>
            <div class="recent-info">
                <div class="recent-name">${t.name}</div>
                <div class="recent-phone">${t.recipient}</div>
            </div>
            <div class="contact-badge">Contact</div>
        </div>
    `).join('');
}

function fillFromRecent(transaction) {
    if (transaction.type === 'Money Transfer') {
        switchTab('phone');
        document.getElementById('phoneNumber').value = transaction.recipient;
    } else {
        switchTab('merchant');
        document.getElementById('merchantCode').value = transaction.recipient;
    }
    document.getElementById('amount').focus();
}

// Clear form
function clearForm() {
    document.getElementById('phoneNumber').value = '';
    document.getElementById('merchantCode').value = '';
    document.getElementById('amount').value = '';
    clearErrors();
}

window.addEventListener('load', () => {
    loadRecentTransactions();
    document.getElementById('phoneNumber').addEventListener('input', () => clearError('phoneError'));
    document.getElementById('merchantCode').addEventListener('input', () => clearError('merchantError'));
    document.getElementById('amount').addEventListener('input', () => clearError('amountError'));

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMoney();
    });
});
