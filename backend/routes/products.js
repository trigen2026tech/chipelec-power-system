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

    console.log("========== DELETE PRODUCT REQUEST ==========");
    console.log("Product ID:", id);

    // Get a connection from the pool to manage the transaction lifecycle
    db.getConnection((connErr, connection) => {
        if (connErr) {
            console.error("Error getting connection from pool:", connErr);
            return res.status(500).json({
                success: false,
                message: "Unable to delete product"
            });
        }

        // Start transaction
        connection.beginTransaction((txErr) => {
            if (txErr) {
                console.error("Error beginning transaction:", txErr);
                connection.release();
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete product"
                });
            }

            // Step 1: Verify the product exists
            const checkSql = "SELECT id FROM products WHERE id = ?";
            connection.query(checkSql, [id], (checkErr, checkResult) => {
                if (checkErr) {
                    console.error("Error checking product:", checkErr);
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({
                            success: false,
                            message: "Unable to delete product"
                        });
                    });
                }

                if (checkResult.length === 0) {
                    return connection.rollback(() => {
                        connection.release();
                        res.status(404).json({
                            success: false,
                            message: "Product not found"
                        });
                    });
                }

                // Step 2: Delete dependent records in inventory_transactions first
                const deleteInvSql = "DELETE FROM inventory_transactions WHERE product_id = ?";
                connection.query(deleteInvSql, [id], (invErr, invResult) => {
                    if (invErr) {
                        console.error("Error deleting inventory transactions:", invErr);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                                success: false,
                                message: "Unable to delete product"
                            });
                        });
                    }

                    console.log(`Deleted dependent inventory transactions for product ${id}.`);

                    // Step 3: Hard-delete the product itself
                    const deleteSql = "DELETE FROM products WHERE id = ?";
                    connection.query(deleteSql, [id], (deleteErr, deleteResult) => {
                        if (deleteErr) {
                            console.error("Error deleting product record:", deleteErr);
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({
                                    success: false,
                                    message: "Unable to delete product"
                                });
                            });
                        }

                        if (deleteResult.affectedRows === 0) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(404).json({
                                    success: false,
                                    message: "Product not found"
                                });
                            });
                        }

                        // Commit the transaction
                        connection.commit((commitErr) => {
                            if (commitErr) {
                                console.error("Error committing transaction:", commitErr);
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({
                                        success: false,
                                        message: "Unable to delete product"
                                    });
                                });
                            }

                            console.log(`Product ${id} and its dependencies hard-deleted successfully.`);
                            connection.release();
                            return res.status(200).json({
                                success: true,
                                message: "Product deleted successfully"
                            });
                        });
                    });
                });
            });
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