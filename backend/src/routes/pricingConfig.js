const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const config = await prisma.pricingConfig.findFirst({
      orderBy: { createdAt: "desc" },
      include: { setBy: { select: { name: true } } },
    });
    return res.json({ config });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/", requireAdmin, async (req, res) => {
  try {
    const { mode, flatRate, fatCoefficient, snfCoefficient } = req.body;
    if (!mode || !["FLAT_RATE", "FAT_SNF"].includes(mode)) {
      return res.status(400).json({ error: "mode must be FLAT_RATE or FAT_SNF" });
    }
    if (mode === "FLAT_RATE" && (flatRate == null || flatRate <= 0)) {
      return res.status(400).json({ error: "flatRate is required for FLAT_RATE mode" });
    }
    if (mode === "FAT_SNF" && (fatCoefficient == null || snfCoefficient == null)) {
      return res.status(400).json({ error: "fatCoefficient and snfCoefficient are required for FAT_SNF mode" });
    }

    const config = await prisma.pricingConfig.create({
      data: {
        mode,
        flatRate: mode === "FLAT_RATE" ? parseFloat(flatRate) : null,
        fatCoefficient: mode === "FAT_SNF" ? parseFloat(fatCoefficient) : null,
        snfCoefficient: mode === "FAT_SNF" ? parseFloat(snfCoefficient) : null,
        setById: req.user.id,
      },
      include: { setBy: { select: { name: true } } },
    });
    return res.json({ config });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
