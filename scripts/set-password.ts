// scripts/set-password.ts
/**
 * Set a user's password from the CLI.
 * Usage:
 *   npx tsx scripts/set-password.ts <email> <password>
 *
 * Notes:
 * - Intentionally import from TypeScript sources without ".js" extensions.
 * - Works with moduleResolution "Bundler" and tsx runner.
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";

async function main() {
  const [, , email, pwd] = process.argv;
  if (!email || !pwd) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <password>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  const h = await hashPassword(pwd);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: h, mustChangePassword: false },
  });

  console.log(`✅ Password set for ${email}`);
}

main().finally(() => prisma.$disconnect());
