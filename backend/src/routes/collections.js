const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const { milkmanId, from, to, shift } = req.query;
    const where = {};
    if (req.user.role !== "ADMIN") where.branchId = req.user.branchId;
    if (milkmanId) where.milkmanId = milkmanId;
    if (shift && ["MORNING", "EVENING"].includes(shift)) where.shift = shift;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const collections = await prisma.milkCollection.findMany({
      where,
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { shift: "asc" }],
    });
    return res.json({ collections });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { milkmanId, date, shift, quantity, fat, snf } = req.body;
    if (!milkmanId || !date || quantity == null) {
      return res.status(400).json({ error: "milkmanId, date, and quantity are required" });
    }
    if (shift && !["MORNING", "EVENING"].includes(shift)) {
      return res.status(400).json({ error: "shift must be MORNING or EVENING" });
    }

    const milkman = await prisma.milkman.findUnique({ where: { id: milkmanId } });
    if (!milkman) return res.status(404).json({ error: "Milkman not found" });
    if (req.user.role !== "ADMIN" && req.user.branchId !== milkman.branchId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const config = await prisma.pricingConfig.findFirst({ orderBy: { createdAt: "desc" } });
    let rate = 0;
    if (config?.mode === "FAT_SNF") {
      if (fat == null || snf == null) {
        return res.status(400).json({ error: "fat and snf are required for FAT_SNF pricing mode" });
      }
      rate = parseFloat(fat) * config.fatCoefficient + parseFloat(snf) * config.snfCoefficient;
    } else {
      rate = config?.flatRate ?? 0;
    }

    const collection = await prisma.milkCollection.create({
      data: {
        milkmanId,
        branchId: milkman.branchId,
        date: new Date(date),
        shift: shift ?? "MORNING",
        quantity: parseFloat(quantity),
        fat: fat != null ? parseFloat(fat) : null,
        snf: snf != null ? parseFloat(snf) : null,
        rate,
        totalAmount: parseFloat(quantity) * rate,
      },
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    return res.status(201).json({ collection });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
