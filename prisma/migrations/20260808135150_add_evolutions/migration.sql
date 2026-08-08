-- CreateEnum
CREATE TYPE "MoveCategory" AS ENUM ('PHYSICAL', 'SPECIAL', 'STATUS');

-- CreateEnum
CREATE TYPE "DamageClass" AS ENUM ('PHYSICAL', 'SPECIAL', 'STATUS');

-- CreateEnum
CREATE TYPE "EvolutionTrigger" AS ENUM ('LEVEL', 'ITEM', 'TRADE', 'FRIENDSHIP', 'STONE', 'LOCATION', 'MOVE', 'OTHER');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('NORMAL', 'MEGA', 'GIGANTAMAX', 'GIGANTAMAX_FORM', 'REGIONAL', 'ALOLA', 'GALAR', 'HISUI', 'PALDEA', 'PRIMAL', 'ORIGIN', 'THERIAN', 'INCARNATE', 'TOTEM', 'BATTLE', 'OTHER');

-- AlterTable
ALTER TABLE "Pokemon" ADD COLUMN     "baseExperience" INTEGER,
ADD COLUMN     "catchRate" INTEGER,
ADD COLUMN     "genderRate" DOUBLE PRECISION,
ADD COLUMN     "generation" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER,
    "description" TEXT,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonType" (
    "pokemonId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "PokemonType_pkey" PRIMARY KEY ("pokemonId","typeId")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER,
    "description" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonAbility" (
    "pokemonId" INTEGER NOT NULL,
    "abilityId" INTEGER NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "slot" INTEGER,

    CONSTRAINT "PokemonAbility_pkey" PRIMARY KEY ("pokemonId","abilityId")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER,
    "power" INTEGER,
    "accuracy" INTEGER,
    "pp" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "effect" TEXT,
    "category" "MoveCategory" NOT NULL,
    "damageClass" "DamageClass" NOT NULL,
    "typeId" INTEGER NOT NULL,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonMove" (
    "pokemonId" INTEGER NOT NULL,
    "moveId" INTEGER NOT NULL,
    "learnMethod" TEXT NOT NULL,
    "level" INTEGER,
    "generation" INTEGER,

    CONSTRAINT "PokemonMove_pkey" PRIMARY KEY ("pokemonId","moveId","learnMethod")
);

-- CreateTable
CREATE TABLE "Evolution" (
    "id" SERIAL NOT NULL,
    "fromPokemonId" INTEGER NOT NULL,
    "toPokemonId" INTEGER NOT NULL,
    "level" INTEGER,
    "item" TEXT,
    "condition" TEXT,

    CONSTRAINT "Evolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonForm" (
    "id" SERIAL NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "formName" TEXT,
    "formType" "FormType" NOT NULL,
    "generation" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isBattleOnly" BOOLEAN NOT NULL DEFAULT false,
    "type1" TEXT,
    "type2" TEXT,
    "hp" INTEGER,
    "attack" INTEGER,
    "defense" INTEGER,
    "specialAttack" INTEGER,
    "specialDefense" INTEGER,
    "speed" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "PokemonForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonSprite" (
    "id" SERIAL NOT NULL,
    "pokemonId" INTEGER,
    "formId" INTEGER,
    "frontDefault" TEXT,
    "frontShiny" TEXT,
    "backDefault" TEXT,
    "backShiny" TEXT,
    "officialArtwork" TEXT,
    "icon" TEXT,

    CONSTRAINT "PokemonSprite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EggGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonEggGroup" (
    "pokemonId" INTEGER NOT NULL,
    "eggGroupId" INTEGER NOT NULL,

    CONSTRAINT "PokemonEggGroup_pkey" PRIMARY KEY ("pokemonId","eggGroupId")
);

-- CreateTable
CREATE TABLE "Nature" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "increasedStat" TEXT,
    "decreasedStat" TEXT,
    "favoriteFlavor" TEXT,
    "dislikedFlavor" TEXT,

    CONSTRAINT "Nature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Type_name_key" ON "Type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonType_pokemonId_slot_key" ON "PokemonType"("pokemonId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Ability_name_key" ON "Ability"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Move_name_key" ON "Move"("name");

-- CreateIndex
CREATE INDEX "Move_typeId_idx" ON "Move"("typeId");

-- CreateIndex
CREATE INDEX "Move_generation_idx" ON "Move"("generation");

-- CreateIndex
CREATE INDEX "PokemonMove_moveId_idx" ON "PokemonMove"("moveId");

-- CreateIndex
CREATE UNIQUE INDEX "Evolution_fromPokemonId_toPokemonId_key" ON "Evolution"("fromPokemonId", "toPokemonId");

-- CreateIndex
CREATE INDEX "PokemonForm_formType_idx" ON "PokemonForm"("formType");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonForm_pokemonId_name_key" ON "PokemonForm"("pokemonId", "name");

-- CreateIndex
CREATE INDEX "PokemonSprite_pokemonId_idx" ON "PokemonSprite"("pokemonId");

-- CreateIndex
CREATE INDEX "PokemonSprite_formId_idx" ON "PokemonSprite"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "EggGroup_name_key" ON "EggGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Nature_name_key" ON "Nature"("name");

-- CreateIndex
CREATE INDEX "Pokemon_generation_idx" ON "Pokemon"("generation");

-- CreateIndex
CREATE INDEX "Pokemon_name_idx" ON "Pokemon"("name");

-- AddForeignKey
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonType" ADD CONSTRAINT "PokemonType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolution" ADD CONSTRAINT "Evolution_fromPokemonId_fkey" FOREIGN KEY ("fromPokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolution" ADD CONSTRAINT "Evolution_toPokemonId_fkey" FOREIGN KEY ("toPokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSprite" ADD CONSTRAINT "PokemonSprite_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSprite" ADD CONSTRAINT "PokemonSprite_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonEggGroup" ADD CONSTRAINT "PokemonEggGroup_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonEggGroup" ADD CONSTRAINT "PokemonEggGroup_eggGroupId_fkey" FOREIGN KEY ("eggGroupId") REFERENCES "EggGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
