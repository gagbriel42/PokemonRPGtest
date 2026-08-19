import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const pngRoot = path.join(repoRoot, "tools", "pokegra", "png");

function immutableSpriteAssets() {
  return {
    name: "immutable-sprite-assets",
    configureServer(server) {
      server.middlewares.use("/sprite-source", (req, res, next) => {
        const relative = decodeURIComponent((req.url || "").replace(/^\//, ""));
        if (!relative.startsWith("tools/pokegra/png/") || relative.includes("..")) return next();
        const file = path.join(repoRoot, relative);
        if (!file.startsWith(pngRoot + path.sep) || !fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "image/png");
        fs.createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      const mappingPath = path.join(repoRoot, "apps", "web", "public", "data", "pokemon-gen1-sprite-mapping.json");
      if (!fs.existsSync(mappingPath)) return;
      const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
      const copied = new Set();
      for (const entry of Object.values(mapping)) {
        for (const key of ["front", "back", "frontFemale", "backFemale"]) {
          const source = entry[key];
          if (!source || copied.has(source)) continue;
          const sourceFile = path.join(repoRoot, source.replace(/^\//, ""));
          if (!fs.existsSync(sourceFile)) continue;
          const target = `sprite-source/${source.replace(/^\//, "")}`;
          this.emitFile({ type: "asset", fileName: target, source: fs.readFileSync(sourceFile) });
          copied.add(source);
        }
      }
    },
  };
}

export default defineConfig({
  base: "/PokemonRPGtest/",
  plugins: [react(), immutableSpriteAssets()],
});
