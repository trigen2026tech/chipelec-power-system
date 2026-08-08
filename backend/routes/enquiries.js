const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ALL ENQUIRIES
// (Admin Protected)
// Joins products table to return product_name
// ======================

router.get("/", authMiddleware, (req, res) => {

    const sql = `
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

    db.query(sql, (err, results) => {

        if (err) {
            console.error("GET /enquiries error:", err);
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
// GET SINGLE ENQUIRY
// (Admin Protected)
// ======================

router.get("/:id", authMiddleware, (req, res) => {

    const sql = `
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

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.error("GET /enquiries/:id error:", err);
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

// ======================
// ADD ENQUIRY
// (Public API — No auth required)
// Accepts product_id (optional) for product-specific enquiries
// Backward compatible: product_id is nullable
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

    const sql = `
        INSERT INTO enquiries
        (
            full_name,
            phone,
            email,
            product_id,
            subject,
            message
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            full_name.trim(),
            phone.trim(),
            email ? email.trim() : null,
            product_id ? parseInt(product_id) : null,
            subject ? subject.trim() : null,
            message.trim()
        ],
        (err, result) => {

            if (err) {
                console.error("POST /enquiries error:", err);
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

        }
    );

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