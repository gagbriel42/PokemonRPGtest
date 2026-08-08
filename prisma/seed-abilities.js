require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Récupération de la liste des Pokémon...");

  const response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?limit=1025"
  );

  const pokemonList = response.data.results;

  console.log(`${pokemonList.length} Pokémon trouvés.`);

  const abilityMap = new Map();

  // ---------------------------------------------------------
  // 1. Récupérer les capacités de chaque Pokémon
  // ---------------------------------------------------------

  for (let i = 0; i < pokemonList.length; i++) {
    const { data } = await axios.get(pokemonList[i].url);

    for (const abilityEntry of data.abilities) {
      const abilityName = abilityEntry.ability.name;
      const abilityUrl = abilityEntry.ability.url;

      if (!abilityMap.has(abilityName)) {
        abilityMap.set(abilityName, {
          name: abilityName,
          url: abilityUrl,
        });
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(
        `Pokémon analysés : ${i + 1}/${pokemonList.length}`
      );
    }
  }

  console.log(
    `${abilityMap.size} capacités uniques trouvées.`
  );

  // ---------------------------------------------------------
  // 2. Créer les capacités
  // ---------------------------------------------------------

  for (const ability of abilityMap.values()) {
    let generation = null;
    let description = null;

    try {
      const { data } = await axios.get(ability.url);

      if (data.generation?.url) {
        generation = Number(
          data.generation.url
            .split("/")
            .filter(Boolean)
            .pop()
        );
      }

      const frenchEntry = data.flavor_text_entries?.find(
        (entry) => entry.language.name === "fr"
      );

      const englishEntry = data.flavor_text_entries?.find(
        (entry) => entry.language.name === "en"
      );

      description =
        frenchEntry?.flavor_text ??
        englishEntry?.flavor_text ??
        null;
    } catch (error) {
      console.warn(
        `Impossible de récupérer ${ability.name}`
      );
    }

    await prisma.ability.upsert({
      where: {
        name: ability.name,
      },
      update: {
        generation,
        description,
      },
      create: {
        name: ability.name,
        generation,
        description,
      },
    });
  }

  console.log("Capacités enregistrées.");

  // ---------------------------------------------------------
  // 3. Récupérer les IDs
  // ---------------------------------------------------------

  const abilities = await prisma.ability.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const abilityIdMap = new Map(
    abilities.map((ability) => [
      ability.name,
      ability.id,
    ])
  );

  // ---------------------------------------------------------
  // 4. Récupérer les Pokémon
  // ---------------------------------------------------------

  const pokemon = await prisma.pokemon.findMany({
    select: {
      id: true,
      pokedexNumber: true,
    },
  });

  console.log(
    `${pokemon.length} Pokémon présents dans la base.`
  );

  // ---------------------------------------------------------
  // 5. Construire les associations
  // ---------------------------------------------------------

  const associations = [];

  for (const p of pokemon) {
    const apiPokemon = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${p.pokedexNumber}`
    );

    for (const abilityEntry of apiPokemon.data.abilities) {
      const abilityName = abilityEntry.ability.name;
      const abilityId = abilityIdMap.get(abilityName);

      if (!abilityId) {
        console.warn(
          `Capacité introuvable : ${abilityName}`
        );
        continue;
      }

      associations.push({
        pokemonId: p.id,
        abilityId,
        isHidden: abilityEntry.is_hidden,
        slot: abilityEntry.slot,
      });
    }
  }

  console.log(
    `${associations.length} associations Pokémon ↔ capacités trouvées.`
  );

  // ---------------------------------------------------------
  // 6. Nettoyer les anciennes associations
  // ---------------------------------------------------------

  await prisma.pokemonAbility.deleteMany();

  // ---------------------------------------------------------
  // 7. Insérer les associations
  // ---------------------------------------------------------

  await prisma.pokemonAbility.createMany({
    data: associations,
    skipDuplicates: true,
  });

  console.log(
    `✓ ${associations.length} associations Pokémon ↔ capacités créées.`
  );

  // ---------------------------------------------------------
  // 8. Vérification
  // ---------------------------------------------------------

  const abilityCount = await prisma.ability.count();
  const associationCount =
    await prisma.pokemonAbility.count();

  console.log("");
  console.log("===== VÉRIFICATION =====");
  console.log(`Capacités : ${abilityCount}`);
  console.log(
    `Associations : ${associationCount}`
  );
  console.log("========================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
