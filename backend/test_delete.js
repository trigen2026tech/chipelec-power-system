const db = require('./config/db');

// First, find what's blocking product 19
const sql = `DELETE FROM products WHERE id = 19;`;

db.query(sql, (err, results) => {
    if (err) {
        console.error("DELETE ERROR:", {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        });
    } else {
        console.log("Delete success:", results);
    }
    process.exit();
});
