const apiBase = 'http://localhost:5000';

let currentFarmerId = null;
let currentFarmerName = null;
let currentEditingBankId = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    loadFarmersList();
    setupEventListeners();
});

function setupEventListeners() {
    // Setup DB button
    document.getElementById('setup-db-btn').addEventListener('click', setupDatabase);
    
    // Farmer selection
    document.getElementById('farmer-select-form').addEventListener('submit', handleFarmerSelection);
    
    // Account form
    document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
    
    // Transaction form
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);
    
    // Transaction type change - show/hide transfer destination
    document.getElementById('Transaction_Type').addEventListener('change', function() {
        const toAccount = document.getElementById('To_Bank_ID');
        if (this.value === 'Transfer') {
            toAccount.style.display = 'block';
            toAccount.required = true;
        } else {
            toAccount.style.display = 'none';
            toAccount.required = false;
        }
    });
    
    // Filter form
    document.getElementById('filter-form').addEventListener('submit', handleFilterSubmit);
    
    // Edit account form
    document.getElementById('edit-account-form').addEventListener('submit', handleEditAccountSubmit);
}

// ==========================================
// DATABASE SETUP
// ==========================================

async function setupDatabase() {
    const btn = document.getElementById('setup-db-btn');
    const status = document.getElementById('setup-status');
    
    btn.disabled = true;
    btn.textContent = 'Setting up...';
    
    try {
        const res = await fetch(`${apiBase}/setup/dbobjects`, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
            status.textContent = '✓ ' + data.message;
            status.className = 'success';
        } else {
            status.textContent = '✗ ' + (data.error || 'Setup failed');
            status.className = 'error';
        }
    } catch (error) {
        console.error('Setup error:', error);
        status.textContent = '✗ Error: ' + error.message;
        status.className = 'error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Initialize Database Objects';
    }
}

// ==========================================
// FARMER SELECTION
// ==========================================

async function loadFarmersList() {
    try {
        const res = await fetch(`${apiBase}/farmers`);
        const farmers = await res.json();
        
        const dropdown = document.getElementById('farmer-dropdown');
        dropdown.innerHTML = '<option value="">-- Select a Farmer --</option>';
        
        farmers.forEach(f => {
            const option = document.createElement('option');
            option.value = f.Farmer_ID;
            option.textContent = `${f.First_Name} ${f.Last_Name} (ID: ${f.Farmer_ID})`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading farmers:', error);
        alert('Failed to load farmers list');
    }
}

async function handleFarmerSelection(e) {
    e.preventDefault();
    
    const farmerId = document.getElementById('farmer-dropdown').value;
    if (!farmerId) {
        alert('Please select a farmer');
        return;
    }
    
    try {
        const res = await fetch(`${apiBase}/farmers/${farmerId}`);
        const farmer = await res.json();
        
        currentFarmerId = farmerId;
        currentFarmerName = `${farmer.First_Name} ${farmer.Last_Name}`;
        
        document.getElementById('selected-farmer-info').innerHTML = 
            `✅ Selected: <strong>${currentFarmerName}</strong> (ID: ${farmerId}) - ${farmer.Email_ID}`;
        document.getElementById('selected-farmer-info').style.color = '#1976d2';
        
        // Load all farmer data
        await loadBankAccounts();
        await loadTransactionHistory();
    } catch (error) {
        console.error('Error loading farmer:', error);
        alert('Failed to load farmer details');
    }
}

// ==========================================
// BANK ACCOUNTS
// ==========================================

async function loadBankAccounts() {
    if (!currentFarmerId) return;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`);
        let accounts = await res.json();
        
        // Handle case where backend returns single object instead of array
        if (accounts && !Array.isArray(accounts)) {
            accounts = [accounts];
        }
        
        // Handle null or undefined
        if (!accounts) {
            accounts = [];
        }
        
        displayBankAccounts(accounts);
        updateAccountsSummary(accounts);
        populateAccountDropdowns(accounts);
    } catch (error) {
        console.error('Error loading bank accounts:', error);
        alert('Failed to load bank accounts');
    }
}

function displayBankAccounts(accounts) {
    const tbody = document.getElementById('accounts-table-body');
    tbody.innerHTML = '';
    
    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No bank accounts found</td></tr>';
        return;
    }
    
    accounts.forEach(acc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${acc.Bank_ID}</td>
            <td>${acc.Bank_Name}</td>
            <td>${acc.Account_Type}</td>
            <td>${acc.Account_Number}</td>
            <td>${acc.Branch}</td>
            <td>${acc.IFSC}</td>
            <td class="text-right">₹${parseFloat(acc.Account_Balance || 0).toFixed(2)}</td>
            <td>${acc.Is_Primary ? '<span class="badge badge-primary">Primary</span>' : '<span class="badge">Secondary</span>'}</td>
            <td>
                ${!acc.Is_Primary ? `<button onclick="setPrimaryAccount(${acc.Bank_ID})">Set Primary</button>` : ''}
                <button onclick="editAccount(${acc.Bank_ID})">Edit</button>
                <button onclick="deleteAccount(${acc.Bank_ID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateAccountsSummary(accounts) {
    document.getElementById('total-accounts').textContent = accounts.length;
    
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.Account_Balance || 0), 0);
    document.getElementById('total-balance').textContent = `₹${totalBalance.toFixed(2)}`;
    
    const primary = accounts.find(acc => acc.Is_Primary);
    document.getElementById('primary-account').textContent = primary ? 
        `${primary.Bank_Name} (${primary.Account_Number})` : 'None';
}

function populateAccountDropdowns(accounts) {
    // For transaction form
    const txnDropdown = document.getElementById('transaction-account');
    txnDropdown.innerHTML = '<option value="">Select Account</option>';
    
    // For transfer destination
    const toDropdown = document.getElementById('To_Bank_ID');
    toDropdown.innerHTML = '<option value="">Select Destination Account</option>';
    
    accounts.forEach(acc => {
        const option1 = document.createElement('option');
        option1.value = acc.Bank_ID;
        option1.textContent = `${acc.Bank_Name} - ${acc.Account_Number} (₹${parseFloat(acc.Account_Balance || 0).toFixed(2)})`;
        txnDropdown.appendChild(option1);
        
        const option2 = option1.cloneNode(true);
        toDropdown.appendChild(option2);
    });
}

// ==========================================
// ADD/EDIT ACCOUNT
// ==========================================

function showAddAccountForm() {
    if (!currentFarmerId) {
        alert('Please select a farmer first');
        return;
    }
    
    document.getElementById('account-form-title').textContent = 'Add New Bank Account';
    document.getElementById('account-form-submit-btn').textContent = 'Add Account';
    document.getElementById('account-form').reset();
    document.getElementById('account-form-container').style.display = 'block';
    currentEditingBankId = null;
    
    // Scroll to form
    document.getElementById('account-form-container').scrollIntoView({ behavior: 'smooth' });
}

function hideAccountForm() {
    document.getElementById('account-form-container').style.display = 'none';
    document.getElementById('account-form').reset();
    currentEditingBankId = null;
}

async function handleAccountSubmit(e) {
    e.preventDefault();
    
    if (!currentFarmerId) {
        alert('No farmer selected');
        return;
    }
    
    const data = {
        Bank_Name: document.getElementById('Bank_Name').value,
        Account_Type: document.getElementById('Account_Type').value,
        Branch: document.getElementById('Branch').value,
        IFSC: document.getElementById('IFSC').value,
        Account_Number: document.getElementById('Account_Number').value,
        Account_Balance: parseFloat(document.getElementById('Account_Balance').value) || 0,
        Is_Primary: document.getElementById('Is_Primary').checked ? 1 : 0
    };
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert('Bank account added successfully!');
            hideAccountForm();
            // Force reload after a small delay to ensure DB has updated
            setTimeout(async () => {
                await loadBankAccounts();
            }, 300);
        } else {
            alert(result.error || 'Failed to add account');
        }
    } catch (error) {
        console.error('Error adding account:', error);
        alert('Failed to add bank account');
    }
}

async function editAccount(bankId) {
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`);
        let accounts = await res.json();
        
        // Handle single object response
        if (accounts && !Array.isArray(accounts)) {
            accounts = [accounts];
        }
        
        const account = accounts.find(acc => acc.Bank_ID === bankId);
        
        if (!account) {
            alert('Account not found');
            return;
        }
        
        // Fill edit form
        document.getElementById('edit-Bank_ID').value = account.Bank_ID;
        document.getElementById('edit-Bank_Name').value = account.Bank_Name;
        document.getElementById('edit-Account_Type').value = account.Account_Type;
        document.getElementById('edit-Branch').value = account.Branch;
        document.getElementById('edit-IFSC').value = account.IFSC;
        document.getElementById('edit-Account_Number').value = account.Account_Number;
        document.getElementById('edit-Account_Balance').value = account.Account_Balance || 0;
        
        // Show modal
        document.getElementById('edit-account-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading account:', error);
        alert('Failed to load account details');
    }
}

async function handleEditAccountSubmit(e) {
    e.preventDefault();
    
    const bankId = document.getElementById('edit-Bank_ID').value;
    const data = {
        Bank_Name: document.getElementById('edit-Bank_Name').value,
        Account_Type: document.getElementById('edit-Account_Type').value,
        Branch: document.getElementById('edit-Branch').value,
        IFSC: document.getElementById('edit-IFSC').value,
        Account_Number: document.getElementById('edit-Account_Number').value,
        Account_Balance: document.getElementById('edit-Account_Balance').value
    };
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank/${bankId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert('Bank account updated successfully!');
            closeEditModal();
            await loadBankAccounts();
        } else {
            alert(result.error || 'Failed to update account');
        }
    } catch (error) {
        console.error('Error updating account:', error);
        alert('Failed to update bank account');
    }
}

function closeEditModal() {
    document.getElementById('edit-account-modal').style.display = 'none';
}

async function deleteAccount(bankId) {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
        return;
    }
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank/${bankId}`, {
            method: 'DELETE'
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert('Bank account deleted successfully');
            // Reload accounts to refresh the display
            await loadBankAccounts();
            // Also reload transaction history since account is deleted
            await loadTransactionHistory();
        } else {
            alert(result.error || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete bank account');
    }
}

async function setPrimaryAccount(bankId) {
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank/${bankId}/set-primary`, {
            method: 'PUT'
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert('Primary account updated!');
            await loadBankAccounts();
        } else {
            alert(result.error || 'Failed to set primary account');
        }
    } catch (error) {
        console.error('Error setting primary:', error);
        alert('Failed to set primary account');
    }
}

// ==========================================
// TRANSACTIONS
// ==========================================

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const bankId = document.getElementById('transaction-account').value;
    if (!bankId) {
        alert('Please select an account');
        return;
    }
    
    const transactionType = document.getElementById('Transaction_Type').value;
    const data = {
        Transaction_Type: transactionType,
        Amount: parseFloat(document.getElementById('Amount').value),
        Description: document.getElementById('Description').value,
        Reference_Number: document.getElementById('Reference_Number').value
    };
    
    if (transactionType === 'Transfer') {
        data.To_Bank_ID = document.getElementById('To_Bank_ID').value;
        if (!data.To_Bank_ID) {
            alert('Please select destination account for transfer');
            return;
        }
        if (data.To_Bank_ID === bankId) {
            alert('Source and destination accounts cannot be the same');
            return;
        }
    }
    
    try {
        const res = await fetch(`${apiBase}/bank/accounts/${bankId}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert('Transaction completed successfully!');
            document.getElementById('transaction-form').reset();
            document.getElementById('To_Bank_ID').style.display = 'none';
            await loadBankAccounts();
            await loadTransactionHistory();
        } else {
            alert(result.message || result.error || 'Transaction failed');
        }
    } catch (error) {
        console.error('Error processing transaction:', error);
        alert('Failed to process transaction');
    }
}

async function loadTransactionHistory() {
    if (!currentFarmerId) return;
    
    const fromDate = document.getElementById('txn-from-date').value;
    const toDate = document.getElementById('txn-to-date').value;
    
    let url = `${apiBase}/farmers/${currentFarmerId}/bank/transactions`;
    const params = [];
    
    // Send dates in YYYY-MM-DD format without time component
    if (fromDate) {
        params.push(`from=${fromDate}`);
    }
    if (toDate) {
        params.push(`to=${toDate}`);
    }
    
    if (params.length > 0) url += '?' + params.join('&');
    
    try {
        const res = await fetch(url);
        const transactions = await res.json();
        
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        alert('Failed to load transaction history');
    }
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    tbody.innerHTML = '';
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No transactions found</td></tr>';
        return;
    }
    
    transactions.forEach(txn => {
        const tr = document.createElement('tr');
        const typeClass = getTransactionTypeClass(txn.Transaction_Type);
        const statusClass = txn.Status === 'Success' ? 'badge-success' : 'badge-danger';
        
        tr.innerHTML = `
            <td>${new Date(txn.created_at).toLocaleString()}</td>
            <td>${txn.Bank_ID}</td>
            <td class="${typeClass}">${txn.Transaction_Type}</td>
            <td class="text-right">₹${parseFloat(txn.Amount).toFixed(2)}</td>
            <td class="text-right">₹${parseFloat(txn.Balance_Before).toFixed(2)}</td>
            <td class="text-right">₹${parseFloat(txn.Balance_After).toFixed(2)}</td>
            <td>${txn.Reference_Number || '-'}</td>
            <td>${txn.Description || '-'}</td>
            <td><span class="badge ${statusClass}">${txn.Status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function getTransactionTypeClass(type) {
    switch(type) {
        case 'Deposit': return 'txn-deposit';
        case 'Withdrawal': return 'txn-withdrawal';
        case 'Transfer': return 'txn-transfer';
        case 'Policy_Disbursement': return 'txn-policy';
        case 'Tax_Payment': return 'txn-tax';
        default: return '';
    }
}

function clearTransactionFilters() {
    document.getElementById('txn-from-date').value = '';
    document.getElementById('txn-to-date').value = '';
    loadTransactionHistory();
}

// ==========================================
// FILTER & REPORTS
// ==========================================

async function handleFilterSubmit(e) {
    e.preventDefault();
    
    const params = {
        name: document.getElementById('filter-name').value,
        state: document.getElementById('filter-state').value,
        minBalance: document.getElementById('filter-minBalance').value,
        maxBalance: document.getElementById('filter-maxBalance').value,
        cropType: document.getElementById('filter-cropType').value,
        taxStatus: document.getElementById('filter-taxStatus').value
    };
    
    const queryString = Object.entries(params)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
    
    try {
        const res = await fetch(`${apiBase}/bank/reports/filter?${queryString}`);
        const results = await res.json();
        
        displayFilterResults(results);
    } catch (error) {
        console.error('Error filtering:', error);
        alert('Failed to apply filters');
    }
}

function displayFilterResults(results) {
    const tbody = document.getElementById('filter-results-body');
    const section = document.getElementById('filter-results');
    
    tbody.innerHTML = '';
    section.style.display = 'block';
    
    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No results found</td></tr>';
        return;
    }
    
    results.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.Farmer_ID}</td>
            <td>${r.Farmer_Name}</td>
            <td>${r.Email_ID}</td>
            <td>${r.City}</td>
            <td>${r.State}</td>
            <td>${r.Bank_Name || '-'}</td>
            <td class="text-right">₹${parseFloat(r.Account_Balance || 0).toFixed(2)}</td>
            <td>${r.Crops || '-'}</td>
            <td>${r.Tax_Statuses || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Scroll to results
    section.scrollIntoView({ behavior: 'smooth' });
}

function resetFilters() {
    document.getElementById('filter-form').reset();
    document.getElementById('filter-results').style.display = 'none';
}

async function loadBankOverview() {
    try {
        const res = await fetch(`${apiBase}/view/farmer_bank_overview`);
        const data = await res.json();
        
        const tbody = document.getElementById('overview-results-body');
        const section = document.getElementById('overview-results');
        
        tbody.innerHTML = '';
        section.style.display = 'block';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No data found</td></tr>';
            return;
        }
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.Farmer_ID}</td>
                <td>${row.Farmer_Name}</td>
                <td>${row.Email_ID || '-'}</td>
                <td>${row.City || '-'}</td>
                <td>${row.State || '-'}</td>
                <td>${row.Bank_Name || '-'}</td>
                <td>${row.Account_Number || '-'}</td>
                <td class="text-right">₹${parseFloat(row.Account_Balance || 0).toFixed(2)}</td>
                <td class="text-right">₹${parseFloat(row.Total_Balance || 0).toFixed(2)}</td>
                <td>${row.Is_Primary ? '<span class="badge badge-primary">Yes</span>' : '<span class="badge">No</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Scroll to results
        section.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading overview:', error);
        alert('Failed to load bank overview');
    }
}

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.showAddAccountForm = showAddAccountForm;
window.hideAccountForm = hideAccountForm;
window.editAccount = editAccount;
window.deleteAccount = deleteAccount;
window.setPrimaryAccount = setPrimaryAccount;
window.closeEditModal = closeEditModal;
window.loadTransactionHistory = loadTransactionHistory;
window.clearTransactionFilters = clearTransactionFilters;
window.resetFilters = resetFilters;
window.loadBankOverview = loadBankOverview;