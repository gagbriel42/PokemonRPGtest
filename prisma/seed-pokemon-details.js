require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

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

  let updatedCount = 0;

  for (let i = 0; i < pokemonList.length; i++) {
    const pokemon = pokemonList[i];

    try {
      const [pokemonResponse, speciesResponse] =
        await Promise.all([
          axios.get(
            `https://pokeapi.co/api/v2/pokemon/${pokemon.pokedexNumber}`
          ),
          axios.get(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.pokedexNumber}`
          ),
        ]);

      const data = pokemonResponse.data;
      const species = speciesResponse.data;

      await prisma.pokemon.update({
        where: {
          id: pokemon.id,
        },
        data: {
          height: data.height
            ? data.height / 10
            : null,

          weight: data.weight
            ? data.weight / 10
            : null,

          baseExperience:
            data.base_experience ?? null,

          catchRate:
            species.capture_rate ?? null,

          genderRate:
            species.gender_rate ?? null,
        },
      });

      updatedCount++;

      console.log(
        `[${i + 1}/${pokemonList.length}] ${pokemon.name}`
      );
    } catch (error) {
      console.error(
        `Erreur pour ${pokemon.name}:`,
        error.message
      );
    }
  }

  console.log("");
  console.log("===== DÉTAILS POKÉMON =====");
  console.log(`Pokémon mis à jour : ${updatedCount}`);
  console.log("============================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
