#!/usr/bin/env node
/**
 * Fetches critical public content into src/content/snapshot.json.
 * Used as the web app's offline/outage fallback. If the API is down,
 * the previously committed snapshot is left untouched (exit 0) so
 * builds never fail because the backend is unavailable.
 */
import { writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../src/content/snapshot.json");
const BASE =
  process.env.SNAPSHOT_API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api/v1";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const json = await res.json();
  return json?.data ?? json;
}

try {
  const [brandSettings, menuCategories, locations] = await Promise.all([
    get("/content/brand-settings"),
    get("/menu/categories").catch(() => null),
    get("/locations").catch(() => null),
  ]);
  const snapshot = {
    generatedAt: new Date().toISOString(),
    apiBase: BASE,
    brandSettings,
    menuCategories,
    locations,
  };
  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`snapshot written: ${OUT}`);
} catch (err) {
  try {
    await readFile(OUT);
    console.warn(`API unreachable (${err.message}); keeping committed snapshot.`);
  } catch {
    await writeFile(
      OUT,
      JSON.stringify(
        { generatedAt: null, apiBase: null, brandSettings: null, menuCategories: null, locations: null },
        null,
        2,
      ) + "\n",
    );
    console.warn(`API unreachable and no snapshot existed; wrote empty-shape snapshot.`);
  }
}
