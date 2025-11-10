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

/*  Made these endpoints more comprehensive in the Bank Routes section below
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
*/

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
// ==========================================
// GOVERNMENT POLICY DASHBOARD ROUTES
// ==========================================

// Get policy summary for a farmer
app.get('/farmers/:id/policy-summary', (req, res) => {
    const farmerId = req.params.id;

    const sql = `
        SELECT 
            COUNT(*) as totalApplications,
            SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as approvedCount,
            SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as pendingCount,
            SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as rejectedCount,
            SUM(CASE WHEN Status = 'Approved' AND Disbursement_Status = 'Full' THEN Amount_Granted ELSE 0 END) as totalAmountReceived,
            MIN(DATEDIFF(Expiry_Date, CURDATE())) as nearestExpiryDays
        FROM gov_policies
        WHERE Farmer_ID = ? AND Expiry_Date >= CURDATE()
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const summary = results[0];
        res.json({
            totalApplications: summary.totalApplications || 0,
            approvedCount: summary.approvedCount || 0,
            pendingCount: summary.pendingCount || 0,
            rejectedCount: summary.rejectedCount || 0,
            totalAmountReceived: parseFloat(summary.totalAmountReceived) || 0,
            nearestExpiryDays: summary.nearestExpiryDays || 'N/A'
        });
    });
});

// Get eligible policies for a farmer
app.get('/farmers/:id/eligible-policies', (req, res) => {
    const farmerId = req.params.id;

    // First get farmer details
    const farmerSql = 'SELECT Land_Size, State, Gender FROM farmer_details WHERE Farmer_ID = ?';

    db.query(farmerSql, [farmerId], (err, farmerResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (farmerResults.length === 0) return res.status(404).json({ error: 'Farmer not found' });

        const farmer = farmerResults[0];

        // Get policies that match farmer's eligibility and haven't been applied for
        const policySql = `
            SELECT pm.* 
            FROM policy_master pm
            WHERE pm.Status = 'Active'
            AND (pm.Application_End IS NULL OR pm.Application_End >= CURDATE())
            AND (pm.Min_Land_Size IS NULL OR pm.Min_Land_Size <= ?)
            AND (pm.Max_Land_Size IS NULL OR pm.Max_Land_Size >= ?)
            AND (pm.State IS NULL OR pm.State = ? OR pm.State = 'All')
            AND (pm.Gender = 'Any' OR pm.Gender = ?)
            AND pm.Policy_ID NOT IN (
                SELECT gp.Policy_ID 
                FROM gov_policies gp 
                JOIN policy_master pm2 ON gp.Scheme_Name = pm2.Policy_Name
                WHERE gp.Farmer_ID = ?
            )
        `;

        db.query(policySql, [
            farmer.Land_Size,
            farmer.Land_Size,
            farmer.State,
            farmer.Gender,
            farmerId
        ], (err, policies) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(policies);
        });
    });
});

// Get applied policies for a farmer with calculated days left
app.get('/farmers/:id/policies', (req, res) => {
    const farmerId = req.params.id;

    const sql = `
        SELECT 
            *,
            DATEDIFF(Expiry_Date, CURDATE()) as DaysLeft
        FROM gov_policies
        WHERE Farmer_ID = ?
        ORDER BY Application_Date DESC
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get disbursements for a farmer (transactions with type Policy_Disbursement)
app.get('/farmers/:id/disbursements', (req, res) => {
    const farmerId = req.params.id;

    const sql = `
        SELECT 
            tl.Transaction_ID,
            tl.Amount,
            tl.Description,
            tl.Reference_Number,
            tl.created_at,
            bd.Account_Number,
            bd.Bank_Name
        FROM transaction_logs tl
        JOIN bank_details bd ON tl.Bank_ID = bd.Bank_ID
        WHERE bd.Farmer_ID = ? 
        AND tl.Transaction_Type = 'Policy_Disbursement'
        AND tl.Status = 'Success'
        ORDER BY tl.created_at DESC
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get policy-related notifications for a farmer
app.get('/farmers/:id/policy-notifications', (req, res) => {
    const farmerId = req.params.id;

    const sql = `
        SELECT 
            Notification_ID,
            Title,
            Message,
            Type,
            Priority,
            created_at
        FROM notifications
        WHERE Farmer_ID = ? 
        AND Category = 'Policy'
        ORDER BY Priority DESC, created_at DESC
        LIMIT 20
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Apply for a policy
app.post('/farmers/:id/apply-policy', (req, res) => {
    const farmerId = req.params.id;
    const { policyId } = req.body;

    // First get policy details
    const policySql = 'SELECT * FROM policy_master WHERE Policy_ID = ?';

    db.query(policySql, [policyId], (err, policyResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (policyResults.length === 0) return res.status(404).json({ error: 'Policy not found' });

        const policy = policyResults[0];

        // Get farmer details
        const farmerSql = 'SELECT Aadhar_Number, PAN_Number FROM farmer_details WHERE Farmer_ID = ?';

        db.query(farmerSql, [farmerId], (err, farmerResults) => {
            if (err) return res.status(500).json({ error: err.message });
            if (farmerResults.length === 0) return res.status(404).json({ error: 'Farmer not found' });

            const farmer = farmerResults[0];

            // Check if already applied
            const checkSql = 'SELECT * FROM gov_policies WHERE Farmer_ID = ? AND Scheme_Name = ?';

            db.query(checkSql, [farmerId, policy.Policy_Name], (err, existing) => {
                if (err) return res.status(500).json({ error: err.message });
                if (existing.length > 0) {
                    return res.status(400).json({ error: 'Already applied for this policy' });
                }

                // Insert application
                const insertSql = `
  INSERT INTO gov_policies 
  (Farmer_ID, Policy_ID, Amount_Granted, Eligibility, Aadhar_Number, PAN_Number, Status, Disbursement_Status)
  VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Not Disbursed')
`;
                db.query(insertSql, [
                    farmerId,
                    policy.Policy_ID,
                    policy.Max_Grant,
                    policy.Eligibility_Criteria,
                    farmer.Aadhar_Number,
                    farmer.PAN_Number
                ], (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // Create notification
                    const notifSql = `
                        INSERT INTO notifications 
                        (Farmer_ID, Title, Message, Type, Category, Priority)
                        VALUES (?, ?, ?, 'Info', 'Policy', 'Medium')
                    `;

                    const notifTitle = 'Policy Application Submitted';
                    const notifMessage = `Your application for ${policy.Policy_Name} has been submitted successfully and is under review.`;

                    db.query(notifSql, [farmerId, notifTitle, notifMessage], (err) => {
                        if (err) console.error('Failed to create notification:', err);
                    });

                    res.json({
                        message: 'Application submitted successfully',
                        applicationId: result.insertId
                    });
                });
            });
        });
    });
});

// Get all active policies from policy_master
app.get('/policies/active', (req, res) => {
    const sql = `
        SELECT * FROM policy_master 
        WHERE Status = 'Active'
        AND (Application_End IS NULL OR Application_End >= CURDATE())
        ORDER BY Policy_Name
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Update policy status (for admin use)
app.put('/policies/:govId/status', (req, res) => {
    const govId = req.params.govId;
    const { status, approvalDate, expiryDate, disbursementStatus } = req.body;

    let sql = 'UPDATE gov_policies SET Status = ?';
    const params = [status];

    if (approvalDate) {
        sql += ', Approval_Date = ?';
        params.push(approvalDate);
    }

    if (expiryDate) {
        sql += ', Expiry_Date = ?';
        params.push(expiryDate);
    }

    if (disbursementStatus) {
        sql += ', Disbursement_Status = ?';
        params.push(disbursementStatus);
    }

    sql += ' WHERE Gov_ID = ?';
    params.push(govId);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Policy application not found' });
        }

        res.json({ message: 'Policy status updated successfully' });
    });
});

// Auto-expire policies (can be called by cron job or manually)
app.post('/policies/auto-expire', (req, res) => {
    const sql = `
        UPDATE gov_policies 
        SET Status = 'Expired'
        WHERE Status != 'Expired' 
        AND Expiry_Date < CURDATE()
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            message: 'Auto-expiry completed',
            expiredCount: result.affectedRows
        });
    });
});

// Get policy statistics
app.get('/policies/statistics', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as totalApplications,
            SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN Status = 'Expired' THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN Status = 'Approved' THEN Amount_Granted ELSE 0 END) as totalAmountGranted,
            SUM(CASE WHEN Disbursement_Status = 'Full' THEN Amount_Granted ELSE 0 END) as totalDisbursed
        FROM gov_policies
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});
// Alias route for compatibility with frontend
app.get('/farmers/:id/notifications', (req, res) => {
  const farmerId = req.params.id;
  const category = req.query.category || 'Policy';

  const sql = `
    SELECT 
      Notification_ID,
      Title,
      Message,
      Type,
      Priority,
      created_at
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


console.log('Government Policy Dashboard API endpoints added successfully!');

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

// ==========================================
// Bank Routes for Bank.html
// ==========================================

// ---------------------------
// Helper: run SQL with promise
// ---------------------------
function queryPromise(connOrDb, sql, params=[]) {
  return new Promise((resolve, reject) => {
    connOrDb.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

// ---------------------------
// Setup route: create view, triggers, procedure
// ---------------------------
app.post('/setup/dbobjects', async (req, res) => {
  try {
    // ---------- safe view creation (detect Is_Primary) ----------
    const checkColSql = `
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Bank_Details'
        AND COLUMN_NAME = 'Is_Primary'
    `;
    const colRes = await queryPromise(db, checkColSql);
    const hasIsPrimary = (colRes && colRes[0] && colRes[0].cnt > 0);

    let viewSql;
    if (hasIsPrimary) {
      viewSql = `
        CREATE OR REPLACE VIEW vw_farmer_bank_overview AS
        SELECT 
          f.Farmer_ID,
          CONCAT(f.First_Name, ' ', f.Last_Name) AS Farmer_Name,
          f.Email_ID,
          f.City,
          f.State,
          b.Bank_ID,
          b.Bank_Name,
          b.Account_Number,
          b.Is_Primary,
          COALESCE(b.Account_Balance,0.00) AS Account_Balance,
          (SELECT COALESCE(SUM(Account_Balance),0) FROM Bank_Details bd WHERE bd.Farmer_ID = f.Farmer_ID) AS Total_Balance
        FROM Farmer_Details f
        LEFT JOIN Bank_Details b 
          ON f.Farmer_ID = b.Farmer_ID AND b.Is_Primary = 1;
      `;
    } else {
      viewSql = `
        CREATE OR REPLACE VIEW vw_farmer_bank_overview AS
        SELECT 
          f.Farmer_ID,
          CONCAT(f.First_Name, ' ', f.Last_Name) AS Farmer_Name,
          f.Email_ID,
          f.City,
          f.State,
          b.Bank_ID,
          b.Bank_Name,
          b.Account_Number,
          0 AS Is_Primary,
          COALESCE(b.Account_Balance,0.00) AS Account_Balance,
          (SELECT COALESCE(SUM(Account_Balance),0) FROM Bank_Details bd WHERE bd.Farmer_ID = f.Farmer_ID) AS Total_Balance
        FROM Farmer_Details f
        LEFT JOIN Bank_Details b 
          ON b.Bank_ID = (
            SELECT bd2.Bank_ID FROM Bank_Details bd2
            WHERE bd2.Farmer_ID = f.Farmer_ID
            ORDER BY bd2.Bank_ID ASC
            LIMIT 1
          );
      `;
    }

    await queryPromise(db, viewSql);

    // ---------- triggers (drop if exist then create) ----------
    // drop old triggers if present (ignore errors)
    try { await queryPromise(db, "DROP TRIGGER IF EXISTS trg_bank_after_insert"); } catch(_) {}
    try { await queryPromise(db, "DROP TRIGGER IF EXISTS trg_bank_after_update"); } catch(_) {}
    try { await queryPromise(db, "DROP TRIGGER IF EXISTS trg_bank_after_delete"); } catch(_) {}

    // Note: some drivers / mysql versions require DELIMITER when creating triggers in CLI.
    // Drivers usually accept the body as a single statement; if these fail, run them manually in MySQL client.
    const triggerInsert = `
      CREATE TRIGGER trg_bank_after_insert
      AFTER INSERT ON Bank_Details
      FOR EACH ROW
      BEGIN
        INSERT INTO Audit_Logs (Table_Name, Operation, Record_ID, New_Value, created_at)
        VALUES ('Bank_Details', 'INSERT', NEW.Bank_ID, JSON_OBJECT(
          'Bank_ID', NEW.Bank_ID,
          'Farmer_ID', NEW.Farmer_ID,
          'Bank_Name', NEW.Bank_Name,
          'Account_Number', NEW.Account_Number,
          'Account_Balance', NEW.Account_Balance
        ), NOW());
      END;
    `;
    const triggerUpdate = `
      CREATE TRIGGER trg_bank_after_update
      AFTER UPDATE ON Bank_Details
      FOR EACH ROW
      BEGIN
        INSERT INTO Audit_Logs (Table_Name, Operation, Record_ID, Old_Value, New_Value, created_at)
        VALUES ('Bank_Details', 'UPDATE', NEW.Bank_ID,
          JSON_OBJECT(
            'Bank_Name', OLD.Bank_Name,
            'Account_Number', OLD.Account_Number,
            'Account_Balance', OLD.Account_Balance
          ),
          JSON_OBJECT(
            'Bank_Name', NEW.Bank_Name,
            'Account_Number', NEW.Account_Number,
            'Account_Balance', NEW.Account_Balance
          ),
          NOW()
        );
      END;
    `;
    const triggerDelete = `
      CREATE TRIGGER trg_bank_after_delete
      AFTER DELETE ON Bank_Details
      FOR EACH ROW
      BEGIN
        INSERT INTO Audit_Logs (Table_Name, Operation, Record_ID, Old_Value, created_at)
        VALUES ('Bank_Details', 'DELETE', OLD.Bank_ID, JSON_OBJECT(
          'Bank_ID', OLD.Bank_ID,
          'Farmer_ID', OLD.Farmer_ID,
          'Bank_Name', OLD.Bank_Name,
          'Account_Number', OLD.Account_Number,
          'Account_Balance', OLD.Account_Balance
        ), NOW());
      END;
    `;

    // Try creating triggers (if your DB user lacks privileges, these will fail - then run in MySQL client)
    await queryPromise(db, triggerInsert);
    await queryPromise(db, triggerUpdate);
    await queryPromise(db, triggerDelete);

    // ---------- stored procedure (drop/create) ----------
    await queryPromise(db, "DROP PROCEDURE IF EXISTS proc_get_farmer_transactions");
    const procCreate = `
      CREATE PROCEDURE proc_get_farmer_transactions(IN p_farmer_id INT, IN p_from DATE, IN p_to DATE)
      BEGIN
        SELECT tl.* FROM Transaction_Logs tl
        JOIN Bank_Details bd ON tl.Bank_ID = bd.Bank_ID
        WHERE bd.Farmer_ID = p_farmer_id
          AND (p_from IS NULL OR DATE(tl.created_at) >= p_from)
          AND (p_to IS NULL OR DATE(tl.created_at) <= p_to)
        ORDER BY tl.created_at DESC;
      END;
    `;
    await queryPromise(db, procCreate);

    // ---------- safe index creation (check information_schema first) ----------
    const idxCheck = `
      SELECT COUNT(*) AS cnt
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Transaction_Logs'
        AND INDEX_NAME = 'idx_transaction_bank_created_at'
    `;
    const idxRes = await queryPromise(db, idxCheck);
    const idxExists = (idxRes && idxRes[0] && idxRes[0].cnt > 0);

    if (!idxExists) {
      // create the index (no IF NOT EXISTS - we've checked)
      await queryPromise(db, "CREATE INDEX idx_transaction_bank_created_at ON Transaction_Logs(Bank_ID, created_at)");
    }

    return res.json({ message: 'DB objects created: view, triggers, procedure, index (if permitted)' });
  } catch (err) {
    console.error('setup error', err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// BANK ROUTES: CRUD + filter + joins + view access
// ---------------------------

// GET all bank accounts (optionally filter by farmer via ?farmerId=)
app.get('/bank/accounts', (req, res) => {
  const { farmerId } = req.query;
  let sql = 'SELECT * FROM Bank_Details';
  const params = [];
  if (farmerId) {
    sql += ' WHERE Farmer_ID = ?';
    params.push(farmerId);
  }
  sql += ' ORDER BY Is_Primary DESC, Bank_ID';
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET all bank accounts for a farmer (used by farmer page to reflect edits)
app.get('/farmers/:id/bank', (req, res) => {
  const sql = 'SELECT * FROM Bank_Details WHERE Farmer_ID = ? ORDER BY Is_Primary DESC, Bank_ID';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET primary bank account for farmer
app.get('/farmers/:id/bank/primary', (req, res) => {
  const sql = 'SELECT * FROM Bank_Details WHERE Farmer_ID = ? AND Is_Primary = 1 LIMIT 1';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Primary bank account not found' });
    res.json(results[0]);
  });
});

// CREATE bank account for farmer (DML)
app.post('/farmers/:id/bank', (req, res) => {
  const { Bank_Name, Account_Type, Branch, IFSC, Account_Number, Is_Primary, Account_Balance } = req.body;
  // server-side minimal validation
  if (!Bank_Name || !Account_Type || !Branch || !IFSC || !Account_Number) {
    return res.status(400).json({ message: 'Bank_Name, Account_Type, Branch, IFSC and Account_Number are required' });
  }
  const balance = (Account_Balance !== undefined && Account_Balance !== null) ? Account_Balance : 0.00;
  const sql = `INSERT INTO Bank_Details (Farmer_ID, First_Name, Last_Name, Bank_Name, Account_Type, Branch, IFSC, Account_Number, Is_Primary, Account_Balance)
               VALUES (?, 
                 (SELECT First_Name FROM Farmer_Details WHERE Farmer_ID = ?),
                 (SELECT Last_Name FROM Farmer_Details WHERE Farmer_ID = ?),
                 ?, ?, ?, ?, ?, ?, ?)`;
  const params = [req.params.id, req.params.id, req.params.id, Bank_Name, Account_Type, Branch, IFSC, Account_Number, Is_Primary ? 1 : 0, balance];
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Bank account added', Bank_ID: result.insertId });
  });
});

// UPDATE bank account (partial update)
app.put('/farmers/:id/bank/:bankId', (req, res) => {
  const { Bank_Name, Account_Type, Branch, IFSC, Account_Number, Is_Primary, Account_Balance } = req.body;
  const updates = [];
  const params = [];
  if (Bank_Name !== undefined) { updates.push('Bank_Name = ?'); params.push(Bank_Name); }
  if (Account_Type !== undefined) { updates.push('Account_Type = ?'); params.push(Account_Type); }
  if (Branch !== undefined) { updates.push('Branch = ?'); params.push(Branch); }
  if (IFSC !== undefined) { updates.push('IFSC = ?'); params.push(IFSC); }
  if (Account_Number !== undefined) { updates.push('Account_Number = ?'); params.push(Account_Number); }
  if (Is_Primary !== undefined) { updates.push('Is_Primary = ?'); params.push(Is_Primary ? 1 : 0); }
  if (Account_Balance !== undefined) { updates.push('Account_Balance = ?'); params.push(Account_Balance); }

  if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

  const sql = `UPDATE Bank_Details SET ${updates.join(', ')} WHERE Bank_ID = ? AND Farmer_ID = ?`;
  params.push(req.params.bankId, req.params.id);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Bank account updated' });
  });
});

// DELETE bank account
app.delete('/farmers/:id/bank/:bankId', (req, res) => {
  const sql = 'DELETE FROM Bank_Details WHERE Bank_ID = ? AND Farmer_ID = ?';
  db.query(sql, [req.params.bankId, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Bank account deleted' });
  });
});

// SET primary account (unset others, set chosen) - uses transaction
// SET primary account (unset others, set chosen) - uses transaction (single connection)
app.put('/farmers/:id/bank/:bankId/set-primary', (req, res) => {
  const farmerId = req.params.id;
  const bankId = req.params.bankId;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('UPDATE Bank_Details SET Is_Primary = 0 WHERE Farmer_ID = ?', [farmerId], (err) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

      db.query('UPDATE Bank_Details SET Is_Primary = 1 WHERE Bank_ID = ? AND Farmer_ID = ?', [bankId, farmerId], (err, result) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

        db.commit(err => {
          if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
          return res.json({ message: 'Primary bank account set' });
        });
      });
    });
  });
});

// TRANSACTION ROUTE (single connection)
/*
Body:
{
  "Transaction_Type": "Deposit"|"Withdrawal"|"Transfer"|"Policy_Disbursement"|"Tax_Payment",
  "Amount": 1000.50,
  "Description": "note",
  "Reference_Number": "REF123",   // optional, UNIQUE in table
  "To_Bank_ID": 45                // required if Transaction_Type == "Transfer"
}
*/
app.post('/bank/accounts/:bankId/transactions', (req, res) => {
  const bankId = parseInt(req.params.bankId, 10);
  const { Transaction_Type, Amount, Description, Reference_Number, To_Bank_ID } = req.body;

  if (!Transaction_Type || !Amount || isNaN(Amount) || Amount <= 0) {
    return res.status(400).json({ message: 'Transaction_Type and positive Amount are required' });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: err.message });

    const getSql = 'SELECT COALESCE(Account_Balance, 0.00) AS Account_Balance FROM Bank_Details WHERE Bank_ID = ? FOR UPDATE';
    db.query(getSql, [bankId], (err, rows) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
      if (!rows || rows.length === 0) return db.rollback(() => res.status(404).json({ message: 'Bank account not found' }));

      const balanceBefore = parseFloat(rows[0].Account_Balance) || 0.0;
      let balanceAfter = balanceBefore;
      const type = Transaction_Type;

      if (type === 'Deposit' || type === 'Policy_Disbursement' || type === 'Tax_Payment') {
        balanceAfter = +(balanceBefore + parseFloat(Amount));
      } else if (type === 'Withdrawal') {
        if (balanceBefore < Amount) {
          return db.rollback(() => res.status(400).json({ message: 'Insufficient funds' }));
        }
        balanceAfter = +(balanceBefore - parseFloat(Amount));
      } else if (type === 'Transfer') {
        if (!To_Bank_ID) return db.rollback(() => res.status(400).json({ message: 'To_Bank_ID required for Transfer' }));
        if (bankId === To_Bank_ID) return db.rollback(() => res.status(400).json({ message: 'Cannot transfer to same account' }));
        if (balanceBefore < Amount) return db.rollback(() => res.status(400).json({ message: 'Insufficient funds' }));
        balanceAfter = +(balanceBefore - parseFloat(Amount));
      } else {
        return db.rollback(() => res.status(400).json({ message: 'Unsupported Transaction_Type' }));
      }

      // update source account balance
      db.query('UPDATE Bank_Details SET Account_Balance = ? WHERE Bank_ID = ?', [balanceAfter, bankId], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

        const insertLogSql = `INSERT INTO Transaction_Logs (Bank_ID, Transaction_Type, Amount, Balance_Before, Balance_After, Description, Reference_Number, Status)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const ref = Reference_Number || null;

        db.query(insertLogSql, [bankId, type, Amount, balanceBefore, balanceAfter, Description || null, ref, 'Success'], (err) => {
          if (err) {
            // Duplicate reference handling: append timestamp and retry
            if (err.code === 'ER_DUP_ENTRY' && err.message && err.message.includes('Reference_Number')) {
              const newRef = (Reference_Number || 'REF') + '-' + Date.now();
              db.query(insertLogSql, [bankId, type, Amount, balanceBefore, balanceAfter, Description || null, newRef, 'Success'], (err2) => {
                if (err2) return db.rollback(() => res.status(500).json({ error: err2.message }));
                proceedAfterSourceLog(newRef);
              });
            } else {
              return db.rollback(() => res.status(500).json({ error: err.message }));
            }
          } else {
            proceedAfterSourceLog(ref);
          }

          function proceedAfterSourceLog(usedRef) {
            if (type === 'Transfer') {
              const getDestSql = 'SELECT COALESCE(Account_Balance,0.00) AS Account_Balance FROM Bank_Details WHERE Bank_ID = ? FOR UPDATE';
              db.query(getDestSql, [To_Bank_ID], (err, destRows) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                if (!destRows || destRows.length === 0) return db.rollback(() => res.status(404).json({ message: 'Destination bank account not found' }));

                const destBalanceBefore = parseFloat(destRows[0].Account_Balance) || 0.0;
                const destBalanceAfter = +(destBalanceBefore + parseFloat(Amount));

                db.query('UPDATE Bank_Details SET Account_Balance = ? WHERE Bank_ID = ?', [destBalanceAfter, To_Bank_ID], (err) => {
                  if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                  const insertDestLogSql = `INSERT INTO Transaction_Logs (Bank_ID, Transaction_Type, Amount, Balance_Before, Balance_After, Description, Reference_Number, Status)
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                  const destDesc = Description ? Description + ' (incoming transfer)' : 'Incoming transfer';
                  db.query(insertDestLogSql, [To_Bank_ID, 'Deposit', Amount, destBalanceBefore, destBalanceAfter, destDesc, usedRef ? (usedRef + '-in') : null, 'Success'], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                    db.commit(err => {
                      if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                      return res.status(201).json({
                        message: 'Transfer completed',
                        from: { Bank_ID: bankId, Balance_Before: balanceBefore, Balance_After: balanceAfter },
                        to: { Bank_ID: To_Bank_ID, Balance_Before: destBalanceBefore, Balance_After: destBalanceAfter }
                      });
                    });
                  });
                });
              });
            } else {
              db.commit(err => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                return res.status(201).json({ message: 'Transaction recorded', Bank_ID: bankId, Balance_Before: balanceBefore, Balance_After: balanceAfter });
              });
            }
          }
        });
      });
    });
  });
});

// GET transaction history for a bank account (optionally date range)
// GET transaction history for a bank account (optionally date range)
app.get('/bank/accounts/:bankId/transactions', (req, res) => {
  const { bankId } = req.params;
  const { from, to } = req.query;
  let sql = 'SELECT * FROM Transaction_Logs WHERE Bank_ID = ?';
  const params = [bankId];
  
  // Use DATE() function to compare only the date part
  if (from) { 
    sql += ' AND DATE(created_at) >= ?'; 
    params.push(from); 
  }
  if (to) { 
    sql += ' AND DATE(created_at) <= ?'; 
    params.push(to); 
  }
  
  sql += ' ORDER BY created_at DESC';
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET transaction history for all bank accounts of a farmer
// GET transaction history for all bank accounts of a farmer
app.get('/farmers/:id/bank/transactions', (req, res) => {
  const farmerId = req.params.id;
  const { from, to } = req.query;
  
  let sql = `
    SELECT tl.* FROM Transaction_Logs tl
    JOIN Bank_Details bd ON tl.Bank_ID = bd.Bank_ID
    WHERE bd.Farmer_ID = ?
  `;
  const params = [farmerId];
  
  // Use DATE() function to compare only the date part
  if (from) {
    sql += ' AND DATE(tl.created_at) >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND DATE(tl.created_at) <= ?';
    params.push(to);
  }
  
  sql += ' ORDER BY tl.created_at DESC';
  
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ---------------------------
// FILTER & REPORTS (joins, selects)
// Endpoint for advanced filters (name, state, minBalance, cropType, taxStatus)
// ---------------------------
app.get('/bank/reports/filter', (req, res) => {
  const { name, state, minBalance, maxBalance, cropType, taxStatus } = req.query;

  let sql = `
    SELECT DISTINCT f.Farmer_ID, CONCAT(f.First_Name,' ',f.Last_Name) AS Farmer_Name, 
           f.Email_ID, f.City, f.State,
           bd.Bank_ID, bd.Bank_Name, bd.Account_Number, COALESCE(bd.Account_Balance,0) AS Account_Balance,
           GROUP_CONCAT(DISTINCT c.Crop_Name SEPARATOR ', ') AS Crops,
           GROUP_CONCAT(DISTINCT t.Current_Status SEPARATOR ', ') AS Tax_Statuses
    FROM Farmer_Details f
    LEFT JOIN Bank_Details bd ON f.Farmer_ID = bd.Farmer_ID
    LEFT JOIN Crop_Details c ON f.Farmer_ID = c.Farmer_ID
    LEFT JOIN Tax_Details t ON f.Farmer_ID = t.Farmer_ID
    WHERE 1=1
  `;
  const params = [];

  if (name) {
    // Use CONCAT to search in full name
    sql += ' AND CONCAT(f.First_Name, " ", f.Last_Name) LIKE ?';
    params.push(`%${name}%`);
  }
  if (state) {
    sql += ' AND f.State LIKE ?';
    params.push(`%${state}%`);
  }
  if (minBalance) {
    sql += ' AND COALESCE(bd.Account_Balance,0) >= ?';
    params.push(minBalance);
  }
  if (maxBalance) {
    sql += ' AND COALESCE(bd.Account_Balance,0) <= ?';
    params.push(maxBalance);
  }
  if (cropType) {
    sql += ' AND c.Type = ?';
    params.push(cropType);
  }
  if (taxStatus) {
    sql += ' AND t.Current_Status = ?';
    params.push(taxStatus);
  }

  sql += ' GROUP BY f.Farmer_ID, bd.Bank_ID ORDER BY f.Farmer_ID, bd.Is_Primary DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ---------------------------
// Read-only endpoints for DDL objects (views & procedure call)
// ---------------------------

// Query the view (overview)
app.get('/view/farmer_bank_overview', (req, res) => {
  const sql = 'SELECT * FROM vw_farmer_bank_overview ORDER BY Total_Balance DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Call stored procedure proc_get_farmer_transactions
app.get('/proc/farmer_transactions/:farmerId', (req, res) => {
  const farmerId = parseInt(req.params.farmerId, 10);
  const { from, to } = req.query;
  // MySQL procedure call
  const sql = 'CALL proc_get_farmer_transactions(?, ?, ?)';
  db.query(sql, [farmerId, from || null, to || null], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    // mysql returns an array with results + metadata; the first item is our rows
    res.json(results[0] || []);
  });
});

// ---------------------------
// Minimal root
// ---------------------------
app.get('/', (req, res) => {
  res.json({
    message: "Bank routes running. Use /setup/dbobjects once to create view/triggers/proc (if your DB user has privileges).",
    endpoints: {
      accounts: "/bank/accounts?farmerId=",
      farmer_bank: "/farmers/:id/bank",
      create_account: "POST /farmers/:id/bank",
      txn: "POST /bank/accounts/:bankId/transactions",
      filter: "/bank/reports/filter",
      view_overview: "/view/farmer_bank_overview"
    }
  });
});

app.listen(5000, () => console.log("Bank routes server running on http://localhost:5000"));