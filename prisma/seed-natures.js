require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const natures = [
  ["hardy", null, null],
  ["bold", "defense", "attack"],
  ["modest", "special-attack", "attack"],
  ["calm", "special-defense", "attack"],
  ["timid", "speed", "attack"],

  ["lonely", "attack", "defense"],
  ["docile", null, null],
  ["mild", "special-attack", "defense"],
  ["gentle", "special-defense", "defense"],
  ["hasty", "speed", "defense"],

  ["adamant", "attack", "special-attack"],
  ["impish", "defense", "special-attack"],
  ["bashful", null, null],
  ["careful", "special-defense", "special-attack"],
  ["jolly", "speed", "special-attack"],

  ["naughty", "attack", "special-defense"],
  ["lax", "defense", "special-defense"],
  ["rash", "special-attack", "special-defense"],
  ["quirky", null, null],
  ["naive", "speed", "special-defense"],
];

async function main() {
  console.log("Import des natures...");

  let count = 0;

  for (const [name, increasedStat, decreasedStat] of natures) {
    await prisma.nature.upsert({
      where: {
        name,
      },
      update: {
        increasedStat,
        decreasedStat,
      },
      create: {
        name,
        increasedStat,
        decreasedStat,
      },
    });

    count++;
  }

  console.log("");
  console.log("===== IMPORT NATURES =====");
  console.log(`Natures : ${count}`);
  console.log("==========================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
