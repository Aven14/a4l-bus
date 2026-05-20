import { prisma } from "../src/lib/prisma";

async function checkDB() {
  console.log("🔍 Vérification de la DB...\n");

  // Vérifier les lignes
  const lines = await prisma.transportLine.count();
  console.log(`📊 Lignes de transport: ${lines}`);

  // Vérifier les arrêts
  const stops = await prisma.stop.count();
  console.log(`🛑 Arrêts: ${stops}`);

  // Vérifier RadioState
  const radioState = await prisma.radioState.findFirst();
  console.log(`🎵 RadioState: ${radioState ? "✅ Existe" : "❌ N'existe pas"}`);
  if (radioState) {
    console.log(`   - trackIndex: ${radioState.trackIndex}`);
    console.log(`   - position: ${radioState.position}`);
    console.log(`   - isPlaying: ${radioState.isPlaying}`);
  }

  // Vérifier les utilisateurs
  const users = await prisma.user.count();
  console.log(`👤 Utilisateurs: ${users}`);

  // Vérifier les tickets
  const tickets = await prisma.ticket.count();
  console.log(`🎫 Tickets: ${tickets}`);

  await prisma.$disconnect();
}

checkDB();
