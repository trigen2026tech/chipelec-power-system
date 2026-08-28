const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ======================
// ADMIN LOGIN
// ======================

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql = `
        SELECT *
        FROM admins
        WHERE email = ?
    `;

    db.query(sql, [email], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email"
            });
        }

        const admin = results[0];

        // Plain text comparison for now
       const isMatch = bcrypt.compareSync(password, admin.password);

if (!isMatch) {
    return res.status(401).json({
        success: false,
        message: "Invalid Password"
    });
}
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login Successful",
            token,
            admin: {
                id: admin.id,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role
            }
        });

    });

});

const authMiddleware = require("../middleware/authMiddleware");

// ======================
// UPDATE PROFILE
// ======================

router.put("/profile/:id", authMiddleware, (req, res) => {

    const { id } = req.params;
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields"
        });
    }

    const sql = `
        UPDATE admins
        SET full_name = ?, email = ?
        WHERE id = ?
    `;

    db.query(sql, [username, email, id], (err) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Unable to update profile"
            });
        }

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    });

});

// ======================
// CHANGE PASSWORD
// ======================

router.put("/change-password/:id", authMiddleware, (req, res) => {

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields"
        });
    }

    // Get current admin
    const sql = "SELECT * FROM admins WHERE id = ?";

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        const admin = results[0];

        // Check if current password is correct
        const isMatch = bcrypt.compareSync(currentPassword, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update password
        const updateSql = "UPDATE admins SET password = ? WHERE id = ?";

        db.query(updateSql, [hashedPassword, id], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to change password"
                });
            }

            res.json({
                success: true,
                message: "Password changed successfully"
            });

        });

    });

});

module.exports = router;