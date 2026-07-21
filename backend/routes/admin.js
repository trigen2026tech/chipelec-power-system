const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ADMIN PROFILE
// ======================

router.get("/profile", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            id,
            full_name,
            email,
            role,
            created_at
        FROM admins
        WHERE id = ?
    `;

    db.query(sql, [req.admin.id], (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.json({
            success: true,
            admin: results[0]
        });

    });

});

// ======================
// UPDATE ADMIN PROFILE
// ======================

router.put("/profile", authMiddleware, (req, res) => {

    const {
        full_name,
        email
    } = req.body;

    const sql = `
        UPDATE admins
        SET
            full_name = ?,
            email = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            full_name,
            email,
            req.admin.id
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update profile"
                });
            }

            res.json({
                success: true,
                message: "Profile Updated Successfully"
            });

        }
    );

});

module.exports = router;