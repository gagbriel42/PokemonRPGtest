#!/bin/bash

set -e

echo "Création du projet Pokémon JDR..."

mkdir -p apps/api/src
mkdir -p apps/web/src
mkdir -p prisma

cat > package.json <<'EOF'
{
  "name": "pokemon-rpg",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "npm run dev --workspace=apps/api"
  }
}
EOF

cat > apps/api/package.json <<'EOF'
{
  "name": "@pokemon-rpg/api",
  "private": true,
  "scripts": {
    "dev": "node src/server.js"
  },
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/cors": "^11.0.0"
  }
}
EOF

cat > apps/api/src/server.js <<'EOF'
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
EOF

cat > apps/web/package.json <<'EOF'
{
  "name": "@pokemon-rpg/web",
  "private": true,
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {}
}
EOF

cat > apps/web/index.html <<'EOF'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pokémon JDR</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > apps/web/src/main.jsx <<'EOF'
import React from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

function App() {
  return (
    <main>
      <h1>Pokémon JDR</h1>

      <p>
        Prototype de jeu de rôle Pokémon — Génération 1
      </p>

      <section>
        <h2>Projet</h2>
        <p>Le site est en cours de construction.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > apps/web/src/style.css <<'EOF'
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #10131a;
  color: white;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

section {
  margin-top: 30px;
  padding: 25px;
  border-radius: 12px;
  background: #1b202b;
}
EOF

echo ""
echo "Projet créé."
echo ""
echo "Arborescence :"
find . -maxdepth 3 -type f \
  ! -path "./.git/*" \
  ! -path "./setup.sh"

