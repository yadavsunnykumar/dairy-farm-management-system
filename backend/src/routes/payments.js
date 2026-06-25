const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const { milkmanId, from, to } = req.query;
    const where = {};
    if (req.user.role !== "ADMIN") where.branchId = req.user.branchId;
    if (milkmanId) where.milkmanId = milkmanId;
    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) where.paymentDate.lte = new Date(to);
    }
    const payments = await prisma.payment.findMany({
      where,
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: "desc" },
    });
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { milkmanId, amount, paymentDate, remarks } = req.body;
    if (!milkmanId || !amount || !paymentDate) {
      return res.status(400).json({ error: "milkmanId, amount, and paymentDate are required" });
    }

    const milkman = await prisma.milkman.findUnique({ where: { id: milkmanId } });
    if (!milkman) return res.status(404).json({ error: "Milkman not found" });
    if (req.user.role !== "ADMIN" && req.user.branchId !== milkman.branchId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payment = await prisma.payment.create({
      data: {
        milkmanId,
        branchId: milkman.branchId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        remarks,
      },
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    return res.status(201).json({ payment });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
