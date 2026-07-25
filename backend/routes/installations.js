const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ALL INSTALLATIONS
// ======================

router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            i.*,
            c.full_name AS customer_name,
            p.product_name
        FROM installations i
        JOIN customers c ON i.customer_id = c.id
        JOIN products p ON i.product_id = p.id
        ORDER BY i.id DESC
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

// ======================
// ADD INSTALLATION
// ======================

router.post("/", authMiddleware, (req, res) => {

    const {

        customer_id,
        product_id,
        installation_date,
        technician_name,
        installation_address,
        installation_status,
        remarks

    } = req.body;

    const sql = `
        INSERT INTO installations
        (
            customer_id,
            product_id,
            installation_date,
            technician_name,
            installation_address,
            installation_status,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            product_id,
            installation_date,
            technician_name,
            installation_address,
            installation_status,
            remarks
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to add installation"
                });
            }

            res.json({
                success: true,
                message: "Installation Added Successfully"
            });

        }
    );

});

// ======================
// GET SINGLE INSTALLATION
// ======================

router.get("/:id", authMiddleware, (req, res) => {

    const sql = `
        SELECT *
        FROM installations
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
                message: "Installation Not Found"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    });

});

// ======================
// UPDATE INSTALLATION
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        customer_id,
        product_id,
        installation_date,
        technician_name,
        installation_address,
        installation_status,
        remarks
    } = req.body;

    const sql = `
        UPDATE installations
        SET
            customer_id = ?,
            product_id = ?,
            installation_date = ?,
            technician_name = ?,
            installation_address = ?,
            installation_status = ?,
            remarks = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            customer_id,
            product_id,
            installation_date,
            technician_name,
            installation_address,
            installation_status,
            remarks,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update installation"
                });
            }

            res.json({
                success: true,
                message: "Installation Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE INSTALLATION
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM installations WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Unable to delete installation"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Installation not found"
            });
        }

        res.json({
            success: true,
            message: "Installation Deleted Successfully"
        });

    });

});

module.exports = router;