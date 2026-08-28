const db = require('./config/db');

const sql = `
    SELECT
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = 'railway'
    AND REFERENCED_TABLE_NAME = 'products'
    AND REFERENCED_COLUMN_NAME = 'id';
`;

db.query(sql, (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(results, null, 2));
    }
    process.exit();
});
