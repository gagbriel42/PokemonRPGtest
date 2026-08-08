require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function getEvolutionChain(url) {
  const response = await axios.get(url);
  return response.data.chain;
}

function extractEvolutionPairs(chain) {
  const pairs = [];

  function walk(node) {
    for (const next of node.evolves_to) {
      pairs.push({
        fromSpeciesUrl: node.species.url,
        toSpeciesUrl: next.species.url,
        details: next.evolution_details?.[0] ?? null,
      });

      walk(next);
    }
  }

  walk(chain);

  return pairs;
}

async function main() {
  console.log("Récupération des chaînes d'évolution...");

  const response = await axios.get(
    "https://pokeapi.co/api/v2/evolution-chain?limit=1000"
  );

  const chains = response.data.results;

  console.log(`${chains.length} chaînes trouvées.`);

  let inserted = 0;

  for (const chainInfo of chains) {
    const chain = await getEvolutionChain(chainInfo.url);

    const pairs = extractEvolutionPairs(chain);

    for (const pair of pairs) {
      const fromId = Number(
        pair.fromSpeciesUrl.split("/").filter(Boolean).pop()
      );

      const toId = Number(
        pair.toSpeciesUrl.split("/").filter(Boolean).pop()
      );

      const fromPokemon = await prisma.pokemon.findUnique({
        where: {
          pokedexNumber: fromId,
        },
      });

      const toPokemon = await prisma.pokemon.findUnique({
        where: {
          pokedexNumber: toId,
        },
      });

      if (!fromPokemon || !toPokemon) {
        console.log(
          `Pokémon introuvable : ${fromId} -> ${toId}`
        );
        continue;
      }

      const details = pair.details;

      let level = null;
      let item = null;
      let condition = null;

      if (details) {
        level = details.min_level ?? null;

        if (details.item?.name) {
          item = details.item.name;
        }

        if (details.trigger?.name) {
          condition = details.trigger.name;
        }

        if (details.time_of_day) {
          condition = `time:${details.time_of_day}`;
        }

        if (details.min_happiness !== null) {
          condition = `happiness:${details.min_happiness}`;
        }

        if (details.min_beauty !== null) {
          condition = `beauty:${details.min_beauty}`;
        }

        if (details.min_affection !== null) {
          condition = `affection:${details.min_affection}`;
        }
      }

      await prisma.evolution.upsert({
        where: {
          fromPokemonId_toPokemonId: {
            fromPokemonId: fromPokemon.id,
            toPokemonId: toPokemon.id,
          },
        },
        update: {
          level,
          item,
          condition,
        },
        create: {
          fromPokemonId: fromPokemon.id,
          toPokemonId: toPokemon.id,
          level,
          item,
          condition,
        },
      });

      inserted++;
    }
  }

  console.log(`${inserted} évolutions insérées.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
