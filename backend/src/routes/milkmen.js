const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const { search = "", branchId } = req.query;
    const where = {};
    if (req.user.role !== "ADMIN") where.branchId = req.user.branchId;
    else if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
      ];
    }
    const milkmen = await prisma.milkman.findMany({
      where,
      include: { branch: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ milkmen });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, mobile, village, address, branchId } = req.body;
    if (!name || !branchId) return res.status(400).json({ error: "Name and branch are required" });

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    if (req.user.role !== "ADMIN" && req.user.branchId !== branchId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const existingCount = await prisma.milkman.count({ where: { code: { startsWith: branch.code + "-" } } });
    const code = `${branch.code}-${String(existingCount + 1).padStart(3, "0")}`;

    const milkman = await prisma.milkman.create({
      data: { name, mobile, village, address, branchId, code },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
    return res.status(201).json({ milkman });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const milkman = await prisma.milkman.findUnique({
      where: { id: req.params.id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        collections: { orderBy: { date: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });
    if (!milkman) return res.status(404).json({ error: "Not found" });

    const totalMilk = milkman.collections.reduce((s, c) => s + c.quantity, 0);
    const totalEarned = milkman.collections.reduce((s, c) => s + c.totalAmount, 0);
    const totalPaid = milkman.payments.reduce((s, p) => s + p.amount, 0);
    return res.json({ milkman, ledger: { totalMilk, totalEarned, totalPaid, pending: totalEarned - totalPaid } });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const milkman = await prisma.milkman.findUnique({ where: { id: req.params.id } });
    if (!milkman) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "ADMIN" && req.user.branchId !== milkman.branchId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { name, mobile, village, address } = req.body;
    const updated = await prisma.milkman.update({
      where: { id: req.params.id },
      data: { name, mobile, village, address },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
    return res.json({ milkman: updated });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
