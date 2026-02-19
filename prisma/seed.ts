import "dotenv/config";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Users already exist, skipping seed.");
    return;
  }
  const hash = await bcrypt.hash("changeme123", 10);
  await prisma.user.create({
    data: {
      email: "admin@lumenalta.com",
      passwordHash: hash,
      name: "Default Admin",
      role: "Admin",
      coachName: null,
    },
  });
  console.log("Seeded default admin: admin@lumenalta.com / changeme123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
