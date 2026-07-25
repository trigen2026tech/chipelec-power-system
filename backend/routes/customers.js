const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ======================
// GET ALL CUSTOMERS
// ======================
router.get("/", (req, res) => {

    const sql = `
        SELECT *
        FROM customers
        ORDER BY id DESC
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
// ADD CUSTOMER
// ======================
router.post("/", (req, res) => {

    const {
        full_name,
        phone,
        email,
        address,
        city,
        state,
        pincode
    } = req.body;

    const sql = `
        INSERT INTO customers
        (full_name, phone, email, address, city, state, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [full_name, phone, email, address, city, state, pincode],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to add customer"
                });
            }

            res.json({
                success: true,
                message: "Customer Added Successfully",
                customerId: result.insertId
            });

        }
    );

});

// ======================
// GET SINGLE CUSTOMER
// ======================
router.get("/:id", (req, res) => {

    db.query(
        "SELECT * FROM customers WHERE id = ?",
        [req.params.id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            res.json({
                success: true,
                data: results[0]
            });

        }
    );

});

// ======================
// UPDATE CUSTOMER
// ======================
router.put("/:id", (req, res) => {

    const { id } = req.params;

    const {
        full_name,
        phone,
        email,
        address,
        city,
        state,
        pincode
    } = req.body;

    const sql = `
        UPDATE customers
        SET
            full_name = ?,
            phone = ?,
            email = ?,
            address = ?,
            city = ?,
            state = ?,
            pincode = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            full_name,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update customer"
                });
            }

            res.json({
                success: true,
                message: "Customer Updated Successfully"
            });

        }
    );

});
// ======================
// DELETE CUSTOMER
// ======================
router.delete("/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM customers WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Unable to delete customer"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });

    });

});

// Export the router LAST
module.exports = router;