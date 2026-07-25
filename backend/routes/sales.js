const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL SALES
router.get("/", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            s.*,
            c.full_name AS customer_name,
            p.product_name
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        JOIN products p ON s.product_id = p.id
        ORDER BY s.id DESC
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

// ADD SALE
router.post("/", authMiddleware, (req, res) => {

    const {
        customer_id,
        product_id,
        quantity,
        unit_price,
        total_amount,
        sale_date,
        payment_status
    } = req.body;

    const sql = `
        INSERT INTO sales
        (
            customer_id,
            product_id,
            quantity,
            unit_price,
            total_amount,
            sale_date,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id,
            product_id,
            quantity,
            unit_price,
            total_amount,
            sale_date,
            payment_status
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to add sale"
                });
            }

            res.json({
                success: true,
                message: "Sale Added Successfully",
                id: result.insertId
            });

        }
    );

});

// UPDATE SALE
router.put("/:id", authMiddleware, (req, res) => {
    const {
        customer_id,
        product_id,
        quantity,
        unit_price,
        total_amount,
        sale_date,
        payment_status
    } = req.body;

    const sql = `
        UPDATE sales
        SET customer_id=?, product_id=?, quantity=?, unit_price=?,
            total_amount=?, sale_date=?, payment_status=?
        WHERE id=?
    `;

    db.query(sql, [
        customer_id,
        product_id,
        quantity,
        unit_price,
        total_amount,
        sale_date,
        payment_status,
        req.params.id
    ], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success:false, message:"Unable to update sale" });
        }
        res.json({ success:true, message:"Sale Updated Successfully" });
    });
});

// DELETE SALE
router.delete("/:id", authMiddleware, (req, res) => {
    db.query("DELETE FROM sales WHERE id=?", [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success:false, message:"Unable to delete sale" });
        }
        res.json({ success:true, message:"Sale Deleted Successfully" });
    });
});

module.exports = router;