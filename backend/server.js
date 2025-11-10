import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// FARMER DETAILS ROUTES
// ==========================================

// GET all farmers
app.get('/farmers', (req, res) => {
    const sql = 'SELECT * FROM Farmer_Details';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET farmers with advanced filters
app.get('/farmers/filter', (req, res) => {
    const { name, minLandSize, maxLandSize, taxStatus, state, cropType, regStart, regEnd } = req.query;
    
    let sql = `SELECT DISTINCT f.* FROM Farmer_Details f 
               LEFT JOIN Tax_Details t ON f.Farmer_ID = t.Farmer_ID
               LEFT JOIN Crop_Details c ON f.Farmer_ID = c.Farmer_ID
               WHERE 1=1`;
    const params = [];

    if (name) {
        sql += ` AND (f.First_Name LIKE ? OR f.Last_Name LIKE ?)`;
        params.push(`%${name}%`, `%${name}%`);
    }
    if (minLandSize) {
        sql += ` AND f.Land_Size >= ?`;
        params.push(minLandSize);
    }
    if (maxLandSize) {
        sql += ` AND f.Land_Size <= ?`;
        params.push(maxLandSize);
    }
    if (taxStatus) {
        sql += ` AND t.Current_Status = ?`;
        params.push(taxStatus);
    }
    if (state) {
        sql += ` AND f.State LIKE ?`;
        params.push(`%${state}%`);
    }
    if (cropType) {
        sql += ` AND c.Type = ?`;
        params.push(cropType);
    }
    if (regStart) {
        sql += ` AND f.Registration_Date >= ?`;
        params.push(regStart);
    }
    if (regEnd) {
        sql += ` AND f.Registration_Date <= ?`;
        params.push(regEnd);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST a new farmer
app.post('/farmers', (req, res) => {
    const { First_Name, Last_Name, Email_ID, Date_of_Birth, Gender, Street, City, State, PinCode, Land_Size } = req.body;
    const sql = 'INSERT INTO Farmer_Details (First_Name, Last_Name, Email_ID, Date_of_Birth, Gender, Street, City, State, PinCode, Land_Size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [First_Name, Last_Name, Email_ID, Date_of_Birth, Gender, Street, City, State, PinCode, Land_Size], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Farmer added!', id: result.insertId });
    });
});

// Get farmer by ID
app.get('/farmers/:id', (req, res) => {
    const sql = 'SELECT * FROM Farmer_Details WHERE Farmer_ID = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || {});
    });
});

// Update farmer details
app.put('/farmers/:id', (req, res) => {
    const { First_Name, Last_Name, Email_ID, Date_of_Birth, Gender, Street, City, State, PinCode, Land_Size } = req.body;
    const sql = `UPDATE Farmer_Details SET First_Name=?, Last_Name=?, Email_ID=?, Date_of_Birth=?, Gender=?, Street=?, City=?, State=?, PinCode=?, Land_Size=? WHERE Farmer_ID=?`;
    db.query(sql, [First_Name, Last_Name, Email_ID, Date_of_Birth, Gender, Street, City, State, PinCode, Land_Size, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Farmer updated!' });
    });
});

// Delete farmer
app.delete('/farmers/:id', (req, res) => {
    const sql = 'DELETE FROM Farmer_Details WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Farmer deleted!' });
    });
});

// ==========================================
// FARMER PHONE DETAILS ROUTES
// ==========================================
app.get('/farmers/:id/phones', (req, res) => {
    const sql = 'SELECT Phone_Number FROM Farmer_PhoneNumbers WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/farmers/:id/phones', (req, res) => {
    const { Phone_Number } = req.body;
    const sql = 'INSERT INTO Farmer_PhoneNumbers(Farmer_ID, Phone_Number) VALUES(?, ?)';
    db.query(sql, [req.params.id, Phone_Number], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Phone number added!' });
    });
});

app.delete('/farmers/:id/phones/:phone', (req, res) => {
    const sql = 'DELETE FROM Farmer_PhoneNumbers WHERE Farmer_ID=? AND Phone_Number=?';
    db.query(sql, [req.params.id, req.params.phone], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Phone number deleted!' });
    });
});

// ==========================================
// BANK DETAILS ROUTES FOR SPECIFIC FARMER
// ==========================================

app.get('/farmers/:id/bank', (req, res) => {
    const sql = 'SELECT * FROM Bank_Details WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Bank details not found' });
        res.json(results[0]);
    });
});

app.post('/farmers/:id/bank', (req, res) => {
    const { Bank_Name, Account_Type, Branch, IFSC, Account_Number } = req.body;
    
    // First get farmer details
    db.query('SELECT First_Name, Last_Name FROM Farmer_Details WHERE Farmer_ID=?', [req.params.id], (err, farmer) => {
        if (err || farmer.length === 0) return res.status(404).json({ error: 'Farmer not found' });
        
        const sql = 'INSERT INTO Bank_Details(Farmer_ID, First_Name, Last_Name, Bank_Name, Account_Type, Branch, IFSC, Account_Number) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [req.params.id, farmer[0].First_Name, farmer[0].Last_Name, Bank_Name, Account_Type, Branch, IFSC, Account_Number], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Bank account added successfully!' });
        });
    });
});

// ==========================================
// CROP DETAILS ROUTES FOR SPECIFIC FARMER
// ==========================================

app.get('/farmers/:id/crops', (req, res) => {
    const sql = 'SELECT * FROM Crop_Details WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/farmers/:id/crops', (req, res) => {
    const { Crop_Name, Harvest_Start, Harvest_End, Fertilizers_Used, Type } = req.body;
    const sql = 'INSERT INTO Crop_Details(Crop_Name, Farmer_ID, Harvest_Start, Harvest_End, Fertilizers_Used, Type, Season_Year) VALUES(?, ?, ?, ?, ?, ?, YEAR(?))';
    db.query(sql, [Crop_Name, req.params.id, Harvest_Start, Harvest_End, Fertilizers_Used, Type, Harvest_Start], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Crop added successfully!' });
    });
});

// ==========================================
// GOVERNMENT POLICIES ROUTES FOR SPECIFIC FARMER
// ==========================================

app.get('/farmers/:id/policies', (req, res) => {
    const sql = 'SELECT * FROM Gov_Policies WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/farmers/:id/policies', (req, res) => {
    const { Scheme_Name, Amount_Granted, Eligibility, Aadhar_Number, PAN_Number, Ration_Card } = req.body;
    const sql = 'INSERT INTO Gov_Policies(Farmer_ID, Scheme_Name, Amount_Granted, Eligibility, Aadhar_Number, PAN_Number, Ration_Card) VALUES(?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [req.params.id, Scheme_Name, Amount_Granted, Eligibility, Aadhar_Number, PAN_Number, Ration_Card], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Policy added successfully!' });
    });
});

// ==========================================
// TAX DETAILS ROUTES FOR SPECIFIC FARMER
// ==========================================

app.get('/farmers/:id/tax', (req, res) => {
    const sql = 'SELECT * FROM Tax_Details WHERE Farmer_ID=?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/farmers/:id/tax', (req, res) => {
    const { Current_Status } = req.body;
    const sql = 'UPDATE Tax_Details SET Current_Status=? WHERE Farmer_ID=?';
    db.query(sql, [Current_Status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tax status updated!' });
    });
});

// ==========================================
// STATISTICS & REPORTS
// ==========================================

app.get('/reports/statistics/state', (req, res) => {
    const sql = `
        SELECT 
            State, 
            COUNT(*) AS Total_Farmers,
            AVG(Land_Size) AS Avg_Land_Size,
            SUM(Land_Size) AS Total_Land
        FROM Farmer_Details
        GROUP BY State
        ORDER BY Total_Farmers DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/reports/unpaid-taxes', (req, res) => {
    const sql = `
        SELECT f.Farmer_ID, f.First_Name, f.Last_Name, f.Email_ID, t.Tax_Amount, t.Tax_Type, t.Tax_Period
        FROM Farmer_Details f
        JOIN Tax_Details t ON f.Farmer_ID = t.Farmer_ID
        WHERE t.Current_Status = 'Unpaid'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get("/", (req, res) => {
    res.json({ 
        message: "Welcome to the Farmer Bank API",
        endpoints: {
            farmers: "/farmers",
            filter: "/farmers/filter",
            reports: "/reports"
        }
    });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));