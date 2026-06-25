const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { requireAdmin } = require("../middleware/auth");

router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, branchId: true,
        branch: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "USER", branchId: role === "ADMIN" ? null : branchId },
      select: {
        id: true, name: true, email: true, role: true, branchId: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    const data = { name, email, role, branchId: role === "ADMIN" ? null : branchId };
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
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

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
