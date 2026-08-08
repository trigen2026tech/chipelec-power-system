const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ================================================
// HELPER: Ensure product_id column exists (runs once on first GET)
// This makes the route safe whether or not the migration has been run.
// ================================================

let productIdColumnChecked = false;
let productIdColumnExists = false;

function ensureProductIdColumn(callback) {
    if (productIdColumnChecked) {
        return callback(null, productIdColumnExists);
    }

    const checkSql = `
        SELECT COUNT(*) AS col_count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'enquiries'
          AND COLUMN_NAME  = 'product_id'
    `;

    db.query(checkSql, (err, rows) => {
        if (err) {
            console.error("Column check error:", err);
            productIdColumnChecked = true;
            productIdColumnExists = false;
            return callback(null, false);
        }

        const exists = rows[0].col_count > 0;

        if (!exists) {
            // Auto-add the column so future queries work
            const alterSql = `
                ALTER TABLE enquiries
                ADD COLUMN product_id INT NULL DEFAULT NULL
            `;
            db.query(alterSql, (alterErr) => {
                if (alterErr) {
                    // Column may have been added by another request between check and alter
                    if (alterErr.code === 'ER_DUP_FIELDNAME') {
                        productIdColumnExists = true;
                    } else {
                        console.error("ALTER TABLE enquiries add product_id failed:", alterErr);
                        productIdColumnExists = false;
                    }
                } else {
                    console.log("✅ enquiries.product_id column added automatically.");
                    productIdColumnExists = true;
                }
                productIdColumnChecked = true;
                callback(null, productIdColumnExists);
            });
        } else {
            productIdColumnChecked = true;
            productIdColumnExists = true;
            callback(null, true);
        }
    });
}

// ======================
// GET ALL ENQUIRIES
// (Admin Protected)
// Safely handles whether product_id column exists or not
// ======================

router.get("/", authMiddleware, (req, res) => {

    ensureProductIdColumn((err, hasProductId) => {

        let sql;

        if (hasProductId) {
            sql = `
                SELECT
                    e.id,
                    e.full_name,
                    e.email,
                    e.phone,
                    e.product_id,
                    e.subject,
                    e.message,
                    e.status,
                    e.created_at,
                    e.updated_at,
                    p.product_name,
                    p.model_number,
                    p.image AS product_image
                FROM enquiries e
                LEFT JOIN products p ON e.product_id = p.id
                ORDER BY e.id DESC
            `;
        } else {
            // Fallback: no product_id column yet
            sql = `
                SELECT
                    e.id,
                    e.full_name,
                    e.email,
                    e.phone,
                    e.subject,
                    e.message,
                    e.status,
                    e.created_at,
                    e.updated_at,
                    NULL AS product_id,
                    NULL AS product_name,
                    NULL AS model_number,
                    NULL AS product_image
                FROM enquiries e
                ORDER BY e.id DESC
            `;
        }

        db.query(sql, (queryErr, results) => {

            if (queryErr) {
                console.error("GET /enquiries error:", queryErr);
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

});

// ======================
// GET SINGLE ENQUIRY
// (Admin Protected)
// ======================

router.get("/:id", authMiddleware, (req, res) => {

    ensureProductIdColumn((err, hasProductId) => {

        let sql;

        if (hasProductId) {
            sql = `
                SELECT
                    e.id,
                    e.full_name,
                    e.email,
                    e.phone,
                    e.product_id,
                    e.subject,
                    e.message,
                    e.status,
                    e.created_at,
                    e.updated_at,
                    p.product_name,
                    p.model_number,
                    p.image AS product_image
                FROM enquiries e
                LEFT JOIN products p ON e.product_id = p.id
                WHERE e.id = ?
            `;
        } else {
            sql = `
                SELECT
                    e.id,
                    e.full_name,
                    e.email,
                    e.phone,
                    e.subject,
                    e.message,
                    e.status,
                    e.created_at,
                    e.updated_at,
                    NULL AS product_id,
                    NULL AS product_name,
                    NULL AS model_number,
                    NULL AS product_image
                FROM enquiries e
                WHERE e.id = ?
            `;
        }

        db.query(sql, [req.params.id], (queryErr, result) => {

            if (queryErr) {
                console.error("GET /enquiries/:id error:", queryErr);
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found"
                });
            }

            res.json({
                success: true,
                data: result[0]
            });

        });

    });

});

// ======================
// ADD ENQUIRY
// (Public API — No auth required)
// Backward compatible: product_id is optional
// ======================

router.post("/", (req, res) => {

    const {
        full_name,
        phone,
        email,
        product_id,
        subject,
        message
    } = req.body;

    // Basic validation
    if (!full_name || !full_name.trim()) {
        return res.status(400).json({ success: false, message: "Please enter your name." });
    }
    if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, message: "Please enter your phone number." });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "Please enter your enquiry message." });
    }

    ensureProductIdColumn((err, hasProductId) => {

        let sql, params;

        if (hasProductId) {
            sql = `
                INSERT INTO enquiries (full_name, phone, email, product_id, subject, message)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            params = [
                full_name.trim(),
                phone.trim(),
                email ? email.trim() : null,
                product_id ? parseInt(product_id) : null,
                subject ? subject.trim() : null,
                message.trim()
            ];
        } else {
            sql = `
                INSERT INTO enquiries (full_name, phone, email, subject, message)
                VALUES (?, ?, ?, ?, ?)
            `;
            params = [
                full_name.trim(),
                phone.trim(),
                email ? email.trim() : null,
                subject ? subject.trim() : null,
                message.trim()
            ];
        }

        db.query(sql, params, (queryErr, result) => {

            if (queryErr) {
                console.error("POST /enquiries error:", queryErr);
                return res.status(500).json({
                    success: false,
                    message: "Unable to submit enquiry. Please try again."
                });
            }

            res.json({
                success: true,
                message: "Enquiry submitted successfully",
                enquiryId: result.insertId
            });

        });

    });

});

// ======================
// UPDATE STATUS
// (Admin Protected)
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    const { status } = req.body;

    const validStatuses = ["New", "Contacted", "In Progress", "Converted", "Closed"];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status value"
        });
    }

    db.query(
        "UPDATE enquiries SET status=? WHERE id=?",
        [status, req.params.id],
        (err, result) => {

            if (err) {
                console.error("PUT /enquiries/:id error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update enquiry"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found"
                });
            }

            res.json({
                success: true,
                message: "Status Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE ENQUIRY
// (Admin Protected)
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    db.query(
        "DELETE FROM enquiries WHERE id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.error("DELETE /enquiries/:id error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete enquiry"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found"
                });
            }

            res.json({
                success: true,
                message: "Enquiry Deleted Successfully"
            });

        }
    );

});

module.exports = router;