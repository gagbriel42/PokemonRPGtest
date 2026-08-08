require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Récupération des types Pokémon...");

  const response = await axios.get(
    "https://pokeapi.co/api/v2/type?limit=100"
  );

  const apiTypes = response.data.results;

  const typeData = [];

  for (const type of apiTypes) {
    const { data } = await axios.get(type.url);

    // On garde uniquement les 18 types classiques.
    if (data.id > 18) continue;

    const generation = data.generation
      ? Number(data.generation.url.split("/").filter(Boolean).pop())
      : null;

    typeData.push({
      name: data.name,
      generation,
    });
  }

  console.log(`${typeData.length} types classiques trouvés.`);

  // Création / mise à jour des types
  for (const type of typeData) {
    await prisma.type.upsert({
      where: {
        name: type.name,
      },
      update: {
        generation: type.generation,
      },
      create: type,
    });
  }

  console.log("Types enregistrés.");

  // Récupération de tous les Pokémon avec leurs types actuels
  const pokemon = await prisma.pokemon.findMany({
    select: {
      id: true,
      name: true,
      type1: true,
      type2: true,
    },
  });

  console.log(`${pokemon.length} Pokémon trouvés.`);

  // Récupération des IDs des types en une seule opération
  const types = await prisma.type.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const typeMap = new Map(
    types.map((type) => [type.name, type.id])
  );

  // Préparation de toutes les associations
  const associations = [];

  for (const p of pokemon) {
    const names = [p.type1, p.type2].filter(Boolean);

    for (let i = 0; i < names.length; i++) {
      const typeId = typeMap.get(names[i]);

      if (!typeId) {
        console.warn(
          `Type introuvable pour ${p.name}: ${names[i]}`
        );
        continue;
      }

      associations.push({
        pokemonId: p.id,
        typeId,
        slot: i + 1,
      });
    }
  }

  console.log(
    `${associations.length} associations à créer.`
  );

  // On supprime les anciennes associations en une seule requête.
  await prisma.pokemonType.deleteMany();

  // Puis on insère toutes les associations en une seule opération.
  await prisma.pokemonType.createMany({
    data: associations,
  });

  console.log(
    `✓ ${associations.length} associations Pokémon ↔ types créées.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
