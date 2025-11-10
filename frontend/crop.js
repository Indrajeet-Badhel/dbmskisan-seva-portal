const API_BASE = "http://localhost:5000";
const CROPS_API = `${API_BASE}/crops`;
const FARMERS_API = `${API_BASE}/farmers`;

// ================================
// LOAD FARMERS INTO DROPDOWN
// ================================
async function loadFarmers() {
  const sel = document.getElementById("Farmer_ID");
  sel.innerHTML = `<option>Loading...</option>`;

  try {
    const res = await fetch(FARMERS_API);
    const farmers = await res.json();

    if (!farmers.length) {
      sel.innerHTML = `<option value="">No farmers found</option>`;
      return;
    }

    sel.innerHTML = `<option value="">Select farmer</option>`;

    farmers.forEach(f => {
      const name = `${f.First_Name} ${f.Last_Name}`;
      const opt = document.createElement("option");
      opt.value = f.Farmer_ID;
      opt.textContent = `${name} (${f.City})`;
      sel.appendChild(opt);
    });
  } catch {
    sel.innerHTML = `<option>Error loading</option>`;
  }
}

// ================================
// GET FILTER VALUES
// ================================
function getFilters() {
  return {
    name: document.getElementById("filter-name").value.trim() || null,
    type: document.getElementById("filter-type").value || null,
    seasonYear: document.getElementById("filter-season").value || null,
    minPrice: document.getElementById("filter-min-price").value || null,
    maxPrice: document.getElementById("filter-max-price").value || null,
    minQty: document.getElementById("filter-min-qty").value || null,
    maxQty: document.getElementById("filter-max-qty").value || null
  };
}

// ================================
// LOAD CROPS
// ================================
async function loadCrops(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== "") params.append(k, v);
  });

  const url = params.toString()
    ? `${CROPS_API}/filter?${params}`
    : CROPS_API;

  try {
    const res = await fetch(url);
    const crops = await res.json();
    renderCrops(crops);
  } catch (err) {
    document.getElementById("crop-table-body").innerHTML =
      `<tr><td colspan="9">Error loading data</td></tr>`;
  }
}

// ================================
// RENDER CROPS TABLE
// ================================
function renderCrops(list) {
  const tbody = document.getElementById("crop-table-body");
  const info = document.getElementById("results-info");

  tbody.innerHTML = "";

  if (!list.length) {
    info.textContent = "No crops found.";
    tbody.innerHTML = `<tr><td colspan="9">No data</td></tr>`;
    return;
  }

  info.textContent = `${list.length} result(s)`;

  list.forEach(c => {
    const harvest =
      c.Harvest_Start && c.Harvest_End
        ? `${c.Harvest_Start} → ${c.Harvest_End}`
        : c.Harvest_Start || c.Harvest_End || "-";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${c.Crop_ID}</td>
      <td>${c.Crop_Name || "-"}</td>
      <td>${(c.First_Name || "") + " " + (c.Last_Name || "")}</td>
      <td>${c.Type || "-"}</td>
      <td>${c.Season_Year || "-"}</td>
      <td>${harvest}</td>
      <td>${c.Price_Per_Unit || "-"}</td>
      <td>${c.Quantity_Available || "-"}</td>
      <td>
        <button class="btn-edit" data-id="${c.Crop_ID}">Edit</button>
        <button class="btn-delete" data-id="${c.Crop_ID}">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  setupActionButtons();
}

// ================================
// ADD / UPDATE CROP
// ================================
document.getElementById("crop-form").addEventListener("submit", async e => {
  e.preventDefault();

  const id = document.getElementById("editing-id").value;

  const payload = {
    Crop_Name: Crop_Name.value.trim(),
    Farmer_ID: Farmer_ID.value,
    Harvest_Start: Harvest_Start.value,
    Harvest_End: Harvest_End.value,
    Fertilizers_Used: Fertilizers_Used.value,
    Type: Type.value,
    Area_Planted: Area_Planted.value,
    Expected_Yield: Expected_Yield.value,
    Price_Per_Unit: Price_Per_Unit.value,
    Quantity_Available: Quantity_Available.value,
    Season_Year: Season_Year.value
  };

  const url = id ? `${CROPS_API}/${id}` : CROPS_API;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  alert(data.message || data.error);

  document.getElementById("crop-form").reset();
  document.getElementById("editing-id").value = "";

  loadCrops(getFilters());
});

// ================================
// CLEAR FORM
// ================================
document.getElementById("clear-form").onclick = () => {
  document.getElementById("editing-id").value = "";
  document.getElementById("crop-form").reset();
};

// ================================
// EDIT + DELETE BUTTONS
// ================================
function setupActionButtons() {
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const res = await fetch(`${CROPS_API}/${id}`);
      const c = await res.json();

      document.getElementById("editing-id").value = c.Crop_ID;
      document.getElementById("Crop_Name").value = c.Crop_Name;
      document.getElementById("Farmer_ID").value = c.Farmer_ID;
      document.getElementById("Type").value = c.Type;
      document.getElementById("Season_Year").value = c.Season_Year;
      document.getElementById("Harvest_Start").value = c.Harvest_Start || "";
      document.getElementById("Harvest_End").value = c.Harvest_End || "";
      document.getElementById("Area_Planted").value = c.Area_Planted || "";
      document.getElementById("Expected_Yield").value = c.Expected_Yield || "";
      document.getElementById("Price_Per_Unit").value = c.Price_Per_Unit || "";
      document.getElementById("Quantity_Available").value = c.Quantity_Available || "";
      document.getElementById("Fertilizers_Used").value = c.Fertilizers_Used || "";

      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      if (!confirm("Delete this crop?")) return;

      const res = await fetch(`${CROPS_API}/${id}`, { method: "DELETE" });
      const data = await res.json();

      alert(data.message || data.error);

      loadCrops(getFilters());
    };
  });
}

// ================================
// FILTER BUTTONS
// ================================
document.getElementById("apply-filters").onclick = () => {
  loadCrops(getFilters());
};

document.getElementById("reset-filters").onclick = () => {
  document.getElementById("filter-form").reset();
  loadCrops();
};

// ================================
// INITIAL LOAD
// ================================
(async function () {
  await loadFarmers();
  loadCrops();
})();
