/**
 * Contourne les erreurs de certificat SSL Windows lors du téléchargement
 * des moteurs Prisma (binaries.prisma.sh).
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { execSync } = require("child_process");
const path = require("path");

const prismaBin =
  process.platform === "win32"
    ? path.join(__dirname, "..", "node_modules", ".bin", "prisma.cmd")
    : path.join(__dirname, "..", "node_modules", ".bin", "prisma");

execSync(`"${prismaBin}" generate`, {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
  env: process.env,
  shell: true,
});
