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

// ======================
// UPDATE CUSTOMER PROFILE
// ======================
router.put("/profile", customerMiddleware, (req, res) => {
    const { full_name, phone, address, city, state, pincode } = req.body;
    const sql = `
        UPDATE customers
        SET full_name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?
        WHERE id = ?
    `;
    db.query(sql, [full_name, phone, address, city, state, pincode, req.customer.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database Error" });
        }
        res.json({ success: true, message: "Profile updated successfully" });
    });
});

// ======================
// CHANGE PASSWORD
// ======================
router.put("/change-password", customerMiddleware, (req, res) => {
    const { current_password, new_password } = req.body;
    
    db.query("SELECT password FROM customers WHERE id = ?", [req.customer.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        if (results.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

        const isMatch = bcrypt.compareSync(current_password, results[0].password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect current password" });

        const hashed = bcrypt.hashSync(new_password, 10);
        db.query("UPDATE customers SET password = ? WHERE id = ?", [hashed, req.customer.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: "Database Error" });
            res.json({ success: true, message: "Password updated successfully" });
        });
    });
});

// ======================
// GET INSTALLATIONS
// ======================
router.get("/installations", customerMiddleware, (req, res) => {
    const sql = `
        SELECT i.*, p.product_name 
        FROM installations i 
        JOIN products p ON i.product_id = p.id 
        WHERE i.customer_id = ? 
        ORDER BY i.id DESC
    `;
    db.query(sql, [req.customer.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, data: results });
    });
});

// ======================
// CREATE INSTALLATION
// ======================
router.post("/installations", customerMiddleware, (req, res) => {
    const { product_id, installation_date, installation_address, remarks, preferred_time } = req.body;
    const fullRemarks = preferred_time ? `Preferred Time: ${preferred_time} | ${remarks || ''}` : remarks;
    const sql = `INSERT INTO installations (customer_id, product_id, installation_date, installation_address, installation_status, remarks) VALUES (?, ?, ?, ?, 'Pending', ?)`;
    
    db.query(sql, [req.customer.id, product_id, installation_date, installation_address, fullRemarks], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, message: "Installation request submitted successfully", id: result.insertId });
    });
});

// ======================
// GET SERVICE REQUESTS
// ======================
router.get("/service-requests", customerMiddleware, (req, res) => {
    const sql = `SELECT * FROM service_requests WHERE customer_id = ? ORDER BY id DESC`;
    db.query(sql, [req.customer.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, data: results });
    });
});

// ======================
// CREATE SERVICE REQUEST
// ======================
router.post("/service-requests", customerMiddleware, (req, res) => {
    const { request_type, request_date, issue_description, preferred_time, product_name } = req.body;
    const fullDesc = `Product: ${product_name || 'N/A'} | Time: ${preferred_time || 'N/A'} | ${issue_description || ''}`;
    
    const sql = `INSERT INTO service_requests (customer_id, request_type, request_date, issue_description, service_status) VALUES (?, ?, ?, ?, 'Pending')`;
    
    db.query(sql, [req.customer.id, request_type, request_date, fullDesc], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, message: "Service request submitted successfully", id: result.insertId });
    });
});

// ======================
// GET QUOTATIONS
// ======================
router.get("/quotations", customerMiddleware, (req, res) => {
    db.query("SELECT * FROM quotations WHERE customer_id = ? ORDER BY id DESC", [req.customer.id], (err, results) => {
        if (err) {
            // Ignore error if table doesn't exist yet, return empty
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// ======================
// GET DASHBOARD STATS
// ======================
router.get("/dashboard-stats", customerMiddleware, (req, res) => {
    const customerId = req.customer.id;
    let stats = { myProducts: 0, activeInstallations: 0, openComplaints: 0, recentActivity: [] };
    
    db.query("SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?", [customerId], (err, results) => {
        if (!err && results && results.length > 0) stats.myProducts = results[0].count;
        
        db.query("SELECT COUNT(*) AS count FROM installations WHERE customer_id = ? AND installation_status NOT IN ('Completed', 'Cancelled')", [customerId], (err, results) => {
            if (!err && results && results.length > 0) stats.activeInstallations = results[0].count;
            
            db.query("SELECT COUNT(*) AS count FROM service_requests WHERE customer_id = ? AND service_status NOT IN ('Resolved', 'Cancelled')", [customerId], (err, results) => {
                if (!err && results && results.length > 0) stats.openComplaints = results[0].count;
                
                const fallbackSql = `
                    (SELECT id, 'Installation' as type, installation_date as date, installation_status as status FROM installations WHERE customer_id = ?)
                    UNION ALL
                    (SELECT id, 'Service Request' as type, request_date as date, service_status as status FROM service_requests WHERE customer_id = ?)
                    ORDER BY date DESC LIMIT 5
                `;
                db.query(fallbackSql, [customerId, customerId], (err, results) => {
                    if (!err && results) stats.recentActivity = results;
                    res.json({ success: true, data: stats });
                });
            });
        });
    });
});

module.exports = router;
