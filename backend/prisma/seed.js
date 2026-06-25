const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dairy.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@dairy.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  // Create sample branches
  const patna = await prisma.branch.upsert({
    where: { code: "PAT" },
    update: {},
    create: { name: "Patna Branch", code: "PAT", address: "Patna, Bihar", status: "ACTIVE" },
  });

  const gaya = await prisma.branch.upsert({
    where: { code: "GAY" },
    update: {},
    create: { name: "Gaya Branch", code: "GAY", address: "Gaya, Bihar", status: "ACTIVE" },
  });

  console.log("Branches created:", patna.name, gaya.name);

  // Create branch users
  const userPassword = await bcrypt.hash("user123", 10);
  const branchUser = await prisma.user.upsert({
    where: { email: "patna@dairy.com" },
    update: {},
    create: {
      name: "Patna Manager",
      email: "patna@dairy.com",
      password: userPassword,
      role: "USER",
      branchId: patna.id,
    },
  });
  console.log("Branch user created:", branchUser.email);

  // Set initial pricing config (flat rate)
  const configCount = await prisma.pricingConfig.count();
  if (configCount === 0) {
    await prisma.pricingConfig.create({
      data: { mode: "FLAT_RATE", flatRate: 60.0, setById: admin.id },
    });
    console.log("Initial pricing config set: FLAT_RATE ₹60/L");
  }

  // Sample milkmen
  const milkmanCount = await prisma.milkman.count({ where: { branchId: patna.id } });
  if (milkmanCount === 0) {
    await prisma.milkman.createMany({
      data: [
        { name: "Ram Kumar", code: "PAT-001", mobile: "9876543210", village: "Phulwari", branchId: patna.id },
        { name: "Shyam Singh", code: "PAT-002", mobile: "9876543211", village: "Danapur", branchId: patna.id },
        { name: "Lakhan Yadav", code: "GAY-001", mobile: "9876543212", village: "Bodh Gaya", branchId: gaya.id },
      ],
    });
    console.log("Sample milkmen created");
  }

  console.log("\nSeed complete!");
  console.log("---");
  console.log("Admin login:       admin@dairy.com / admin123");
  console.log("Branch user login: patna@dairy.com / user123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
