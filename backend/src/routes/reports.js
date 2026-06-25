const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/daily", requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const from = req.query.from || today;
    const to = req.query.to || from;
    const branchFilter = req.user.role !== "ADMIN" ? { branchId: req.user.branchId } : {};

    const [collections, payments] = await Promise.all([
      prisma.milkCollection.findMany({
        where: { ...branchFilter, date: { gte: new Date(from), lte: new Date(to) } },
        include: {
          milkman: { select: { id: true, name: true, code: true } },
          branch: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.payment.findMany({
        where: { ...branchFilter, paymentDate: { gte: new Date(from), lte: new Date(to) } },
        include: {
          milkman: { select: { id: true, name: true, code: true } },
          branch: { select: { name: true } },
        },
        orderBy: { paymentDate: "asc" },
      }),
    ]);

    const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
    const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    return res.json({ collections, payments, summary: { totalMilk, totalAmount, totalPaid, pending: totalAmount - totalPaid } });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branch", requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {};
    const paymentDateFilter = from && to ? { paymentDate: { gte: new Date(from), lte: new Date(to) } } : {};

    const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

    const report = await Promise.all(
      branches.map(async (branch) => {
        const [collections, payments, milkmenCount] = await Promise.all([
          prisma.milkCollection.findMany({ where: { branchId: branch.id, ...dateFilter } }),
          prisma.payment.findMany({ where: { branchId: branch.id, ...paymentDateFilter } }),
          prisma.milkman.count({ where: { branchId: branch.id } }),
        ]);
        const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
        const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        return { branch: { id: branch.id, name: branch.name, code: branch.code }, milkmenCount, totalMilk, totalAmount, totalPaid, pending: totalAmount - totalPaid };
      })
    );
    return res.json({ report });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/milkman/:id", requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = from && to ? { gte: new Date(from), lte: new Date(to) } : undefined;

    const milkman = await prisma.milkman.findUnique({
      where: { id: req.params.id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        collections: { where: dateFilter ? { date: dateFilter } : {}, orderBy: { date: "asc" } },
        payments: { where: dateFilter ? { paymentDate: dateFilter } : {}, orderBy: { paymentDate: "asc" } },
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

module.exports = router;
