const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Access Denied. Not a customer token."
            });
        }

        req.customer = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token"
        });

    }

};
