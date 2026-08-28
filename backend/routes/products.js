const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multer");

// ======================
// GET ALL PRODUCTS
// ======================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            p.id,
            p.product_name,
            p.model_number,
            p.capacity,
            p.warranty,
            p.price,
            p.stock_quantity,
            p.description,
            p.image,
            p.status,
            b.brand_name,
            c.category_name
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        JOIN categories c ON p.category_id = c.id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    });

});

// ======================
// ADD PRODUCT
// ======================

router.post("/", authMiddleware, (req, res) => {

    const {
        category_id,
        brand_id,
        product_name,
        model_number,
        capacity,
        warranty,
        price,
        stock_quantity,
        description
    } = req.body;

    const sql = `
        INSERT INTO products
        (
            category_id,
            brand_id,
            product_name,
            model_number,
            capacity,
            warranty,
            price,
            stock_quantity,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            category_id,
            brand_id,
            product_name,
            model_number,
            capacity,
            warranty,
            price,
            stock_quantity,
            description
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to add product"
                });
            }

            res.json({
                success: true,
                message: "Product Added Successfully",
                productId: result.insertId
            });

        }
    );

});

// ======================
// GET SINGLE PRODUCT
// ======================

router.get("/:id", (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT *
        FROM products
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });

        }

        res.json({
            success: true,
            data: result[0]
        });

    });

});

// ======================
// UPDATE PRODUCT
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        category_id,
        brand_id,
        product_name,
        model_number,
        capacity,
        warranty,
        price,
        stock_quantity,
        description,
        status
    } = req.body;

    const sql = `
        UPDATE products
        SET
            category_id = ?,
            brand_id = ?,
            product_name = ?,
            model_number = ?,
            capacity = ?,
            warranty = ?,
            price = ?,
            stock_quantity = ?,
            description = ?,
            status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            category_id,
            brand_id,
            product_name,
            model_number,
            capacity,
            warranty,
            price,
            stock_quantity,
            description,
            status,
            id
        ],
        (err, result) => {

            if (err) {

                console.error("UPDATE ERROR:", err);

                return res.status(500).json({
                    success: false,
                    code: err.code,
                    errno: err.errno,
                    sqlMessage: err.sqlMessage,
                    message: err.message
                });

            }

            res.json({
                success: true,
                message: "Product Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE PRODUCT
//
// Confirmed FK dependencies (queried from information_schema.KEY_COLUMN_USAGE):
//   1. inventory_transactions.product_id  (inventory_transactions_ibfk_1) → DELETE
//   2. sales.product_id                   (sales_ibfk_2)                  → SET NULL
//   3. installations.product_id           (installations_ibfk_2)          → SET NULL
//   4. maintenance.product_id             (maintenance_ibfk_2)            → SET NULL
//   5. purchase_orders.product_id         (purchase_orders_ibfk_2)        → SET NULL
//
// Root cause: Railway was running old code that attempted DELETE on products
// without first clearing FK-referenced rows, causing ER_ROW_IS_REFERENCED_2 (errno 1451).
// ======================

router.delete("/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;

    console.log(`\n========== DELETE PRODUCT id=${id} @ ${new Date().toISOString()} ==========`);

    // db.promise() returns a promise-based wrapper of the same pool
    const pool = db.promise();
    let connection;

    try {

        // [1] Acquire dedicated connection from pool
        connection = await pool.getConnection();
        console.log("  [1] Connection acquired");

        // [2] Begin atomic transaction
        await connection.beginTransaction();
        console.log("  [2] Transaction started");

        // [3] Verify the product actually exists before doing any work
        const [productRows] = await connection.query(
            "SELECT id, product_name FROM products WHERE id = ?",
            [id]
        );

        if (productRows.length === 0) {
            await connection.rollback();
            connection.release();
            console.log(`  Product ID ${id} not found — 404`);
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const productName = productRows[0].product_name;
        console.log(`  [3] Product confirmed: "${productName}"`);

        // [4] DELETE inventory_transactions — these are stock-movement logs, safe to remove
        const [invResult] = await connection.query(
            "DELETE FROM inventory_transactions WHERE product_id = ?",
            [id]
        );
        console.log(`  [4] inventory_transactions deleted: ${invResult.affectedRows} rows`);

        // [5] SET NULL in sales — preserve historical sales records
        const [salesResult] = await connection.query(
            "UPDATE sales SET product_id = NULL WHERE product_id = ?",
            [id]
        );
        console.log(`  [5] sales de-linked: ${salesResult.affectedRows} rows`);

        // [6] SET NULL in installations — preserve customer installation history
        const [installResult] = await connection.query(
            "UPDATE installations SET product_id = NULL WHERE product_id = ?",
            [id]
        );
        console.log(`  [6] installations de-linked: ${installResult.affectedRows} rows`);

        // [7] SET NULL in maintenance — preserve customer service history
        const [maintResult] = await connection.query(
            "UPDATE maintenance SET product_id = NULL WHERE product_id = ?",
            [id]
        );
        console.log(`  [7] maintenance de-linked: ${maintResult.affectedRows} rows`);

        // [8] SET NULL in purchase_orders — preserve procurement history
        const [poResult] = await connection.query(
            "UPDATE purchase_orders SET product_id = NULL WHERE product_id = ?",
            [id]
        );
        console.log(`  [8] purchase_orders de-linked: ${poResult.affectedRows} rows`);

        // [9] All FK references cleared — now safe to delete the product row
        const [deleteResult] = await connection.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // [10] Commit the transaction
        await connection.commit();
        connection.release();

        console.log(`\n  ✅ "${productName}" (id=${id}) deleted successfully`);
        console.log(`     inventory_transactions : ${invResult.affectedRows} removed`);
        console.log(`     sales                 : ${salesResult.affectedRows} de-linked`);
        console.log(`     installations         : ${installResult.affectedRows} de-linked`);
        console.log(`     maintenance           : ${maintResult.affectedRows} de-linked`);
        console.log(`     purchase_orders       : ${poResult.affectedRows} de-linked`);
        console.log(`==========================================================\n`);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            deletedId: parseInt(id)
        });

    } catch (err) {

        // Log the FULL MySQL error to Railway logs
        console.error("========== DELETE PRODUCT ERROR ==========");
        console.error("Product ID  :", id);
        console.error("Error Code  :", err.code);
        console.error("Errno       :", err.errno);
        console.error("SQL State   :", err.sqlState);
        console.error("SQL Message :", err.sqlMessage);
        console.error("Full Error  :", err);
        console.error("==========================================");

        if (connection) {
            try { await connection.rollback(); } catch (_) {}
            try { connection.release(); } catch (_) {}
        }

        return res.status(500).json({
            success: false,
            message: "Unable to delete product",
            errorCode: err.code || "UNKNOWN",
            sqlMessage: err.sqlMessage || err.message || "Unknown database error"
        });
    }

});

// ======================
// UPLOAD PRODUCT IMAGE
// ======================

router.post(
    "/upload/:id",

    (req, res, next) => {
        console.log("🔥 Upload request reached");
        next();
    },

    authMiddleware,

    upload.single("image"),

    (req, res) => {

        console.log("🔥 Multer finished");
        console.log("========== UPLOAD REQUEST ==========");
        console.log("Headers:", req.headers);
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);
        console.log("====================================");

        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        const imagePath = req.file.filename;

        const sql = `
            UPDATE products
            SET image = ?
            WHERE id = ?
        `;

        db.query(sql, [imagePath, id], (err) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.json({
                success: true,
                message: "Image Uploaded Successfully",
                image: imagePath
            });

        });

    }

);

module.exports = router;