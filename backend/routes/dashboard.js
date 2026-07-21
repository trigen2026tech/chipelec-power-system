const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// DASHBOARD STATISTICS
// ======================

router.get("/", authMiddleware, (req, res) => {

    const dashboard = {};

    db.query("SELECT COUNT(*) AS totalProducts FROM products", (err, products) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        dashboard.totalProducts = products[0].totalProducts;

        db.query("SELECT COUNT(*) AS totalCustomers FROM customers", (err, customers) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            dashboard.totalCustomers = customers[0].totalCustomers;

            db.query(
                "SELECT COUNT(*) AS availableProducts FROM products WHERE status='Available'",
                (err, available) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });
                    }

                    dashboard.availableProducts = available[0].availableProducts;

                    db.query(
                        "SELECT COUNT(*) AS outOfStock FROM products WHERE stock_quantity = 0",
                        (err, stock) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Database Error"
                                });
                            }

                            dashboard.outOfStock = stock[0].outOfStock;

                            res.json({
                                success: true,
                                data: dashboard
                            });

                        }
                    );

                }
            );

        });

    });

});

module.exports = router;