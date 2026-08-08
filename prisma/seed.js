require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

async function main() {
  console.log("========================================");
  console.log("   SEED POKEMON");
  console.log("========================================");

  // ----------------------------------------------------------
  // 1. Création des types
  // ----------------------------------------------------------

  console.log("");
  console.log("Création des types...");

  const typeMap = new Map();

  for (const name of TYPE_NAMES) {
    const type = await prisma.type.upsert({
      where: {
        name,
      },
      update: {},
      create: {
        name,
      },
    });

    typeMap.set(name, type.id);
  }

  console.log(`${typeMap.size} types disponibles.`);

  // ----------------------------------------------------------
  // 2. Récupération de la liste des Pokémon
  // ----------------------------------------------------------

  console.log("");
  console.log("Récupération de la liste des Pokémon...");

  const response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?limit=1025"
  );

  const pokemonList = response.data.results;

  console.log(`${pokemonList.length} Pokémon trouvés.`);

  // ----------------------------------------------------------
  // 3. Import des Pokémon
  // ----------------------------------------------------------

  console.log("");
  console.log("Import des Pokémon...");
  console.log("");

  for (let i = 0; i < pokemonList.length; i++) {
    const pokemonUrl = pokemonList[i].url;

    const { data } = await axios.get(pokemonUrl);

    // --------------------------------------------------------
    // Statistiques
    // --------------------------------------------------------

    const stats = Object.fromEntries(
      data.stats.map((stat) => [
        stat.stat.name,
        stat.base_stat,
      ])
    );

    // --------------------------------------------------------
    // Types
    // --------------------------------------------------------

    const types = data.types.sort(
      (a, b) => a.slot - b.slot
    );

    const type1 =
      types[0]?.type.name ?? "unknown";

    const type2 =
      types[1]?.type.name ?? null;

    // --------------------------------------------------------
    // Données Pokémon
    // --------------------------------------------------------

    const pokemon = {
      pokedexNumber: data.id,
      name: data.name,

      type1,
      type2,

      hp: stats.hp ?? 0,
      attack: stats.attack ?? 0,
      defense: stats.defense ?? 0,

      specialAttack:
        stats["special-attack"] ?? 0,

      specialDefense:
        stats["special-defense"] ?? 0,

      speed: stats.speed ?? 0,

      generation:
        Math.ceil(data.id / 100),
    };

    // --------------------------------------------------------
    // Création / mise à jour du Pokémon
    // --------------------------------------------------------

    const savedPokemon =
      await prisma.pokemon.upsert({
        where: {
          pokedexNumber:
            pokemon.pokedexNumber,
        },

        update: pokemon,

        create: pokemon,
      });

    // --------------------------------------------------------
    // Suppression des anciens liens de types
    // --------------------------------------------------------

    await prisma.pokemonType.deleteMany({
      where: {
        pokemonId: savedPokemon.id,
      },
    });

    // --------------------------------------------------------
    // Création des liens PokemonType
    // --------------------------------------------------------

    for (const typeData of types) {
      const typeName =
        typeData.type.name;

      const typeId =
        typeMap.get(typeName);

      if (!typeId) {
        console.warn(
          `Type inconnu : ${typeName}`
        );

        continue;
      }

      await prisma.pokemonType.create({
        data: {
          pokemonId:
            savedPokemon.id,

          typeId,

          slot:
            typeData.slot,
        },
      });
    }

    // --------------------------------------------------------
    // Progression
    // --------------------------------------------------------

    console.log(
      `[${i + 1}/${pokemonList.length}] ${pokemon.name}`
    );
  }

  console.log("");
  console.log("========================================");
  console.log("   IMPORT TERMINE");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ERREUR DURANT LE SEED :");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });