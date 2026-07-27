const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const customerMiddleware = require("../middleware/customerMiddleware");

// ======================
// CUSTOMER REGISTER
// ======================

router.post("/register", (req, res) => {

    const {
        full_name,
        phone,
        email,
        password,
        address,
        city,
        state,
        pincode
    } = req.body;

    // Input validation
    if (!full_name || !phone || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide full name, phone, email, and password"
        });
    }

    // Check duplicate email
    const checkEmailSql = "SELECT id FROM customers WHERE email = ?";

    db.query(checkEmailSql, [email], (err, emailResults) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (emailResults.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check duplicate phone
        const checkPhoneSql = "SELECT id FROM customers WHERE phone = ?";

        db.query(checkPhoneSql, [phone], (err, phoneResults) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (phoneResults.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Phone number already registered"
                });
            }

            // Hash password
            const hashedPassword = bcrypt.hashSync(password, 10);

            const sql = `
                INSERT INTO customers
                (full_name, phone, email, password, address, city, state, pincode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [full_name, phone, email, hashedPassword, address || null, city || null, state || null, pincode || null],
                (err, result) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Unable to register customer"
                        });
                    }

                    // Send Welcome Email (non-blocking)
                    try {
                        const transporter = nodemailer.createTransport({
                            host: process.env.SMTP_HOST || "smtp.gmail.com",
                            port: process.env.SMTP_PORT || 587,
                            secure: false,
                            auth: {
                                user: process.env.SMTP_USER || "",
                                pass: process.env.SMTP_PASS || ""
                            }
                        });

                        const mailOptions = {
                            from: process.env.SMTP_USER || "noreply@chipelec.com",
                            to: email,
                            subject: "Welcome to CHIPELEC Power System",
                            html: `
                                <h2>Welcome, ${full_name}!</h2>
                                <p>Thank you for registering with CHIPELEC Power System.</p>
                                <p>You can now log in to your customer portal to book installations, raise service requests, and manage your account.</p>
                                <br>
                                <p>Regards,<br>CHIPELEC Power System Team</p>
                            `
                        };

                        transporter.sendMail(mailOptions, (emailErr) => {
                            if (emailErr) {
                                console.error("Welcome email failed:", emailErr.message);
                            } else {
                                console.log("Welcome email sent to:", email);
                            }
                        });

                    } catch (emailError) {
                        console.error("Email setup error:", emailError.message);
                    }

                    res.status(201).json({
                        success: true,
                        message: "Registration Successful",
                        customerId: result.insertId
                    });

                }
            );

        });

    });

});

// ======================
// CUSTOMER LOGIN
// ======================

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide email and password"
        });
    }

    const sql = "SELECT * FROM customers WHERE email = ?";

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
                message: "Customer not found with this email"
            });
        }

        const customer = results[0];

        if (!customer.password) {
            return res.status(401).json({
                success: false,
                message: "Account not set up for login. Please register first."
            });
        }

        const isMatch = bcrypt.compareSync(password, customer.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            {
                id: customer.id,
                email: customer.email,
                role: "customer"
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
            customer: {
                id: customer.id,
                full_name: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                state: customer.state,
                pincode: customer.pincode
            }
        });

    });

});

// ======================
// GET CUSTOMER PROFILE
// ======================

router.get("/profile", customerMiddleware, (req, res) => {

    const sql = "SELECT id, full_name, phone, email, address, city, state, pincode FROM customers WHERE id = ?";

    db.query(sql, [req.customer.id], (err, results) => {

        if (err) {
            console.error(err);
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

    });

});

module.exports = router;
