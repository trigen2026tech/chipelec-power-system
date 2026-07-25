const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// =====================
// GET ALL SERVICE REQUESTS
// =====================
router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            sr.*,
            c.full_name AS customer_name
        FROM service_requests sr
        JOIN customers c
            ON sr.customer_id = c.id
        ORDER BY sr.id DESC
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

// =====================
// ADD SERVICE REQUEST
// =====================
router.post("/", authMiddleware, (req, res) => {

    const {
        customer_id,
        request_type,
        request_date,
        issue_description,
        service_status,
        technician_name,
        service_charge,
        completed_date
    } = req.body;

    const sql = `
        INSERT INTO service_requests
        (
            customer_id,
            request_type,
            request_date,
            issue_description,
            service_status,
            technician_name,
            service_charge,
            completed_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            request_type,
            request_date,
            issue_description,
            service_status,
            technician_name,
            service_charge,
            completed_date || null
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to save service request"
                });
            }

            res.json({
                success: true,
                message: "Service Request Added Successfully",
                id: result.insertId
            });

        }
    );

});

// =====================
// GET SINGLE SERVICE REQUEST
// =====================
router.get("/:id", authMiddleware, (req, res) => {

    const sql = `
        SELECT *
        FROM service_requests
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
                message: "Service Request Not Found"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });

    });

});

// =====================
// UPDATE SERVICE REQUEST
// =====================
router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        customer_id,
        request_type,
        request_date,
        issue_description,
        service_status,
        technician_name,
        service_charge,
        completed_date
    } = req.body;

    const sql = `
        UPDATE service_requests
        SET
            customer_id = ?,
            request_type = ?,
            request_date = ?,
            issue_description = ?,
            service_status = ?,
            technician_name = ?,
            service_charge = ?,
            completed_date = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            customer_id,
            request_type,
            request_date,
            issue_description,
            service_status,
            technician_name,
            service_charge,
            completed_date || null,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update service request"
                });
            }

            res.json({
                success: true,
                message: "Service Request Updated Successfully"
            });

        }
    );

});

// =====================
// DELETE SERVICE REQUEST
// =====================
router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM service_requests WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Unable to delete service request"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Service Request not found"
            });
        }

        res.json({
            success: true,
            message: "Service Request Deleted Successfully"
        });

    });

});

module.exports = router;