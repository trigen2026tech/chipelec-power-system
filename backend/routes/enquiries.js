const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET ALL ENQUIRIES
// ======================

router.get("/", authMiddleware, (req, res) => {

    db.query(
        "SELECT * FROM enquiries ORDER BY id DESC",
        (err, results) => {

            if (err) {
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

        }
    );

});

// ======================
// ADD ENQUIRY
// (Public API)
// ======================

router.post("/", (req, res) => {

    const {
        full_name,
        phone,
        email,
        subject,
        message
    } = req.body;

    const sql = `
        INSERT INTO enquiries
        (
            full_name,
            phone,
            email,
            subject,
            message
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            full_name,
            phone,
            email,
            subject,
            message
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to submit enquiry"
                });
            }

            res.json({
                success: true,
                message: "Enquiry Submitted Successfully",
                enquiryId: result.insertId
            });

        }
    );

});

// ======================
// UPDATE STATUS
// ======================

router.put("/:id", authMiddleware, (req, res) => {

    db.query(
        "UPDATE enquiries SET status=? WHERE id=?",
        [
            req.body.status,
            req.params.id
        ],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update enquiry"
                });
            }

            res.json({
                success: true,
                message: "Status Updated Successfully"
            });

        }
    );

});

// ======================
// DELETE ENQUIRY
// ======================

router.delete("/:id", authMiddleware, (req, res) => {

    db.query(
        "DELETE FROM enquiries WHERE id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete enquiry"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found"
                });
            }

            res.json({
                success: true,
                message: "Enquiry Deleted Successfully"
            });

        }
    );

});

module.exports = router;