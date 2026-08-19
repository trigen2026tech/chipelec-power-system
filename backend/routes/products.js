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

    // Get a dedicated connection from the pool
    db.getConnection((connectionError, connection) => {

        if (connectionError) {

            console.error("DELETE PRODUCT - CONNECTION ERROR:", connectionError);

            return res.status(500).json({
                success: false,
                message: "Database connection failed"
            });
        }

        // Start transaction
        connection.beginTransaction((transactionError) => {

            if (transactionError) {

                console.error("DELETE PRODUCT - TRANSACTION ERROR:", transactionError);

                connection.release();

                return res.status(500).json({
                    success: false,
                    message: "Unable to start delete transaction"
                });
            }

            // ==========================================
            // STEP 1: CHECK PRODUCT EXISTS
            // ==========================================

            const checkProductSql = `
                SELECT id
                FROM products
                WHERE id = ?
            `;

            connection.query(
                checkProductSql,
                [id],
                (checkError, products) => {

                    if (checkError) {

                        console.error("CHECK PRODUCT ERROR:", checkError);

                        return connection.rollback(() => {
                            connection.release();

                            res.status(500).json({
                                success: false,
                                message: "Unable to check product"
                            });
                        });
                    }

                    // Product doesn't exist
                    if (products.length === 0) {

                        return connection.rollback(() => {
                            connection.release();

                            res.status(404).json({
                                success: false,
                                message: "Product not found"
                            });
                        });
                    }

                    // ==========================================
                    // STEP 2: DELETE INVENTORY TRANSACTIONS
                    // ==========================================

                    const deleteInventorySql = `
                        DELETE FROM inventory_transactions
                        WHERE product_id = ?
                    `;

                    connection.query(
                        deleteInventorySql,
                        [id],
                        (inventoryError, inventoryResult) => {

                            if (inventoryError) {

                                console.error(
                                    "DELETE INVENTORY TRANSACTIONS ERROR:",
                                    inventoryError
                                );

                                return connection.rollback(() => {
                                    connection.release();

                                    res.status(500).json({
                                        success: false,
                                        message: "Unable to delete product inventory records"
                                    });
                                });
                            }

                            console.log(
                                "Inventory transactions deleted:",
                                inventoryResult.affectedRows
                            );

                            // ==========================================
                            // STEP 3: DELETE PRODUCT
                            // ==========================================

                            const deleteProductSql = `
                                DELETE FROM products
                                WHERE id = ?
                            `;

                            connection.query(
                                deleteProductSql,
                                [id],
                                (deleteError, deleteResult) => {

                                    if (deleteError) {

                                        console.error(
                                            "DELETE PRODUCT ERROR:",
                                            deleteError
                                        );

                                        return connection.rollback(() => {
                                            connection.release();

                                            res.status(500).json({
                                                success: false,
                                                message: "Unable to delete product"
                                            });
                                        });
                                    }

                                    // ==========================================
                                    // STEP 4: VERIFY PRODUCT WAS DELETED
                                    // ==========================================

                                    if (deleteResult.affectedRows === 0) {

                                        return connection.rollback(() => {
                                            connection.release();

                                            res.status(404).json({
                                                success: false,
                                                message: "Product not found"
                                            });
                                        });
                                    }

                                    // ==========================================
                                    // STEP 5: COMMIT
                                    // ==========================================

                                    connection.commit((commitError) => {

                                        if (commitError) {

                                            console.error(
                                                "DELETE PRODUCT COMMIT ERROR:",
                                                commitError
                                            );

                                            return connection.rollback(() => {
                                                connection.release();

                                                res.status(500).json({
                                                    success: false,
                                                    message: "Unable to complete product deletion"
                                                });
                                            });
                                        }

                                        console.log(
                                            `✅ Product ${id} permanently deleted`
                                        );

                                        console.log(
                                            `Inventory transactions removed: ${inventoryResult.affectedRows}`
                                        );

                                        connection.release();

                                        return res.status(200).json({
                                            success: true,
                                            message: "Product deleted successfully"
                                        });

                                    });

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