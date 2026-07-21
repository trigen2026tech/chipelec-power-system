const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];

    console.log("Received Token:", token);

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded Token:", decoded);

        req.admin = decoded;

        next();

    } catch (err) {

        console.log("JWT Verify Error:", err.name);
        console.log("JWT Verify Message:", err.message);

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }

};