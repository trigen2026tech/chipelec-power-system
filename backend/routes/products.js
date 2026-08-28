const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multer");

// GET all products
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
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    console.log(`\n========== DELETE PRODUCT REQUEST ==========`);
    console.log(`Product ID received: ${id}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Get a dedicated connection from the pool for transaction support
    db.getConnection((connectionError, connection) => {

        if (connectionError) {
            console.error("DELETE PRODUCT - CONNECTION ERROR:", {
                code: connectionError.code,
                errno: connectionError.errno,
                message: connectionError.message
            });
            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                debug: { code: connectionError.code, message: connectionError.message }
            });
        }

        console.log("✅ Database connection acquired");

        // Start transaction
        connection.beginTransaction((transactionError) => {

            if (transactionError) {
                console.error("DELETE PRODUCT - TRANSACTION START ERROR:", transactionError);
                connection.release();
                return res.status(500).json({
                    success: false,
                    message: "Unable to start delete transaction",
                    debug: { code: transactionError.code, message: transactionError.message }
                });
            }

            console.log("✅ Transaction started");

            // ==========================================
            // STEP 1: CHECK PRODUCT EXISTS
            // ==========================================

            connection.query(
                "SELECT id, product_name FROM products WHERE id = ?",
                [id],
                (checkError, products) => {

                    if (checkError) {
                        console.error("STEP 1 - CHECK PRODUCT ERROR:", {
                            code: checkError.code,
                            errno: checkError.errno,
                            sqlMessage: checkError.sqlMessage,
                            message: checkError.message,
                            sql: checkError.sql
                        });
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                                success: false,
                                message: "Unable to check product",
                                debug: { code: checkError.code, sqlMessage: checkError.sqlMessage }
                            });
                        });
                    }

                    if (products.length === 0) {
                        console.log(`STEP 1 - Product ID ${id} not found in database`);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(404).json({
                                success: false,
                                message: "Product not found"
                            });
                        });
                    }

                    console.log(`STEP 1 ✅ Product found: "${products[0].product_name}" (id=${id})`);

                    // ==========================================
                    // STEP 2: DELETE INVENTORY TRANSACTIONS
                    // (Hard delete — these are stock movement logs)
                    // ==========================================

                    connection.query(
                        "DELETE FROM inventory_transactions WHERE product_id = ?",
                        [id],
                        (inventoryError, inventoryResult) => {

                            if (inventoryError) {
                                console.error("STEP 2 - DELETE inventory_transactions ERROR:", {
                                    code: inventoryError.code,
                                    errno: inventoryError.errno,
                                    sqlMessage: inventoryError.sqlMessage,
                                    message: inventoryError.message,
                                    sql: inventoryError.sql
                                });
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({
                                        success: false,
                                        message: "Unable to delete product inventory records",
                                        debug: { code: inventoryError.code, sqlMessage: inventoryError.sqlMessage }
                                    });
                                });
                            }

                            console.log(`STEP 2 ✅ inventory_transactions deleted: ${inventoryResult.affectedRows} rows`);

                            // ==========================================
                            // STEP 3: NULL-OUT product_id IN sales
                            // (Preserve historical sales records)
                            // ==========================================

                            connection.query(
                                "UPDATE sales SET product_id = NULL WHERE product_id = ?",
                                [id],
                                (salesError, salesResult) => {

                                    if (salesError) {
                                        console.error("STEP 3 - UPDATE sales ERROR:", {
                                            code: salesError.code,
                                            errno: salesError.errno,
                                            sqlMessage: salesError.sqlMessage,
                                            message: salesError.message,
                                            sql: salesError.sql
                                        });
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(500).json({
                                                success: false,
                                                message: "Unable to de-link product from sales records",
                                                debug: { code: salesError.code, sqlMessage: salesError.sqlMessage }
                                            });
                                        });
                                    }

                                    console.log(`STEP 3 ✅ sales records de-linked: ${salesResult.affectedRows} rows`);

                                    // ==========================================
                                    // STEP 4: NULL-OUT product_id IN installations
                                    // (Preserve customer installation history)
                                    // ==========================================

                                    connection.query(
                                        "UPDATE installations SET product_id = NULL WHERE product_id = ?",
                                        [id],
                                        (installError, installResult) => {

                                            if (installError) {
                                                console.error("STEP 4 - UPDATE installations ERROR:", {
                                                    code: installError.code,
                                                    errno: installError.errno,
                                                    sqlMessage: installError.sqlMessage,
                                                    message: installError.message,
                                                    sql: installError.sql
                                                });
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    res.status(500).json({
                                                        success: false,
                                                        message: "Unable to de-link product from installation records",
                                                        debug: { code: installError.code, sqlMessage: installError.sqlMessage }
                                                    });
                                                });
                                            }

                                            console.log(`STEP 4 ✅ installations de-linked: ${installResult.affectedRows} rows`);

                                            // ==========================================
                                            // STEP 5: NULL-OUT product_id IN maintenance
                                            // (Preserve customer maintenance history)
                                            // ==========================================

                                            connection.query(
                                                "UPDATE maintenance SET product_id = NULL WHERE product_id = ?",
                                                [id],
                                                (maintError, maintResult) => {

                                                    if (maintError) {
                                                        console.error("STEP 5 - UPDATE maintenance ERROR:", {
                                                            code: maintError.code,
                                                            errno: maintError.errno,
                                                            sqlMessage: maintError.sqlMessage,
                                                            message: maintError.message,
                                                            sql: maintError.sql
                                                        });
                                                        return connection.rollback(() => {
                                                            connection.release();
                                                            res.status(500).json({
                                                                success: false,
                                                                message: "Unable to de-link product from maintenance records",
                                                                debug: { code: maintError.code, sqlMessage: maintError.sqlMessage }
                                                            });
                                                        });
                                                    }

                                                    console.log(`STEP 5 ✅ maintenance records de-linked: ${maintResult.affectedRows} rows`);

                                                    // ==========================================
                                                    // STEP 6: NULL-OUT product_id IN purchase_orders
                                                    // (Preserve procurement history)
                                                    // ==========================================

                                                    connection.query(
                                                        "UPDATE purchase_orders SET product_id = NULL WHERE product_id = ?",
                                                        [id],
                                                        (poError, poResult) => {

                                                            if (poError) {
                                                                console.error("STEP 6 - UPDATE purchase_orders ERROR:", {
                                                                    code: poError.code,
                                                                    errno: poError.errno,
                                                                    sqlMessage: poError.sqlMessage,
                                                                    message: poError.message,
                                                                    sql: poError.sql
                                                                });
                                                                return connection.rollback(() => {
                                                                    connection.release();
                                                                    res.status(500).json({
                                                                        success: false,
                                                                        message: "Unable to de-link product from purchase orders",
                                                                        debug: { code: poError.code, sqlMessage: poError.sqlMessage }
                                                                    });
                                                                });
                                                            }

                                                            console.log(`STEP 6 ✅ purchase_orders de-linked: ${poResult.affectedRows} rows`);

                                                            // ==========================================
                                                            // STEP 7: DELETE THE PRODUCT
                                                            // (All FK references cleared — safe to delete)
                                                            // ==========================================

                                                            connection.query(
                                                                "DELETE FROM products WHERE id = ?",
                                                                [id],
                                                                (deleteError, deleteResult) => {

                                                                    if (deleteError) {
                                                                        console.error("STEP 7 - DELETE products ERROR:", {
                                                                            code: deleteError.code,
                                                                            errno: deleteError.errno,
                                                                            sqlMessage: deleteError.sqlMessage,
                                                                            message: deleteError.message,
                                                                            sql: deleteError.sql
                                                                        });
                                                                        return connection.rollback(() => {
                                                                            connection.release();
                                                                            res.status(500).json({
                                                                                success: false,
                                                                                message: "Unable to delete product",
                                                                                debug: {
                                                                                    code: deleteError.code,
                                                                                    errno: deleteError.errno,
                                                                                    sqlMessage: deleteError.sqlMessage,
                                                                                    message: deleteError.message
                                                                                }
                                                                            });
                                                                        });
                                                                    }

                                                                    if (deleteResult.affectedRows === 0) {
                                                                        console.log(`STEP 7 - Product ID ${id} not found at delete step`);
                                                                        return connection.rollback(() => {
                                                                            connection.release();
                                                                            res.status(404).json({
                                                                                success: false,
                                                                                message: "Product not found"
                                                                            });
                                                                        });
                                                                    }

                                                                    console.log(`STEP 7 ✅ Product ID ${id} deleted from products table`);

                                                                    // ==========================================
                                                                    // STEP 8: COMMIT TRANSACTION
                                                                    // ==========================================

                                                                    connection.commit((commitError) => {

                                                                        if (commitError) {
                                                                            console.error("STEP 8 - COMMIT ERROR:", {
                                                                                code: commitError.code,
                                                                                message: commitError.message
                                                                            });
                                                                            return connection.rollback(() => {
                                                                                connection.release();
                                                                                res.status(500).json({
                                                                                    success: false,
                                                                                    message: "Unable to complete product deletion",
                                                                                    debug: { code: commitError.code, message: commitError.message }
                                                                                });
                                                                            });
                                                                        }

                                                                        connection.release();

                                                                        console.log(`\n✅✅ Product ${id} permanently deleted successfully`);
                                                                        console.log(`   inventory_transactions removed : ${inventoryResult.affectedRows}`);
                                                                        console.log(`   sales de-linked                : ${salesResult.affectedRows}`);
                                                                        console.log(`   installations de-linked        : ${installResult.affectedRows}`);
                                                                        console.log(`   maintenance de-linked          : ${maintResult.affectedRows}`);
                                                                        console.log(`   purchase_orders de-linked      : ${poResult.affectedRows}`);
                                                                        console.log(`============================================\n`);

                                                                        return res.status(200).json({
                                                                            success: true,
                                                                            message: "Product deleted successfully",
                                                                            deletedId: parseInt(id),
                                                                            summary: {
                                                                                inventoryTransactionsRemoved: inventoryResult.affectedRows,
                                                                                salesDelinked: salesResult.affectedRows,
                                                                                installationsDelinked: installResult.affectedRows,
                                                                                maintenanceDelinked: maintResult.affectedRows,
                                                                                purchaseOrdersDelinked: poResult.affectedRows
                                                                            }
                                                                        });

                                                                    });

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        });

    });

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



// Keep the rest of your existing code below
module.exports = router;