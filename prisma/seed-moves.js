require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function mapDamageClass(value) {
  if (value === "physical") return "PHYSICAL";
  if (value === "special") return "SPECIAL";
  return "STATUS";
}

async function main() {
  console.log("Chargement des Pokémon depuis la base...");

  // --------------------------------------------------
  // 1. CHARGER TOUS LES POKÉMON UNE SEULE FOIS
  // --------------------------------------------------

  const pokemonList = await prisma.pokemon.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const pokemonMap = new Map(
    pokemonList.map((pokemon) => [pokemon.name, pokemon.id])
  );

  console.log(`${pokemonList.length} Pokémon chargés.`);

  // --------------------------------------------------
  // 2. CHARGER LES TYPES UNE SEULE FOIS
  // --------------------------------------------------

  const typeList = await prisma.type.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const typeMap = new Map(
    typeList.map((type) => [type.name, type.id])
  );

  console.log(`${typeList.length} types chargés.`);

  // --------------------------------------------------
  // 3. RÉCUPÉRER LA LISTE DES ATTAQUES
  // --------------------------------------------------

  console.log("Récupération de la liste des attaques...");

  const response = await axios.get(
    "https://pokeapi.co/api/v2/move?limit=1000"
  );

  const moves = response.data.results;

  console.log(`${moves.length} attaques trouvées.`);

  let moveCount = 0;
  let associationCount = 0;

  // --------------------------------------------------
  // 4. TRAITER LES ATTAQUES
  // --------------------------------------------------

  for (let i = 0; i < moves.length; i++) {
    const { data } = await axios.get(moves[i].url);

    if (!data.type?.name) {
      console.log(`⚠️ Type manquant pour ${data.name}`);
      continue;
    }

    // ------------------------------------------------
    // TYPE
    // ------------------------------------------------

    let typeId = typeMap.get(data.type.name);

    if (!typeId) {
      const type = await prisma.type.create({
        data: {
          name: data.type.name,
        },
      });

      typeId = type.id;
      typeMap.set(data.type.name, type.id);
    }

    // ------------------------------------------------
    // GÉNÉRATION
    // ------------------------------------------------

    const generation = data.generation?.url
      ? parseInt(
          data.generation.url
            .split("/")
            .filter(Boolean)
            .pop()
        )
      : null;

    // ------------------------------------------------
    // ATTAQUE
    // ------------------------------------------------

    const move = await prisma.move.upsert({
      where: {
        name: data.name,
      },
      update: {
        generation,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority,
        category: mapDamageClass(data.damage_class?.name),
        damageClass: mapDamageClass(data.damage_class?.name),
        typeId,
      },
      create: {
        name: data.name,
        generation,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority,
        category: mapDamageClass(data.damage_class?.name),
        damageClass: mapDamageClass(data.damage_class?.name),
        typeId,
      },
    });

    moveCount++;

    // ------------------------------------------------
    // ASSOCIATIONS POKÉMON
    // ------------------------------------------------

    const associations = [];

    for (const pokemonEntry of data.learned_by_pokemon ?? []) {
      const pokemonId = pokemonMap.get(pokemonEntry.name);

      if (!pokemonId) {
        continue;
      }

      associations.push({
        pokemonId,
        moveId: move.id,
        learnMethod: "OTHER",
        generation: null,
        level: null,
      });
    }

    // ------------------------------------------------
    // INSERTION GROUPÉE
    // ------------------------------------------------

    if (associations.length > 0) {
      const result = await prisma.pokemonMove.createMany({
        data: associations,
        skipDuplicates: true,
      });

      associationCount += result.count;
    }

    console.log(
      `[${i + 1}/${moves.length}] ${data.name} — ${associations.length} Pokémon`
    );
  }

  // --------------------------------------------------
  // 5. RÉSULTAT
  // --------------------------------------------------

  console.log("");
  console.log("===== IMPORT TERMINÉ =====");
  console.log(`Attaques : ${moveCount}`);
  console.log(`Associations : ${associationCount}`);
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

