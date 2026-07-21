const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL BRANDS
router.get("/", authMiddleware, (req, res) => {

    db.query(
        "SELECT * FROM brands ORDER BY id DESC",
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

// ADD BRAND
router.post("/", authMiddleware, (req, res) => {

    const { brand_name } = req.body;

    db.query(
        "INSERT INTO brands (brand_name) VALUES (?)",
        [brand_name],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add brand"
                });
            }

            res.json({
                success: true,
                message: "Brand Added Successfully",
                id: result.insertId
            });

        }
    );

});

// UPDATE BRAND
router.put("/:id", authMiddleware, (req, res) => {

    db.query(
        "UPDATE brands SET brand_name=? WHERE id=?",
        [req.body.brand_name, req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update brand"
                });
            }

            res.json({
                success: true,
                message: "Brand Updated Successfully"
            });

        }
    );

});

// DELETE BRAND
router.delete("/:id", authMiddleware, (req, res) => {

    db.query(
        "DELETE FROM brands WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete brand"
                });
            }

            res.json({
                success: true,
                message: "Brand Deleted Successfully"
            });

        }
    );

});

module.exports = router;