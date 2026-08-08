require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const axios = require("axios");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function mapFormType(name, isDefault, isBattleOnly) {
  if (isDefault && !isBattleOnly) return "NORMAL";

  if (name.includes("mega")) return "MEGA";
  if (name.includes("gmax")) return "GIGANTAMAX";
  if (name.includes("gigantamax")) return "GIGANTAMAX";

  return "NORMAL";
}

function getGeneration(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
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

  let formCount = 0;
  let spriteCount = 0;

  for (let i = 0; i < pokemonList.length; i++) {
    const pokemon = pokemonList[i];

    try {
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon.pokedexNumber}`
      );

      const data = response.data;

      // ==================================================
      // FORMES
      // ==================================================

      const formName = data.forms?.[0]?.name ?? data.name;

      const isDefault = data.is_default ?? true;

      const isBattleOnly =
        data.is_battle_only ?? false;

      const formType = mapFormType(
        formName,
        isDefault,
        isBattleOnly
      );

      const stats = Object.fromEntries(
        data.stats.map((stat) => [
          stat.stat.name,
          stat.base_stat,
        ])
      );

      const types = data.types.sort(
        (a, b) => a.slot - b.slot
      );

      const form = await prisma.pokemonForm.upsert({
        where: {
          pokemonId_name: {
            pokemonId: pokemon.id,
            name: formName,
          },
        },
        update: {
          formName:
            data.form_names?.[0]?.name ?? null,
          formType,
          generation: getGeneration(data.id),
          isDefault,
          isBattleOnly,
          type1: types[0]?.type.name ?? null,
          type2: types[1]?.type.name ?? null,
          hp: stats.hp ?? null,
          attack: stats.attack ?? null,
          defense: stats.defense ?? null,
          specialAttack:
            stats["special-attack"] ?? null,
          specialDefense:
            stats["special-defense"] ?? null,
          speed: stats.speed ?? null,
          height: data.height
            ? data.height / 10
            : null,
          weight: data.weight
            ? data.weight / 10
            : null,
        },
        create: {
          pokemonId: pokemon.id,
          name: formName,
          formName:
            data.form_names?.[0]?.name ?? null,
          formType,
          generation: getGeneration(data.id),
          isDefault,
          isBattleOnly,
          type1: types[0]?.type.name ?? null,
          type2: types[1]?.type.name ?? null,
          hp: stats.hp ?? null,
          attack: stats.attack ?? null,
          defense: stats.defense ?? null,
          specialAttack:
            stats["special-attack"] ?? null,
          specialDefense:
            stats["special-defense"] ?? null,
          speed: stats.speed ?? null,
          height: data.height
            ? data.height / 10
            : null,
          weight: data.weight
            ? data.weight / 10
            : null,
        },
      });

      formCount++;

      // ==================================================
      // SPRITES
      // ==================================================

      const sprites = data.sprites ?? {};
      const other = sprites.other ?? {};
      const official =
        other["official-artwork"] ?? {};

      await prisma.pokemonSprite.create({
        data: {
          pokemonId: pokemon.id,
          formId: form.id,

          frontDefault:
            sprites.front_default ?? null,

          frontShiny:
            sprites.front_shiny ?? null,

          backDefault:
            sprites.back_default ?? null,

          backShiny:
            sprites.back_shiny ?? null,

          officialArtwork:
            official.front_default ?? null,

          icon:
            sprites.front_default ?? null,
        },
      });

      spriteCount++;

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
  console.log("===== IMPORT FORMES / SPRITES =====");
  console.log(`Formes : ${formCount}`);
  console.log(`Sprites : ${spriteCount}`);
  console.log("==================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
