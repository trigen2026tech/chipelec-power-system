const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ALL SERVICES
// ======================

router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            s.*,
            c.full_name,
            c.phone
        FROM services s
        JOIN customers c
        ON s.customer_id = c.id
        ORDER BY s.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
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
// ADD SERVICE REQUEST
// ======================

router.post("/", authMiddleware, (req, res) => {

    const {
        customer_id,
        service_type,
        product_name,
        complaint,
        service_status,
        service_date
    } = req.body;

    const sql = `
        INSERT INTO services
        (
            customer_id,
            service_type,
            product_name,
            complaint,
            service_status,
            service_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            service_type,
            product_name,
            complaint,
            service_status,
            service_date
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to create service request"
                });
            }

            res.json({
                success: true,
                message: "Service Request Created",
                serviceId: result.insertId
            });

        }
    );

});

// ======================
// UPDATE SERVICE
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        service_type,
        product_name,
        complaint,
        service_status,
        service_date
    } = req.body;

    const sql = `
        UPDATE services
        SET
            service_type=?,
            product_name=?,
            complaint=?,
            service_status=?,
            service_date=?
        WHERE id=?
    `;

    db.query(
        sql,
        [
            service_type,
            product_name,
            complaint,
            service_status,
            service_date,
            id
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update service"
                });
            }

            res.json({
                success: true,
                message: "Service Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE SERVICE
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    db.query(
        "DELETE FROM services WHERE id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete service"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }

            res.json({
                success: true,
                message: "Service Deleted Successfully"
            });

        }
    );

});

module.exports = router;