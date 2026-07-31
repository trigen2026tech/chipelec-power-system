const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let sslConfig = false;

// Local development → use ca.pem
if (fs.existsSync(path.join(__dirname, "../ca.pem"))) {
    sslConfig = {
        ca: fs.readFileSync(path.join(__dirname, "../ca.pem"))
    };
}

// Render production → use environment variable
if (process.env.DB_SSL_CA) {
    sslConfig = {
        ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n")
    };
}

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig
});

connection.connect((err) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err);
        return;
    }
    console.log("✅ Connected to Aiven MySQL Database");
});

module.exports = connection;