const apiBase = 'http://localhost:5000';
const farmerForm = document.getElementById('farmer-form');
const farmersTableBody = document.getElementById('farmers-table-body');
const resultsInfo = document.getElementById('results-info');
const selectedFarmerInfo = document.getElementById('selected-farmer-info');

const phoneModal = document.getElementById('phone-modal');
const closeModal = document.querySelector('.close');
const farmerNameSpan = document.getElementById('farmer-name');
const phoneList = document.getElementById('phone-list');
const newPhoneInput = document.getElementById('new-phone');
const addPhoneBtn = document.getElementById('add-phone-btn');

let currentFarmerId = null;
let currentFarmerName = null;
let isEditing = false;

// Make functions global
window.deleteFarmer = deleteFarmer;
window.editFarmer = editFarmer;
window.viewPhones = viewPhones;
window.viewBank = viewBank;
window.viewCrops = viewCrops;
window.viewPolicies = viewPolicies;
window.viewTax = viewTax;
window.selectFarmer = selectFarmer;

// ==========================================
// FETCH FARMERS
// ==========================================

async function fetchFarmers() {
    try {
        const res = await fetch(`${apiBase}/farmers`);
        const farmers = await res.json();
        displayFarmers(farmers);
        resultsInfo.textContent = `Showing ${farmers.length} farmers`;
    } catch (error) {
        console.error('Error fetching farmers:', error);
        alert('Failed to fetch farmers');
    }
}

function displayFarmers(farmers) {
    farmersTableBody.innerHTML = '';
    
    if (farmers.length === 0) {
        farmersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No farmers found</td></tr>';
        return;
    }
    
    farmers.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${f.Farmer_ID}</td>
            <td>${f.First_Name} ${f.Last_Name}</td>
            <td>${f.Email_ID}</td>
            <td>${f.City}</td>
            <td>${f.State}</td>
            <td>${f.Land_Size} acres</td>
            <td>
                <button onclick="selectFarmer(${f.Farmer_ID}, '${f.First_Name} ${f.Last_Name}')">Select</button>
                <button onclick="editFarmer(${f.Farmer_ID})">Edit</button>
                <button onclick="deleteFarmer(${f.Farmer_ID})">Delete</button>
                <button onclick="viewPhones(${f.Farmer_ID}, '${f.First_Name} ${f.Last_Name}')">📞</button>
            </td>
        `;
        farmersTableBody.appendChild(tr);
    });
}

// ==========================================
// FILTER FARMERS
// ==========================================

document.getElementById('filter-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const params = {
        name: document.getElementById('searchName').value.trim(),
        minLandSize: document.getElementById('minLandSize').value,
        maxLandSize: document.getElementById('maxLandSize').value,
        taxStatus: document.getElementById('taxStatus').value,
        state: document.getElementById('state').value.trim(),
        cropType: document.getElementById('cropType').value,
        regStart: document.getElementById('regStart').value,
        regEnd: document.getElementById('regEnd').value
    };
    
    // Build query string
    const queryString = Object.entries(params)
        .filter(([_, v]) => v)
        .map(([k,v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
    
    try {
        const res = await fetch(`${apiBase}/farmers/filter?${queryString}`);
        const farmers = await res.json();
        displayFarmers(farmers);
        resultsInfo.textContent = `Found ${farmers.length} farmers matching filters`;
    } catch (error) {
        console.error('Error filtering farmers:', error);
        alert('Failed to filter farmers');
    }
});

// Reset filters
document.getElementById('resetFilters').addEventListener('click', function() {
    document.getElementById('filter-form').reset();
    fetchFarmers();
});

// ==========================================
// SELECT FARMER
// ==========================================

function selectFarmer(id, name) {
    currentFarmerId = id;
    currentFarmerName = name;
    selectedFarmerInfo.innerHTML = ` Selected: <strong>${name}</strong> (ID: ${id})`;
    selectedFarmerInfo.style.color = '#28a745';
    
    // Scroll to manage section
    document.getElementById('farmer-actions').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// ADD/UPDATE FARMER
// ==========================================

farmerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        First_Name: document.getElementById('First_Name').value,
        Last_Name: document.getElementById('Last_Name').value,
        Email_ID: document.getElementById('Email_ID').value,
        Date_of_Birth: document.getElementById('Date_of_Birth').value,
        Gender: document.getElementById('Gender').value,
        Street: document.getElementById('Street').value,
        City: document.getElementById('City').value,
        State: document.getElementById('State').value,
        PinCode: document.getElementById('PinCode').value,
        Land_Size: document.getElementById('Land_Size').value
    };

    try {
        if (isEditing && currentFarmerId) {
            // Update farmer
            await fetch(`${apiBase}/farmers/${currentFarmerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            alert('Farmer updated successfully!');
            isEditing = false;
            farmerForm.querySelector('button').textContent = "Add Farmer";
        } else {
            // Add new farmer
            const res = await fetch(`${apiBase}/farmers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            alert('Farmer added successfully! ID: ' + result.id);
        }

        farmerForm.reset();
        fetchFarmers();
    } catch (error) {
        console.error('Error saving farmer:', error);
        alert('Failed to save farmer');
    }
});

// ==========================================
// EDIT FARMER
// ==========================================

async function editFarmer(id) {
    try {
        const res = await fetch(`${apiBase}/farmers/${id}`);
        const farmer = await res.json();
        
        if (!farmer || !farmer.Farmer_ID) {
            alert("Farmer not found");
            return;
        }

        document.getElementById('First_Name').value = farmer.First_Name;
        document.getElementById('Last_Name').value = farmer.Last_Name;
        document.getElementById('Email_ID').value = farmer.Email_ID;
        document.getElementById('Date_of_Birth').value = farmer.Date_of_Birth.split('T')[0];
        document.getElementById('Gender').value = farmer.Gender;
        document.getElementById('Street').value = farmer.Street || '';
        document.getElementById('City').value = farmer.City;
        document.getElementById('State').value = farmer.State;
        document.getElementById('PinCode').value = farmer.PinCode;
        document.getElementById('Land_Size').value = farmer.Land_Size;

        currentFarmerId = id;
        isEditing = true;
        farmerForm.querySelector('button').textContent = "Update Farmer";
        
        // Scroll to form
        document.getElementById('add-farmer').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing farmer:', error);
        alert('Failed to load farmer data');
    }
}

// ==========================================
// DELETE FARMER
// ==========================================

async function deleteFarmer(id) {
    if (!confirm('Are you sure you want to delete this farmer? This will also delete all related data.')) {
        return;
    }
    
    try {
        const res = await fetch(`${apiBase}/farmers/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to delete farmer");
        } else {
            alert("Farmer deleted successfully");
            if (currentFarmerId === id) {
                currentFarmerId = null;
                currentFarmerName = null;
                selectedFarmerInfo.textContent = 'Select a farmer from the table above to manage their details';
                selectedFarmerInfo.style.color = '#666';
            }
            fetchFarmers();
        }
    } catch (error) {
        console.error('Error deleting farmer:', error);
        alert('Failed to delete farmer');
    }
}

// ==========================================
// PHONE NUMBERS
// ==========================================

async function viewPhones(id, name) {
    currentFarmerId = id;
    farmerNameSpan.textContent = name;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${id}/phones`);
        const phones = await res.json();
        
        phoneList.innerHTML = '';
        if (phones.length === 0) {
            phoneList.innerHTML = '<li>No phone numbers added</li>';
        } else {
            phones.forEach(p => {
                const li = document.createElement('li');
                li.textContent = p.Phone_Number;
                phoneList.appendChild(li);
            });
        }
        
        phoneModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching phones:', error);
        alert('Failed to fetch phone numbers');
    }
}

addPhoneBtn.addEventListener('click', async () => {
    const phone = newPhoneInput.value.trim();
    if (!phone) {
        alert('Enter a phone number');
        return;
    }
    
    try {
        await fetch(`${apiBase}/farmers/${currentFarmerId}/phones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Phone_Number: phone })
        });
        
        newPhoneInput.value = '';
        viewPhones(currentFarmerId, farmerNameSpan.textContent);
    } catch (error) {
        console.error('Error adding phone:', error);
        alert('Failed to add phone number');
    }
});

closeModal.addEventListener('click', () => {
    phoneModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === phoneModal) {
        phoneModal.style.display = 'none';
    }
});

// ==========================================
// MANAGE DETAILS - UTILITY
// ==========================================

const detailsContainer = document.getElementById('details-container');

function clearDetails() {
    detailsContainer.innerHTML = '';
}

function checkFarmerSelected() {
    if (!currentFarmerId) {
        alert('Please select a farmer first from the table above');
        return false;
    }
    return true;
}

// ==========================================
// VIEW BANK DETAILS
// ==========================================

async function viewBank() {
    if (!checkFarmerSelected()) return;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`);
        const data = res.ok ? await res.json() : null;

        clearDetails();
        detailsContainer.innerHTML = `
            <h3>🏦 Bank Details for ${currentFarmerName}</h3>
            ${data ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p><b>Bank Name:</b> ${data.Bank_Name}</p>
                    <p><b>Account Type:</b> ${data.Account_Type}</p>
                    <p><b>Branch:</b> ${data.Branch}</p>
                    <p><b>IFSC:</b> ${data.IFSC}</p>
                    <p><b>Account Number:</b> ${data.Account_Number}</p>
                </div>
            ` : `<p style="color: #999;">No bank details found.</p>`}

            <h4>Add/Update Bank Account</h4>
            <form id="bank-form" style="display: grid; gap: 10px;">
                <input type="text" placeholder="Bank Name" id="Bank_Name" required>
                <select id="Account_Type" required>
                    <option value="">Select Account Type</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                </select>
                <input type="text" placeholder="Branch" id="Branch" required>
                <input type="text" placeholder="IFSC Code" id="IFSC" maxlength="11" required>
                <input type="text" placeholder="Account Number" id="Account_Number" required>
                <button type="submit">Save Bank Details</button>
            </form>
        `;

        document.getElementById('bank-form').onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                Bank_Name: document.getElementById('Bank_Name').value,
                Account_Type: document.getElementById('Account_Type').value,
                Branch: document.getElementById('Branch').value,
                IFSC: document.getElementById('IFSC').value,
                Account_Number: document.getElementById('Account_Number').value
            };

            try {
                const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                alert(data.message);
                viewBank();
            } catch (error) {
                console.error('Error saving bank details:', error);
                alert('Failed to save bank details');
            }
        };
    } catch (error) {
        console.error('Error viewing bank:', error);
        alert('Failed to load bank details');
    }
}

// ==========================================
// VIEW CROPS
// ==========================================

async function viewCrops() {
    if (!checkFarmerSelected()) return;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/crops`);
        const crops = await res.json();

        clearDetails();
        detailsContainer.innerHTML = `
            <h3>🌾 Crops for ${currentFarmerName}</h3>
            ${crops.length > 0 ? `
                <ul style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    ${crops.map(c => `
                        <li style="margin-bottom: 10px;">
                            <b>${c.Crop_Name}</b> (${c.Type}) - Season: ${c.Season_Year}<br>
                            <small>Harvest: ${c.Harvest_Start} to ${c.Harvest_End}</small><br>
                            <small>Fertilizers: ${c.Fertilizers_Used || 'None'}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p style="color: #999;">No crops found.</p>'}

            <h4>Add New Crop</h4>
            <form id="crop-form" style="display: grid; gap: 10px;">
                <input type="text" id="Crop_Name" placeholder="Crop Name" required>
                <input type="date" id="Harvest_Start" required>
                <input type="date" id="Harvest_End" required>
                <input type="text" id="Fertilizers_Used" placeholder="Fertilizers Used">
                <select id="Type" required>
                    <option value="">Select Crop Type</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                </select>
                <button type="submit">Add Crop</button>
            </form>
        `;

        document.getElementById('crop-form').onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                Crop_Name: document.getElementById('Crop_Name').value,
                Harvest_Start: document.getElementById('Harvest_Start').value,
                Harvest_End: document.getElementById('Harvest_End').value,
                Fertilizers_Used: document.getElementById('Fertilizers_Used').value,
                Type: document.getElementById('Type').value
            };

            try {
                const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/crops`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                alert(data.message);
                viewCrops();
            } catch (error) {
                console.error('Error adding crop:', error);
                alert('Failed to add crop');
            }
        };
    } catch (error) {
        console.error('Error viewing crops:', error);
        alert('Failed to load crops');
    }
}

// ==========================================
// VIEW POLICIES
// ==========================================

async function viewPolicies() {
    if (!checkFarmerSelected()) return;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/policies`);
        const policies = await res.json();

        clearDetails();
        detailsContainer.innerHTML = `
            <h3>📋 Government Policies for ${currentFarmerName}</h3>
            ${policies.length > 0 ? `
                <ul style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    ${policies.map(p => `
                        <li style="margin-bottom: 10px;">
                            <b>${p.Scheme_Name}</b> - ₹${p.Amount_Granted}<br>
                            <small>Eligibility: ${p.Eligibility || 'N/A'}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p style="color: #999;">No policies found.</p>'}

            <h4>Grant New Policy</h4>
            <form id="policy-form" style="display: grid; gap: 10px;">
                <input type="text" id="Scheme_Name" placeholder="Scheme Name" required>
                <input type="number" id="Amount_Granted" placeholder="Amount Granted" step="0.01" required>
                <textarea id="Eligibility" placeholder="Eligibility Criteria"></textarea>
                <input type="text" id="Aadhar_Number" placeholder="Aadhar Number" maxlength="12" required>
                <input type="text" id="PAN_Number" placeholder="PAN Number" maxlength="10">
                <input type="text" id="Ration_Card" placeholder="Ration Card Number">
                <button type="submit">Grant Policy</button>
            </form>
        `;

        document.getElementById('policy-form').onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                Scheme_Name: document.getElementById('Scheme_Name').value,
                Amount_Granted: document.getElementById('Amount_Granted').value,
                Eligibility: document.getElementById('Eligibility').value,
                Aadhar_Number: document.getElementById('Aadhar_Number').value,
                PAN_Number: document.getElementById('PAN_Number').value,
                Ration_Card: document.getElementById('Ration_Card').value
            };

            try {
                const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/policies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                alert(data.message);
                viewPolicies();
            } catch (error) {
                console.error('Error adding policy:', error);
                alert('Failed to add policy');
            }
        };
    } catch (error) {
        console.error('Error viewing policies:', error);
        alert('Failed to load policies');
    }
}

// ==========================================
// VIEW TAX
// ==========================================

async function viewTax() {
    if (!checkFarmerSelected()) return;
    
    try {
        const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/tax`);
        const taxes = await res.json();

        clearDetails();
        detailsContainer.innerHTML = `
            <h3>💰 Tax Details for ${currentFarmerName}</h3>
            ${taxes.length > 0 ? `
                <ul style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    ${taxes.map(t => `
                        <li style="margin-bottom: 10px;">
                            <b>${t.Tax_Type}</b> (${t.Tax_Period}) - ₹${t.Tax_Amount}<br>
                            <small>Status: <span style="color: ${t.Current_Status === 'Paid' ? 'green' : 'red'};">${t.Current_Status}</span></small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p style="color: #999;">No tax records found.</p>'}

            <h4>Update Tax Status</h4>
            <form id="tax-form" style="display: grid; gap: 10px; max-width: 300px;">
                <select id="Current_Status" required>
                    <option value="">Select Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Exempted">Exempted</option>
                </select>
                <button type="submit">Update All Tax Status</button>
            </form>
        `;

        document.getElementById('tax-form').onsubmit = async (e) => {
            e.preventDefault();
            
            try {
                const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/tax`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        Current_Status: document.getElementById('Current_Status').value 
                    })
                });

                const data = await res.json();
                alert(data.message);
                viewTax();
            } catch (error) {
                console.error('Error updating tax:', error);
                alert('Failed to update tax status');
            }
        };
    } catch (error) {
        console.error('Error viewing tax:', error);
        alert('Failed to load tax details');
    }
}

// ==========================================
// INITIALIZE
// ==========================================

fetchFarmers();