const Fastify = require("fastify");
const cors = require("@fastify/cors");

const app = Fastify({
  logger: true
});

app.register(cors, {
  origin: true
});

app.get("/health", async () => {
  return {
    ok: true,
    project: "Pokemon RPG",
    version: "0.1.0"
  };
});

app.get("/", async () => {
  return {
    message: "API Pokémon JDR opérationnelle"
  };
});

const start = async () => {
  try {
    await app.listen({
      port: 3001,
      host: "0.0.0.0"
    });

    console.log("API disponible sur http://localhost:3001");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
