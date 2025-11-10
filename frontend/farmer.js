document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "http://localhost:5000";
  const farmerForm = document.getElementById("farmer-form");
  const farmersTableBody = document.getElementById("farmers-table-body");
  const resultsInfo = document.getElementById("results-info");
  const selectedFarmerInfo = document.getElementById("selected-farmer-info");
  const detailsContainer = document.getElementById("details-container");

  const phoneModal = document.getElementById("phone-modal");
  const closeModal = document.querySelector(".close");
  const farmerNameSpan = document.getElementById("farmer-name");
  const phoneList = document.getElementById("phone-list");
  const newPhoneInput = document.getElementById("new-phone");
  const addPhoneBtn = document.getElementById("add-phone-btn");

  let currentFarmerId = null;
  let currentFarmerName = null;
  let isEditing = false;

  // ============== FETCH FARMERS =================
  async function fetchFarmers() {
    try {
      const res = await fetch(`${apiBase}/farmers`);
      const farmers = await res.json();
      displayFarmers(farmers);
      resultsInfo.textContent = `Found ${farmers.length} farmers`;
    } catch (err) {
      console.error("Error fetching farmers:", err);
    }
  }

  function displayFarmers(list) {
    farmersTableBody.innerHTML = "";
    if (!list.length) {
      farmersTableBody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;">No farmers found</td></tr>`;
      return;
    }
    list.forEach((f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.Farmer_ID}</td>
        <td>${f.First_Name} ${f.Last_Name}</td>
        <td>${f.Email_ID}</td>
        <td>${f.City}</td>
        <td>${f.State}</td>
        <td>${f.Land_Size}</td>
        <td>
          <button onclick="selectFarmer(${f.Farmer_ID}, '${f.First_Name} ${f.Last_Name}')">Select</button>
          <button onclick="editFarmer(${f.Farmer_ID})">Edit</button>
          <button onclick="deleteFarmer(${f.Farmer_ID})">Delete</button>
        </td>`;
      farmersTableBody.appendChild(tr);
    });
  }

  // ============== FILTER ========================
  document.getElementById("filter-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const params = {
      name: searchName.value.trim(),
      minLandSize: minLandSize.value,
      maxLandSize: maxLandSize.value,
      taxStatus: taxStatus.value,
      state: state.value.trim(),
      cropType: cropType.value,
      regStart: regStart.value,
      regEnd: regEnd.value,
    };
    const qs = Object.entries(params)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    const res = await fetch(`${apiBase}/farmers/filter?${qs}`);
    const farmers = await res.json();
    displayFarmers(farmers);
    resultsInfo.textContent = `Found ${farmers.length} farmers matching filters`;
  });
  resetFilters.onclick = () => {
    filterForm.reset();
    fetchFarmers();
  };

  // ============== SELECT FARMER =================
  window.selectFarmer = (id, name) => {
    currentFarmerId = id;
    currentFarmerName = name;
    selectedFarmerInfo.innerHTML = `Selected: <b>${name}</b> (ID:${id})`;
  };

  // ============== ADD / UPDATE FARMER ============
  farmerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      First_Name: First_Name.value,
      Last_Name: Last_Name.value,
      Email_ID: Email_ID.value,
      Date_of_Birth: Date_of_Birth.value,
      Gender: Gender.value,
      Street: Street.value,
      City: City.value,
      State: State.value,
      PinCode: PinCode.value,
      Land_Size: Land_Size.value,
    };
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${apiBase}/farmers/${currentFarmerId}`
        : `${apiBase}/farmers`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert(isEditing ? "Farmer updated!" : "Farmer added!");
      farmerForm.reset();
      isEditing = false;
      fetchFarmers();
    } catch (err) {
      console.error(err);
    }
  });

  // ============== EDIT / DELETE FARMER ===========
  window.editFarmer = async (id) => {
    const f = await (await fetch(`${apiBase}/farmers/${id}`)).json();
    Object.entries({
      First_Name: f.First_Name,
      Last_Name: f.Last_Name,
      Email_ID: f.Email_ID,
      Date_of_Birth: f.Date_of_Birth.split("T")[0],
      Gender: f.Gender,
      Street: f.Street,
      City: f.City,
      State: f.State,
      PinCode: f.PinCode,
      Land_Size: f.Land_Size,
    }).forEach(([k, v]) => (document.getElementById(k).value = v || ""));
    currentFarmerId = id;
    isEditing = true;
  };

  window.deleteFarmer = async (id) => {
    if (!confirm("Delete this farmer?")) return;
    await fetch(`${apiBase}/farmers/${id}`, { method: "DELETE" });
    fetchFarmers();
  };

  // ============== UTILS ==========================
  function clearDetails() {
    detailsContainer.innerHTML = "";
  }
  function checkSelected() {
    if (!currentFarmerId) {
      alert("Please select a farmer first!");
      return false;
    }
    return true;
  }

  // ============== BANK DETAILS ===================
  window.viewBank = async () => {
    if (!checkSelected()) return;
    clearDetails();
    try {
      const res = await fetch(`${apiBase}/farmers/${currentFarmerId}/bank`);
      let accounts = await res.json();
      if (!Array.isArray(accounts)) accounts = [accounts];
      const total = accounts.reduce(
        (sum, a) => sum + parseFloat(a.Account_Balance || 0),
        0
      );
      detailsContainer.innerHTML = `
        <h3>🏦 Bank Accounts for ${currentFarmerName}</h3>
        ${
          accounts.length
            ? `<table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f1f5f9;">
                  <tr><th>Bank</th><th>Type</th><th>Acc No.</th><th>Branch</th><th>IFSC</th><th>Balance</th><th>Primary</th></tr>
                </thead>
                <tbody>
                  ${accounts
                    .map(
                      (a) => `
                    <tr>
                      <td>${a.Bank_Name}</td>
                      <td>${a.Account_Type}</td>
                      <td>${a.Account_Number}</td>
                      <td>${a.Branch}</td>
                      <td>${a.IFSC}</td>
                      <td>₹${parseFloat(a.Account_Balance || 0).toFixed(2)}</td>
                      <td>${a.Is_Primary ? "✅" : "—"}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
              <p><b>Total Balance:</b> ₹${total.toFixed(2)}</p>`
            : `<p>No accounts found.</p>`
        }`;
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // ============== CROPS ==========================
  window.viewCrops = async () => {
    if (!checkSelected()) return;
    clearDetails();
    const crops = await (await fetch(`${apiBase}/farmers/${currentFarmerId}/crops`)).json();
    detailsContainer.innerHTML = `
      <h3>🌾 Crops for ${currentFarmerName}</h3>
      ${
        crops.length
          ? `<table style="width:100%;">
              <tr><th>Name</th><th>Type</th><th>Season</th><th>Fertilizers</th></tr>
              ${crops.map(c=>`<tr><td>${c.Crop_Name}</td><td>${c.Type}</td><td>${c.Season_Year}</td><td>${c.Fertilizers_Used}</td></tr>`).join("")}
            </table>`
          : `<p>No crops found.</p>`
      }`;
  };

  // ============== POLICIES =======================
  window.viewPolicies = async () => {
    if (!checkSelected()) return;
    clearDetails();
    const policies = await (await fetch(`${apiBase}/farmers/${currentFarmerId}/policies`)).json();
    detailsContainer.innerHTML = `
      <h3>📋 Policies for ${currentFarmerName}</h3>
      ${
        policies.length
          ? `<table style="width:100%;">
              <tr><th>Scheme</th><th>Amount</th><th>Eligibility</th></tr>
              ${policies.map(p=>`<tr><td>${p.Scheme_Name}</td><td>₹${p.Amount_Granted}</td><td>${p.Eligibility}</td></tr>`).join("")}
            </table>`
          : `<p>No policies found.</p>`
      }`;
  };

  // ============== TAX ============================
  window.viewTax = async () => {
    if (!checkSelected()) return;
    clearDetails();
    const taxes = await (await fetch(`${apiBase}/farmers/${currentFarmerId}/tax`)).json();
    detailsContainer.innerHTML = `
      <h3>💰 Tax Details for ${currentFarmerName}</h3>
      ${
        taxes.length
          ? `<table style="width:100%;">
              <tr><th>Type</th><th>Period</th><th>Amount</th><th>Status</th><th>Due Date</th></tr>
              ${taxes.map(t=>`
                <tr>
                  <td>${t.Tax_Type}</td>
                  <td>${t.Tax_Period}</td>
                  <td>₹${t.Tax_Amount}</td>
                  <td>${t.Current_Status}</td>
                  <td>${t.Due_Date?.split("T")[0]}</td>
                </tr>`).join("")}
            </table>`
          : `<p>No tax records found.</p>`
      }`;
  };

  // ============== PHONES =========================
  window.viewPhones = async () => {
    if (!checkSelected()) return;
    farmerNameSpan.textContent = currentFarmerName;
    const phones = await (await fetch(`${apiBase}/farmers/${currentFarmerId}/phones`)).json();
    phoneList.innerHTML = phones.length
      ? phones.map((p) => `<li>${p.Phone_Number}</li>`).join("")
      : "<li>No phone numbers found.</li>";
    phoneModal.style.display = "block";
  };

  addPhoneBtn.addEventListener("click", async () => {
    const phone = newPhoneInput.value.trim();
    if (!phone) return alert("Enter a phone number");
    await fetch(`${apiBase}/farmers/${currentFarmerId}/phones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Phone_Number: phone }),
    });
    newPhoneInput.value = "";
    viewPhones();
  });

  closeModal.onclick = () => (phoneModal.style.display = "none");
  window.onclick = (e) => {
    if (e.target === phoneModal) phoneModal.style.display = "none";
  };

  // Initialize
  fetchFarmers();
});
