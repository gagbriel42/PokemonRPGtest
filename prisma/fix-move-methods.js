require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mapLearnMethod(value) {
  switch (value) {
    case "level-up":
      return "LEVEL";
    case "machine":
      return "MACHINE";
    case "egg":
      return "EGG";
    case "tutor":
      return "TUTOR";
    case "stadium-surfing-pikachu":
      return "OTHER";
    case "light-ball-egg":
      return "EGG";
    case "colosseum-purification":
      return "OTHER";
    case "xd-shadow":
      return "OTHER";
    case "xd-purification":
      return "OTHER";
    default:
      return "OTHER";
  }
}

async function main() {
  console.log("Chargement des Pokémon...");

  const pokemonList = await prisma.pokemon.findMany({
    select: {
      id: true,
      pokedexNumber: true,
      name: true,
    },
    orderBy: {
      pokedexNumber: "asc",
    },
  });

  console.log(`${pokemonList.length} Pokémon chargés.`);

  console.log("Chargement des attaques...");

  const moveList = await prisma.move.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const moveMap = new Map(
    moveList.map((move) => [move.name, move.id])
  );

  console.log(`${moveList.length} attaques chargées.`);

  console.log("");
  console.log("Suppression des anciennes associations...");

  await prisma.pokemonMove.deleteMany();

  console.log("Anciennes associations supprimées.");
  console.log("");

  let associationCount = 0;

  for (let i = 0; i < pokemonList.length; i++) {
    const pokemon = pokemonList[i];

    try {
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon.pokedexNumber}`
      );

      const moves = response.data.moves;
      const associations = new Map();

      for (const moveEntry of moves) {
        const moveName = moveEntry.move.name;
        const moveId = moveMap.get(moveName);

        if (!moveId) {
          continue;
        }

        for (const detail of moveEntry.version_group_details) {
          const learnMethod = mapLearnMethod(
            detail.move_learn_method?.name
          );

          const level = detail.level_learned_at || null;

          const key = `${moveId}-${learnMethod}`;

          if (!associations.has(key)) {
            associations.set(key, {
              pokemonId: pokemon.id,
              moveId,
              learnMethod,
              level,
              generation: null,
            });
          } else {
            const existing = associations.get(key);

            if (
              level &&
              (!existing.level || level < existing.level)
            ) {
              existing.level = level;
            }
          }
        }
      }

      const rows = Array.from(associations.values());

      if (rows.length > 0) {
        await prisma.pokemonMove.createMany({
          data: rows,
          skipDuplicates: true,
        });

        associationCount += rows.length;
      }

      console.log(
        `[${i + 1}/${pokemonList.length}] ${pokemon.name} — ${rows.length} associations`
      );

      // Petite pause pour éviter de marteler PokéAPI
      if ((i + 1) % 20 === 0) {
        await sleep(250);
      }
    } catch (error) {
      console.error(
        `Erreur pour ${pokemon.name}:`,
        error.message
      );
    }
  }

  console.log("");
  console.log("===== CORRECTION TERMINÉE =====");
  console.log(`Associations : ${associationCount}`);
  console.log("===============================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
