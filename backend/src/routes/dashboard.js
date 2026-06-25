const router = require("express").Router();
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require("date-fns");

router.get("/", requireAuth, async (req, res) => {
  try {
    const { filter = "today" } = req.query;
    const now = new Date();
    let dateFrom, dateTo;

    if (filter === "today") {
      dateFrom = startOfDay(now); dateTo = endOfDay(now);
    } else if (filter === "week") {
      dateFrom = startOfWeek(now, { weekStartsOn: 1 }); dateTo = endOfWeek(now, { weekStartsOn: 1 });
    } else if (filter === "month") {
      dateFrom = startOfMonth(now); dateTo = endOfMonth(now);
    } else {
      dateFrom = startOfDay(now); dateTo = endOfDay(now);
    }

    const branchFilter = req.user.role !== "ADMIN" ? { branchId: req.user.branchId } : {};

    const [collections, payments, milkmen, collectionTotals, paymentTotals] = await Promise.all([
      prisma.milkCollection.findMany({ where: { ...branchFilter, date: { gte: dateFrom, lte: dateTo } } }),
      prisma.payment.findMany({ where: { ...branchFilter, paymentDate: { gte: dateFrom, lte: dateTo } } }),
      prisma.milkman.findMany({
        where: branchFilter,
        include: { branch: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.milkCollection.groupBy({ by: ["milkmanId"], where: branchFilter, _sum: { quantity: true, totalAmount: true } }),
      prisma.payment.groupBy({ by: ["milkmanId"], where: branchFilter, _sum: { amount: true } }),
    ]);

    const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
    const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    const collMap = Object.fromEntries(collectionTotals.map((r) => [r.milkmanId, r._sum]));
    const payMap = Object.fromEntries(paymentTotals.map((r) => [r.milkmanId, r._sum]));

    const milkmanLedger = milkmen.map((m) => {
      const totalEarned = collMap[m.id]?.totalAmount ?? 0;
      const totalLitres = collMap[m.id]?.quantity ?? 0;
      const totalPaidOut = payMap[m.id]?.amount ?? 0;
      const balance = totalEarned - totalPaidOut;
      return { id: m.id, name: m.name, code: m.code, branch: m.branch?.name ?? "", totalLitres, totalEarned, totalPaidOut, balance, settled: balance <= 0 };
    }).sort((a, b) => b.balance - a.balance);

    return res.json({
      stats: { totalMilk, totalAmount, totalPaid, pending: totalAmount - totalPaid, milkmenCount: milkmen.length },
      milkmanLedger,
      filter,
      dateFrom,
      dateTo,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
