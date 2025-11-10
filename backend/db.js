import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",        
  password: "faria",   
  database: "farmer_bank"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL Database!");
  }
});

export default db;
