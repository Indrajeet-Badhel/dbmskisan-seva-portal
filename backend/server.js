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

// Tax summary (totals by status) for a farmer
app.get('/api/farmer/:farmerId/tax-summary', (req, res) => {
  const farmerId = req.params.farmerId;
  const sql = `
    SELECT
      SUM(CASE WHEN Current_Status IN ('Unpaid', 'Overdue') THEN Tax_Amount + IFNULL(Penalty_Amount, 0) ELSE 0 END) AS totalDue,
      SUM(CASE WHEN Current_Status = 'Overdue' THEN Tax_Amount + IFNULL(Penalty_Amount, 0) ELSE 0 END) AS overdueAmount,
      SUM(CASE WHEN Current_Status = 'Paid' THEN Tax_Amount ELSE 0 END) AS paidAmount,
      SUM(CASE WHEN Current_Status = 'Exempted' THEN Tax_Amount ELSE 0 END) AS exemptedAmount
    FROM tax_details
    WHERE Farmer_ID = ?
  `;
  db.query(sql, [farmerId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const row = results[0];
    res.json({
      totalDue: row.totalDue || 0,
      overdueAmount: row.overdueAmount || 0,
      paidAmount: row.paidAmount || 0,
      exemptedAmount: row.exemptedAmount || 0
    });
  });
});

// Fetch tax details for farmer with optional filters
app.get('/api/farmer/:farmerId/tax-details', (req, res) => {
  const farmerId = req.params.farmerId;
  let sql = `SELECT Tax_Type, Tax_Amount, Penalty_Amount, Current_Status, Due_Date, Payment_Date FROM tax_details WHERE Farmer_ID = ?`;
  const params = [farmerId];

  if (req.query.tax_type) {
    sql += " AND Tax_Type LIKE ?";
    params.push(`%${req.query.tax_type}%`);
  }
  if (req.query.status) {
    sql += " AND Current_Status = ?";
    params.push(req.query.status);
  }
  if (req.query.due_date_start) {
    sql += " AND Due_Date >= ?";
    params.push(req.query.due_date_start);
  }
  if (req.query.due_date_end) {
    sql += " AND Due_Date <= ?";
    params.push(req.query.due_date_end);
  }
  sql += " ORDER BY Due_Date DESC";

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Fetch tax-related notifications for farmer
app.get('/api/farmer/:farmerId/notifications', (req, res) => {
  const farmerId = req.params.farmerId;
  const category = req.query.category || 'Tax';
  const sql = `
    SELECT Title, Message, created_at 
    FROM notifications
    WHERE Farmer_ID = ? AND Category = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  db.query(sql, [farmerId, category], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Fetch paginated transactions for farmer (filtering can be added)
app.get('/api/farmer/:farmerId/transactions', (req, res) => {
  const farmerId = req.params.farmerId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  // Join transaction_logs bank_details to confirm farmer ownership
  const sqlCount = `
    SELECT COUNT(*) AS totalCount 
    FROM transaction_logs tl
    JOIN bank_details bd ON tl.Bank_ID = bd.Bank_ID
    WHERE bd.Farmer_ID = ?
  `;
  const sqlData = `
    SELECT tl.Transaction_Type, tl.Amount, tl.Description, tl.Status, tl.created_at
    FROM transaction_logs tl
    JOIN bank_details bd ON tl.Bank_ID = bd.Bank_ID
    WHERE bd.Farmer_ID = ?
    ORDER BY tl.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sqlCount, [farmerId], (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalCount = countResult[0].totalCount;
    const totalPages = Math.ceil(totalCount / pageSize);

    db.query(sqlData, [farmerId, pageSize, offset], (err2, dataResults) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ transactions: dataResults, totalPages });
    });
  });
});
// GET all farmers
app.get('/farmers', (req, res) => {
  const sql = 'SELECT Farmer_ID, First_Name, Last_Name, Email_ID FROM Farmer_Details';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET farmers with filter
app.get('/farmers/filter', (req, res) => {
  const { name } = req.query;
  let sql = `SELECT Farmer_ID, First_Name, Last_Name, Email_ID FROM Farmer_Details WHERE 1=1`;
  const params = [];
  if (name) {
    sql += ` AND (First_Name LIKE ? OR Last_Name LIKE ? OR Email_ID LIKE ?)`;
    params.push(`%${name}%`, `%${name}%`, `%${name}%`);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.get('/farmers/:id/tax-summary', (req, res) => {
    const farmerId = req.params.id;
    const sql = `
        SELECT
            SUM(CASE WHEN Current_Status IN ('Unpaid', 'Overdue') THEN Tax_Amount + IFNULL(Penalty_Amount, 0) ELSE 0 END) AS totalDue,
            SUM(CASE WHEN Current_Status = 'Overdue' THEN Tax_Amount + IFNULL(Penalty_Amount, 0) ELSE 0 END) AS overdueAmount,
            SUM(CASE WHEN Current_Status = 'Paid' THEN Tax_Amount ELSE 0 END) AS paidAmount,
            SUM(CASE WHEN Current_Status = 'Exempted' THEN Tax_Amount ELSE 0 END) AS exemptedAmount
        FROM tax_details
        WHERE Farmer_ID = ?
    `;
    
    db.query(sql, [farmerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const row = results[0];
        res.json({
            totalDue: row.totalDue || 0,
            overdueAmount: row.overdueAmount || 0,
            paidAmount: row.paidAmount || 0,
            exemptedAmount: row.exemptedAmount || 0
        });
    });
});

// Get tax details for farmer with optional filters
app.get('/farmers/:id/tax-details', (req, res) => {
    const farmerId = req.params.id;
    let sql = `SELECT Tax_ID, Tax_Type, Tax_Amount, Penalty_Amount, Current_Status, Due_Date, Payment_Date, Tax_Period 
               FROM tax_details 
               WHERE Farmer_ID = ?`;
    const params = [farmerId];

    if (req.query.tax_type) {
        sql += " AND Tax_Type LIKE ?";
        params.push(`%${req.query.tax_type}%`);
    }
    if (req.query.status) {
        sql += " AND Current_Status = ?";
        params.push(req.query.status);
    }
    if (req.query.due_date_start) {
        sql += " AND Due_Date >= ?";
        params.push(req.query.due_date_start);
    }
    if (req.query.due_date_end) {
        sql += " AND Due_Date <= ?";
        params.push(req.query.due_date_end);
    }
    sql += " ORDER BY Due_Date DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get notifications for farmer
app.get('/farmers/:id/notifications', (req, res) => {
    const farmerId = req.params.id;
    const category = req.query.category || 'Tax';
    const sql = `
        SELECT Notification_ID, Title, Message, Type, Category, Priority, Is_Read, created_at, read_at
        FROM notifications
        WHERE Farmer_ID = ? AND Category = ? 
        ORDER BY Priority DESC, created_at DESC 
        LIMIT 20
    `;
    
    db.query(sql, [farmerId, category], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get transactions for farmer (paginated)
app.get('/farmers/:id/transactions', (req, res) => {
    const farmerId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // First get the bank_id for this farmer
    const bankSql = 'SELECT Bank_ID FROM bank_details WHERE Farmer_ID = ? AND Is_Primary = 1 LIMIT 1';
    
    db.query(bankSql, [farmerId], (err, bankResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (bankResults.length === 0) {
            return res.json({ transactions: [], totalPages: 0, message: 'No bank account found' });
        }
        
        const bankId = bankResults[0].Bank_ID;
        
        // Count total transactions
        const countSql = 'SELECT COUNT(*) AS totalCount FROM transaction_logs WHERE Bank_ID = ?';
        
        db.query(countSql, [bankId], (err, countResult) => {
            if (err) return res.status(500).json({ error: err.message });
            const totalCount = countResult[0].totalCount;
            const totalPages = Math.ceil(totalCount / pageSize);

            // Get paginated transactions
            const dataSql = `
                SELECT Transaction_ID, Transaction_Type, Amount, Description, Status, Reference_Number, created_at
                FROM transaction_logs
                WHERE Bank_ID = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.query(dataSql, [bankId, pageSize, offset], (err, dataResults) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ 
                    transactions: dataResults, 
                    totalPages,
                    currentPage: page,
                    totalCount
                });
            });
        });
    });
});

// Mark notification as read
app.put('/notifications/:id/read', (req, res) => {
    const notificationId = req.params.id;
    const sql = 'UPDATE notifications SET Is_Read = 1, read_at = NOW() WHERE Notification_ID = ?';
    
    db.query(sql, [notificationId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Notification marked as read' });
    });
});

// Get tax statistics for analytics/charts
app.get('/farmers/:id/tax-analytics', (req, res) => {
    const farmerId = req.params.id;
    
    // Get status distribution
    const statusSql = `
        SELECT 
            Current_Status,
            COUNT(*) as count,
            SUM(Tax_Amount) as total_amount
        FROM tax_details
        WHERE Farmer_ID = ?
        GROUP BY Current_Status
    `;
    
    // Get monthly trend (last 12 months)
    const trendSql = `
        SELECT 
            DATE_FORMAT(Due_Date, '%Y-%m') as month,
            SUM(Tax_Amount) as amount,
            COUNT(*) as count
        FROM tax_details
        WHERE Farmer_ID = ? 
        AND Due_Date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(Due_Date, '%Y-%m')
        ORDER BY month
    `;
    
    db.query(statusSql, [farmerId], (err, statusResults) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query(trendSql, [farmerId], (err, trendResults) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                statusDistribution: statusResults,
                monthlyTrend: trendResults
            });
        });
    });
});

// Pay a specific tax
app.post('/farmers/:farmerId/tax/:taxId/pay', (req, res) => {
    const { farmerId, taxId } = req.params;
    const { paymentMethod, transactionRef } = req.body;
    
    const sql = `
        UPDATE tax_details 
        SET Current_Status = 'Paid', 
            Payment_Date = CURDATE(),
            updated_at = NOW()
        WHERE Tax_ID = ? AND Farmer_ID = ?
    `;
    
    db.query(sql, [taxId, farmerId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tax record not found' });
        }
        
        // Create notification
        const notifSql = `
            INSERT INTO notifications (Farmer_ID, Title, Message, Type, Category, Priority)
            VALUES (?, 'Payment Successful', 'Your tax payment has been processed successfully.', 'Success', 'Tax', 'Medium')
        `;
        
        db.query(notifSql, [farmerId], (err) => {
            if (err) console.error('Failed to create notification:', err);
        });
        
        res.json({ 
            message: 'Tax payment processed successfully',
            taxId,
            status: 'Paid'
        });
    });
});

console.log('Tax Dashboard API endpoints added successfully!');

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