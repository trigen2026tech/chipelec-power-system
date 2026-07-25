const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {

    try {

        const products = await new Promise((resolve, reject) => {
            db.query(
                "SELECT COUNT(*) AS total FROM products",
                (err, result) => err ? reject(err) : resolve(result)
            );
        });

        const brands = await new Promise((resolve, reject) => {
            db.query(
                "SELECT COUNT(*) AS total FROM brands",
                (err, result) => err ? reject(err) : resolve(result)
            );
        });

        const customers = await new Promise((resolve, reject) => {
            db.query(
                "SELECT COUNT(*) AS total FROM customers",
                (err, result) => err ? reject(err) : resolve(result)
            );
        });

        const installations = await new Promise((resolve, reject) => {
            db.query(
                "SELECT COUNT(*) AS total FROM installations",
                (err, result) => err ? reject(err) : resolve(result)
            );
        });

        res.json({
            success: true,
            data: {
                products: products[0].total,
                brands: brands[0].total,
                customers: customers[0].total,
                installations: installations[0].total
            }
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Database Error"
        });

    }

});

module.exports = router;