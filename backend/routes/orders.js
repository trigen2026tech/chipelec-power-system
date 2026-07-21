const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ALL ORDERS
// ======================

router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            o.id,
            c.full_name AS customer_name,
            c.phone,
            o.total_amount,
            o.payment_status,
            o.order_status,
            o.created_at
        FROM orders o
        JOIN customers c
            ON o.customer_id = c.id
        ORDER BY o.id DESC
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
// ADD ORDER
// ======================

router.post("/", authMiddleware, (req, res) => {

    const {
        customer_id,
        total_amount,
        payment_status,
        order_status
    } = req.body;

    const sql = `
        INSERT INTO orders
        (
            customer_id,
            total_amount,
            payment_status,
            order_status
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            total_amount,
            payment_status,
            order_status
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to create order"
                });
            }

            res.json({
                success: true,
                message: "Order Created Successfully",
                orderId: result.insertId
            });

        }
    );

});

// ======================
// UPDATE ORDER
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const {
        customer_id,
        total_amount,
        payment_status,
        order_status
    } = req.body;

    const sql = `
        UPDATE orders
        SET
            customer_id = ?,
            total_amount = ?,
            payment_status = ?,
            order_status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            customer_id,
            total_amount,
            payment_status,
            order_status,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to update order"
                });
            }

            res.json({
                success: true,
                message: "Order Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE ORDER
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM orders WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to delete order"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            res.json({
                success: true,
                message: "Order Deleted Successfully"
            });

        }
    );

});

module.exports = router;