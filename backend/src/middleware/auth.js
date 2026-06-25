const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dairy-farm-secret";
const TOKEN_COOKIE = "dairy_token";

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function requireAuth(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    next();
  });
}

function setTokenCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearTokenCookie(res) {
  res.cookie(TOKEN_COOKIE, "", { maxAge: 0, path: "/" });
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin, setTokenCookie, clearTokenCookie };
