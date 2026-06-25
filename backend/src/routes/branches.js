const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
    return res.json({ branches });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, code, address, status } = req.body;
    if (!name || !code) return res.status(400).json({ error: "Name and code are required" });

    const branch = await prisma.branch.create({
      data: { name, code: code.toUpperCase(), address, status: status || "ACTIVE" },
    });
    return res.status(201).json({ branch });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { name, code, address, status } = req.body;
    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: { name, code: code?.toUpperCase(), address, status },
    });
    return res.json({ branch });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
