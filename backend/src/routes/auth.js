const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken, setTokenCookie, clearTokenCookie, requireAuth } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, branchId: user.branchId, name: user.name });
    setTokenCookie(res, token);

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branchId: user.branchId, branch: user.branch },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  return res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, branchId: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
