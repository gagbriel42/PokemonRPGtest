require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Chargement des Pokémon depuis la base...");

  // ==================================================
  // 1. CHARGER LES POKÉMON UNE SEULE FOIS
  // ==================================================

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

  const pokemonMap = new Map(
    pokemonList.map((pokemon) => [
      pokemon.pokedexNumber,
      pokemon.id,
    ])
  );

  // ==================================================
  // 2. CACHE DES GROUPES D'ŒUFS
  // ==================================================

  const eggGroupMap = new Map();

  let associationCount = 0;
  let eggGroupCount = 0;

  // ==================================================
  // 3. IMPORT
  // ==================================================

  for (let i = 0; i < pokemonList.length; i++) {
    const pokemon = pokemonList[i];

    try {
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemon.pokedexNumber}`
      );

      const data = response.data;

      const eggGroups = data.egg_groups ?? [];

      for (const entry of eggGroups) {
        const name = entry.name;

        // ----------------------------------------------
        // GROUPE D'ŒUF
        // ----------------------------------------------

        let eggGroupId = eggGroupMap.get(name);

        if (!eggGroupId) {
          const eggGroup = await prisma.eggGroup.upsert({
            where: {
              name,
            },
            update: {},
            create: {
              name,
            },
          });

          eggGroupId = eggGroup.id;

          eggGroupMap.set(name, eggGroupId);
          eggGroupCount++;
        }

        // ----------------------------------------------
        // ASSOCIATION
        // ----------------------------------------------

        await prisma.pokemonEggGroup.upsert({
          where: {
            pokemonId_eggGroupId: {
              pokemonId: pokemon.id,
              eggGroupId,
            },
          },
          update: {},
          create: {
            pokemonId: pokemon.id,
            eggGroupId,
          },
        });

        associationCount++;
      }

      console.log(
        `[${i + 1}/${pokemonList.length}] ${pokemon.name} — ${eggGroups
          .map((group) => group.name)
          .join(", ")}`
      );
    } catch (error) {
      console.error(
        `Erreur pour ${pokemon.name}:`,
        error.message
      );
    }
  }

  console.log("");
  console.log("===== IMPORT GROUPES D'ŒUFS =====");
  console.log(`Groupes : ${eggGroupCount}`);
  console.log(`Associations : ${associationCount}`);
  console.log("================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
