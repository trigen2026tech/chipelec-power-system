const db = require("./config/db");

db.query("SHOW TABLES", (err, tables) => {
    if (err) throw err;
    console.log("TABLES:", tables);
    let tableNames = tables.map(t => Object.values(t)[0]);
    let completed = 0;
    
    if (tableNames.length === 0) {
        process.exit();
    }
    
    for (let table of tableNames) {
        db.query(`DESCRIBE ${table}`, (err, desc) => {
            if (err) throw err;
            console.log(`\n--- SCHEMA FOR ${table} ---`);
            console.log(desc);
            completed++;
            if (completed === tableNames.length) {
                process.exit();
            }
        });
    }
});
