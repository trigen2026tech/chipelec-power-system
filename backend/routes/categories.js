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

// ADD CATEGORY
router.post("/", authMiddleware, (req, res) => {

    const { category_name } = req.body;

    db.query(
        "INSERT INTO categories (category_name) VALUES (?)",
        [category_name],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add category"
                });
            }

            res.json({
                success: true,
                message: "Category Added Successfully",
                id: result.insertId
            });

        }
    );

});

// GET SINGLE CATEGORY
router.get("/:id", authMiddleware, (req, res) => {

    db.query(
        "SELECT * FROM categories WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            res.json({
                success: true,
                data: result[0]
            });

        }
    );

});

// UPDATE CATEGORY
router.put("/:id", authMiddleware, (req, res) => {

    const { category_name } = req.body;

    db.query(
        "UPDATE categories SET category_name = ? WHERE id = ?",
        [category_name, req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update category"
                });
            }

            res.json({
                success: true,
                message: "Category Updated Successfully"
            });

        }
    );

});

// DELETE CATEGORY
router.delete("/:id", authMiddleware, (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM categories WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to delete category"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category Deleted Successfully"
        });

    });

});

module.exports = router;