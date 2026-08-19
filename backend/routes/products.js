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

    // Step 1: Check whether product exists
    const checkSql = "SELECT id, status FROM products WHERE id = ?";
    db.query(checkSql, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("========== CHECK PRODUCT ERROR ==========");
            console.error("Product ID:", id);
            console.error("MySQL Error Code:", checkErr.code);
            console.error("MySQL Error Number:", checkErr.errno);
            console.error("MySQL SQL Message:", checkErr.sqlMessage);
            console.error("=========================================");
            return res.status(500).json({
                success: false,
                message: "Unable to delete product"
            });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Step 2: Check inventory_transactions references
        const checkInventorySql = "SELECT COUNT(*) AS count FROM inventory_transactions WHERE product_id = ?";
        db.query(checkInventorySql, [id], (invErr, invResult) => {
            if (invErr) {
                console.error("========== CHECK INVENTORY ERROR ==========");
                console.error("Product ID:", id);
                console.error("MySQL Error Code:", invErr.code);
                console.error("MySQL Error Number:", invErr.errno);
                console.error("MySQL SQL Message:", invErr.sqlMessage);
                console.error("===========================================");
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete product"
                });
            }

            const hasInventoryHistory = invResult[0].count > 0;

            if (hasInventoryHistory) {
                console.log("FOREIGN KEY ERROR DETECTED");
                console.log("ATTEMPTING SOFT DELETE");

                const softDeleteSql = "UPDATE products SET status = 'Inactive' WHERE id = ?";
                db.query(softDeleteSql, [id], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("========== SOFT DELETE ERROR ==========");
                        console.error("Product ID:", id);
                        console.error("MySQL Error Code:", updateErr.code);
                        console.error("MySQL Error Number:", updateErr.errno);
                        console.error("MySQL SQL Message:", updateErr.sqlMessage);
                        console.error("=======================================");
                        return res.status(500).json({
                            success: false,
                            message: "Unable to delete product"
                        });
                    }

                    console.log(`Product ${id} deactivated because inventory history exists. SOFT DELETE SUCCESS`);
                    return res.status(200).json({
                        success: true,
                        message: "Product deactivated successfully"
                    });
                });
                return;
            }

            // Step 3: No inventory history, safe to hard delete
            console.log("DELETE QUERY STARTED");
            const deleteSql = "DELETE FROM products WHERE id = ?";
            db.query(deleteSql, [id], (err, result) => {
                if (err) {
                    console.error("========== DELETE PRODUCT ERROR ==========");
                    console.error("Product ID:", id);
                    console.error("MySQL Error Code:", err.code);
                    console.error("MySQL Error Number:", err.errno);
                    console.error("MySQL SQL Message:", err.sqlMessage);
                    console.error("==========================================");

                    // Fallback to soft delete if another constraint triggers it
                    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
                        const softDeleteSql = "UPDATE products SET status = 'Inactive' WHERE id = ?";
                        db.query(softDeleteSql, [id], (fallbackErr) => {
                            if (fallbackErr) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to delete product"
                                });
                            }
                            return res.status(200).json({
                                success: true,
                                message: "Product deactivated successfully"
                            });
                        });
                        return;
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Unable to delete product"
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });
                }

                console.log(`Product ${id} hard-deleted successfully. HARD DELETE SUCCESS`);
                return res.status(200).json({
                    success: true,
                    message: "Product deleted successfully"
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