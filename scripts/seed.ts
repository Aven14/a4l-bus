import { prisma } from "../src/lib/prisma";
import { TRANSPORT_LINES } from "../src/lib/transport-data";

async function seed() {
  console.log("🌱 Seeding database...");

  // Créer les lignes de transport
  for (const line of TRANSPORT_LINES) {
    const dbLine = await prisma.transportLine.upsert({
      where: { number: line.number },
      update: { name: line.name, color: line.color },
      create: { number: line.number, name: line.name, color: line.color },
    });

    console.log(`✓ Ligne ${line.number}: ${line.name}`);

    for (let i = 0; i < line.stops.length; i++) {
      const stop = line.stops[i];
      await prisma.stop.upsert({
        where: {
          lineId_slug: { lineId: dbLine.id, slug: stop.slug },
        },
        update: {
          name: stop.name,
          audioUrl: stop.audioPath,
          order: i,
        },
        create: {
          lineId: dbLine.id,
          name: stop.name,
          slug: stop.slug,
          audioUrl: stop.audioPath,
          order: i,
        },
      });
    }

    console.log(`  ✓ ${line.stops.length} arrêts créés`);
  }

  // Créer un état radio par défaut
  await prisma.radioState.upsert({
    where: { id: "default-radio-state" },
    update: {},
    create: {
      id: "default-radio-state",
      trackIndex: 0,
      position: 0,
      isPlaying: false,
    },
  });

  console.log("\n✅ Database seeded successfully!");
  console.log(`📊 ${TRANSPORT_LINES.length} lignes créées`);
  console.log(`🎵 Radio state initialisé`);
  
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
