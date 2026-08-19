import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "../..");
const pngRoot = path.join(repoRoot, "tools", "pokegra", "png");

function runPython(script) {
  const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
  for (const command of candidates) {
    const result = spawnSync(command, [script], {
      cwd: repoRoot,
      stdio: "inherit",
      encoding: "utf8",
    });
    if (!result.error) return result.status === 0;
  }
  return false;
}

function immutableSpriteAssets() {
  return {
    name: "immutable-sprite-assets",
    configureServer(server) {
      const spriteBuilder = path.join(repoRoot, "tools", "build_sprite_mapping.py");
      const mapInspector = path.join(repoRoot, "tools", "hgss", "inspect_extracted_maps.py");

      // Generate metadata only. The source PNGs and extracted ROM files are never written.
      if (fs.existsSync(spriteBuilder) && fs.existsSync(pngRoot)) runPython(spriteBuilder);
      if (fs.existsSync(mapInspector) && fs.existsSync(path.join(repoRoot, "soulSilver_extracted"))) {
        runPython(mapInspector);
      }

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
