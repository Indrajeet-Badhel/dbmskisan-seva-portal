import express from "express";
import db from "./db.js";

const router = express.Router();

// GET all crops
router.get("/", (req, res) => {
  const sql = `
    SELECT c.*, f.First_Name, f.Last_Name
    FROM Crop_Details c
    LEFT JOIN Farmer_Details f ON c.Farmer_ID = f.Farmer_ID
    ORDER BY c.Crop_ID DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// FILTER crops (must come BEFORE /:id)
router.get("/filter", (req, res) => {
  const { name, type, seasonYear, minPrice, maxPrice, minQty, maxQty } = req.query;

  let sql = `
    SELECT c.*, f.First_Name, f.Last_Name
    FROM Crop_Details c
    LEFT JOIN Farmer_Details f ON c.Farmer_ID = f.Farmer_ID
    WHERE 1=1
  `;
  const params = [];

  if (name) { sql += ` AND c.Crop_Name LIKE ?`; params.push(`%${name}%`); }
  if (type) { sql += ` AND c.Type = ?`; params.push(type); }
  if (seasonYear) { sql += ` AND c.Season_Year = ?`; params.push(seasonYear); }
  if (minPrice) { sql += ` AND c.Price_Per_Unit >= ?`; params.push(minPrice); }
  if (maxPrice) { sql += ` AND c.Price_Per_Unit <= ?`; params.push(maxPrice); }
  if (minQty) { sql += ` AND c.Quantity_Available >= ?`; params.push(minQty); }
  if (maxQty) { sql += ` AND c.Quantity_Available <= ?`; params.push(maxQty); }

  sql += ` ORDER BY c.Crop_ID DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET BY ID (should come AFTER filter)
router.get("/:id", (req, res) => {
  db.query(`SELECT * FROM Crop_Details WHERE Crop_ID=?`, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || {});
  });
});

// ADD
router.post("/", (req, res) => {
  const {
    Crop_Name, Farmer_ID, Harvest_Start, Harvest_End,
    Fertilizers_Used, Type, Area_Planted, Expected_Yield,
    Price_Per_Unit, Quantity_Available, Season_Year
  } = req.body;

  const sql = `
    INSERT INTO Crop_Details
    (Crop_Name, Farmer_ID, Harvest_Start, Harvest_End,
    Fertilizers_Used, Type, Area_Planted, Expected_Yield,
    Price_Per_Unit, Quantity_Available, Season_Year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    Crop_Name, Farmer_ID, Harvest_Start, Harvest_End,
    Fertilizers_Used, Type, Area_Planted, Expected_Yield,
    Price_Per_Unit, Quantity_Available, Season_Year
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Crop added", id: result.insertId });
  });
});

// UPDATE
router.put("/:id", (req, res) => {
  const {
    Crop_Name, Harvest_Start, Harvest_End, Fertilizers_Used,
    Type, Area_Planted, Expected_Yield, Price_Per_Unit,
    Quantity_Available, Season_Year
  } = req.body;

  const sql = `
    UPDATE Crop_Details SET
      Crop_Name=?, Harvest_Start=?, Harvest_End=?, Fertilizers_Used=?,
      Type=?, Area_Planted=?, Expected_Yield=?, Price_Per_Unit=?,
      Quantity_Available=?, Season_Year=?
    WHERE Crop_ID=?
  `;

  db.query(sql, [
    Crop_Name, Harvest_Start, Harvest_End, Fertilizers_Used,
    Type, Area_Planted, Expected_Yield, Price_Per_Unit,
    Quantity_Available, Season_Year, req.params.id
  ], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Crop updated" });
  });
});

// DELETE
router.delete("/:id", (req, res) => {
  db.query(`DELETE FROM Crop_Details WHERE Crop_ID=?`, [req.params.id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Crop deleted" });
  });
});

export default router;
