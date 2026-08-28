/**
 * End-to-end test of the product deletion logic.
 * Connects to the same Railway database as production.
 * Runs the exact same SQL steps as the DELETE route.
 *
 * Usage:  node backend/test_delete_full.js <product_id>
 *   e.g.: node backend/test_delete_full.js 19
 *
 * WARNING: This will actually delete the product from the database.
 * Use a test product ID, not a live product you want to keep.
 */

const db = require('./config/db');

const productId = process.argv[2];
if (!productId) {
    console.error("Usage: node test_delete_full.js <product_id>");
    process.exit(1);
}

async function testDelete(id) {
    console.log(`\n========== TEST DELETE product id=${id} ==========`);
    const pool = db.promise();
    let connection;

    try {
        connection = await pool.getConnection();
        console.log("[1] Connection acquired");

        await connection.beginTransaction();
        console.log("[2] Transaction started");

        const [productRows] = await connection.query(
            "SELECT id, product_name FROM products WHERE id = ?", [id]
        );
        if (productRows.length === 0) {
            console.log(`[3] Product ID ${id} does NOT exist in database.`);
            await connection.rollback();
            connection.release();
            return;
        }
        console.log(`[3] Product found: "${productRows[0].product_name}"`);

        const [invResult] = await connection.query(
            "DELETE FROM inventory_transactions WHERE product_id = ?", [id]
        );
        console.log(`[4] inventory_transactions deleted: ${invResult.affectedRows}`);

        const [salesResult] = await connection.query(
            "UPDATE sales SET product_id = NULL WHERE product_id = ?", [id]
        );
        console.log(`[5] sales de-linked: ${salesResult.affectedRows}`);

        const [installResult] = await connection.query(
            "UPDATE installations SET product_id = NULL WHERE product_id = ?", [id]
        );
        console.log(`[6] installations de-linked: ${installResult.affectedRows}`);

        const [maintResult] = await connection.query(
            "UPDATE maintenance SET product_id = NULL WHERE product_id = ?", [id]
        );
        console.log(`[7] maintenance de-linked: ${maintResult.affectedRows}`);

        const [poResult] = await connection.query(
            "UPDATE purchase_orders SET product_id = NULL WHERE product_id = ?", [id]
        );
        console.log(`[8] purchase_orders de-linked: ${poResult.affectedRows}`);

        const [deleteResult] = await connection.query(
            "DELETE FROM products WHERE id = ?", [id]
        );
        console.log(`[9] products deleted: ${deleteResult.affectedRows}`);

        if (deleteResult.affectedRows === 0) {
            console.error("[9] ERROR: Product row not deleted (affectedRows=0). Rolling back.");
            await connection.rollback();
            connection.release();
            return;
        }

        await connection.commit();
        connection.release();

        console.log(`\n✅ SUCCESS — Product id=${id} deleted cleanly.\n`);

    } catch (err) {
        console.error("\n========== ERROR ==========");
        console.error("Code       :", err.code);
        console.error("Errno      :", err.errno);
        console.error("SQL State  :", err.sqlState);
        console.error("SQL Message:", err.sqlMessage);
        console.error("Message    :", err.message);
        console.error("===========================\n");
        if (connection) {
            try { await connection.rollback(); } catch (_) {}
            try { connection.release(); } catch (_) {}
        }
    } finally {
        process.exit(0);
    }
}

testDelete(productId);
