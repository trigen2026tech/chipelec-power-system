const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("JWT verification successful. Admin ID:", decoded.id);

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