const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ===========================
// GET ALL MAINTENANCE
// ===========================
router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            m.*,
            c.full_name AS customer_name,
            p.product_name
        FROM maintenance m
        JOIN customers c
            ON m.customer_id = c.id
        JOIN products p
            ON m.product_id = p.id
        ORDER BY m.id DESC
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
            data: results
        });

    });

});


// ===========================
// ADD MAINTENANCE
// ===========================
router.post("/", authMiddleware, (req, res) => {

    const {
        customer_id,
        product_id,
        maintenance_date,
        maintenance_type,
        technician_name,
        status,
        remarks
    } = req.body;

    const sql = `
        INSERT INTO maintenance
        (
            customer_id,
            product_id,
            maintenance_date,
            maintenance_type,
            technician_name,
            status,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            product_id,
            maintenance_date,
            maintenance_type,
            technician_name,
            status,
            remarks
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to Save"
                });

            }

            res.json({
                success: true,
                message: "Maintenance Added Successfully"
            });

        }
    );

});

// ===========================
// GET SINGLE MAINTENANCE
// ===========================
router.get("/:id", authMiddleware, (req, res) => {

    const sql = `
        SELECT *
        FROM maintenance
        WHERE id = ?
    `;

    db.query(sql, [req.params.id], (err, result) => {

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
                message: "Maintenance Not Found"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    });

});

// ===========================
// UPDATE MAINTENANCE
// ===========================
router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        customer_id,
        product_id,
        maintenance_date,
        maintenance_type,
        technician_name,
        status,
        remarks
    } = req.body;

    const sql = `
        UPDATE maintenance
        SET
            customer_id = ?,
            product_id = ?,
            maintenance_date = ?,
            maintenance_type = ?,
            technician_name = ?,
            status = ?,
            remarks = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            customer_id,
            product_id,
            maintenance_date,
            maintenance_type,
            technician_name,
            status,
            remarks,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update maintenance"
                });
            }

            res.json({
                success: true,
                message: "Maintenance Updated Successfully"
            });

        }
    );

});

// ===========================
// DELETE MAINTENANCE
// ===========================
router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM maintenance WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Unable to delete maintenance"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Maintenance not found"
            });
        }

        res.json({
            success: true,
            message: "Maintenance Deleted Successfully"
        });

    });

});

module.exports = router;