/**
 * Offline stand-in for the Content Lake (`SANITY_FIXTURE=1`, see scripts/fixture.mjs).
 * Runs the real GROQ queries with groq-js against the seed content.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { evaluate, parse } from "groq-js";

let dataset: Promise<unknown[]> | undefined;

export async function fixtureFetch(query: string, params: Record<string, unknown>) {
  dataset ??= readFile(path.join(process.cwd(), ".fixture/dataset.json"), "utf8").then(JSON.parse);
  const result = await evaluate(parse(query, { params }), { dataset: await dataset, params });
  return result.get();
}
