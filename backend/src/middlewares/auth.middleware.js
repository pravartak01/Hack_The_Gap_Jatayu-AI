const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken = req.cookies ? req.cookies.authToken : null;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email role");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", error: error.message });
  }
}

function allowRoles(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const normalizedUserRole = String(req.user.role || "")
      .trim()
      .toUpperCase();
    const normalizedAllowedRoles = roles.map((role) => String(role || "").trim().toUpperCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        message: "Forbidden: insufficient role",
        currentRole: normalizedUserRole,
        expectedRoles: normalizedAllowedRoles,
      });
    }

    return next();
  };
}

module.exports = { requireAuth, allowRoles };
