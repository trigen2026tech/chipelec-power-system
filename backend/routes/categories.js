const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL CATEGORIES
router.get("/", authMiddleware, (req, res) => {

    db.query(
        "SELECT * FROM categories ORDER BY category_name",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.json({
                success: true,
                data: results
            });

        }
    );

});

module.exports = router;