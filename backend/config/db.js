const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let sslConfig = false;

// Local development
if (fs.existsSync(path.join(__dirname, "../ca.pem"))) {
    sslConfig = {
        ca: fs.readFileSync(path.join(__dirname, "../ca.pem"))
    };
}

// Production
if (process.env.DB_SSL_CA) {
    sslConfig = {
        ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n")
    };
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err);
    } else {
        console.log("✅ MySQL Pool Connected");
        connection.release();
    }
});

module.exports = pool;