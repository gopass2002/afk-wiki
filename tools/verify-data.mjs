#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(toolsDirectory, "..");
const execFileAsync = promisify(execFile);
const codexDerivedFiles = [
  "skill-codex.json",
  "skill-enhancement-probabilities.json",
  "equipment-enhancement-probabilities.json",
  "item-codex.json",
  "item-acquisition-probabilities.json",
  "item-drop-weights.json",
  "monster-codex.json",
  "monster-drop-seeds.json",
  "zone-atlas.json",
  "collection-codex.json",
  "collection-milestones.json",
  "cooking-levels.json",
  "refine-attribute-values.json",
  "refine-options.json",
];

function parseArgs(argv) {
  const options = { root: defaultRoot };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") options.root = path.resolve(argv[++index]);
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function readJson(root, filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${path.relative(root, filePath)}: invalid JSON (${error.message})`);
  }
}

function fail(errors) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
}

async function main() {
  const { root } = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(root, "assets", "data", "manifest.json");
  const generatedManifestPath = path.join(root, "_data", "generated_manifest.json");
  const rawDataDirectory = path.join(root, "assets", "data", "raw");
  const tableDirectory = path.join(root, "docs", "data", "tables");
  const derivedProbabilityPath = path.join(root, "assets", "data", "derived", "reward-probabilities.json");
  const errors = [];
  const manifest = await readJson(root, manifestPath);
  const generatedManifest = await readJson(root, generatedManifestPath);
  const derivedProbability = await readJson(root, derivedProbabilityPath);

  if (JSON.stringify(manifest) !== JSON.stringify(generatedManifest)) {
    errors.push("assets/data/manifest.json and _data/generated_manifest.json differ");
  }
  if (!Array.isArray(manifest.tables)) {
    errors.push("manifest.tables must be an array");
    fail(errors);
    return;
  }
  if (manifest.tableCount !== manifest.tables.length) {
    errors.push(`manifest tableCount is ${manifest.tableCount}, expected ${manifest.tables.length}`);
  }

  const rawFiles = new Set(await readdir(rawDataDirectory));
  const manifestFiles = new Set();
  let rowTotal = 0;
  let successfulTables = 0;

  for (const table of manifest.tables) {
    if (!/^[a-z0-9][a-z0-9-]*\.json$/.test(table.file ?? "")) {
      errors.push(`unsafe or missing table file name: ${JSON.stringify(table.file)}`);
      continue;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(table.slug ?? "")) {
      errors.push(`unsafe or missing table slug: ${JSON.stringify(table.slug)}`);
      continue;
    }

    manifestFiles.add(table.file);
    const rawFilePath = path.join(rawDataDirectory, table.file);
    const rawTable = await readJson(root, rawFilePath);
    if (!Array.isArray(rawTable.rows)) errors.push(`${table.file} must contain a rows array`);
    else if (rawTable.rows.length !== table.rowCount) {
      errors.push(`${table.file} has ${rawTable.rows.length} rows, manifest declares ${table.rowCount}`);
    }
    for (const [field, expected] of [
      ["appVersion", manifest.appVersion],
      ["patch", manifest.patch],
      ["sourceConfig", manifest.sourceConfig],
      ["extractedAt", manifest.extractedAt],
      ["schema", table.schema],
      ["sourceAsset", table.sourceAsset],
      ["rowCount", table.rowCount],
    ]) {
      if (rawTable.meta?.[field] !== expected) {
        errors.push(`${table.file} metadata ${field} does not match manifest/table`);
      }
    }

    const documentPath = path.join(tableDirectory, `${table.slug}.md`);
    let document;
    try {
      document = await readFile(documentPath, "utf8");
    } catch {
      errors.push(`missing generated table document: docs/data/tables/${table.slug}.md`);
      continue;
    }
    const expectedDataFile = `data_file: "/assets/data/raw/${table.file}"`;
    if (!document.includes(expectedDataFile)) {
      errors.push(`docs/data/tables/${table.slug}.md does not reference ${table.file}`);
    }

    rowTotal += table.rowCount;
    if (table.status === "ok") successfulTables += 1;
  }

  for (const rawFile of rawFiles) {
    if (rawFile.endsWith(".json") && !manifestFiles.has(rawFile)) {
      errors.push(`raw data file is absent from manifest: ${rawFile}`);
    }
  }
  if (rowTotal !== manifest.totalRows) {
    errors.push(`manifest totalRows is ${manifest.totalRows}, expected ${rowTotal}`);
  }
  if (successfulTables !== manifest.successfulTableCount) {
    errors.push(`manifest successfulTableCount is ${manifest.successfulTableCount}, expected ${successfulTables}`);
  }
  if (manifest.failedTableCount !== manifest.tableCount - successfulTables) {
    errors.push("manifest failedTableCount does not match table statuses");
  }

  try {
    await execFileAsync(process.execPath, [
      path.join(toolsDirectory, "generate-derived-data.mjs"),
      "--root",
      root,
      "--check",
    ]);
  } catch (error) {
    errors.push(`derived recomputation failed: ${error.stderr?.trim() || error.message}`);
  }
  try {
    await execFileAsync(process.execPath, [
      path.join(toolsDirectory, "generate-codex-data.mjs"),
      "--root",
      root,
      "--check",
    ]);
  } catch (error) {
    errors.push(`codex-derived recomputation failed: ${error.stderr?.trim() || error.message}`);
  }

  const probabilityRows = derivedProbability.rows;
  const derivedSummary = manifest.derived?.rewardProbabilities;
  if (!derivedSummary) {
    errors.push("manifest derived.rewardProbabilities is missing");
  } else {
    for (const field of ["formula", "groupCount", "rowCount", "runtimeEvidence"]) {
      if (derivedSummary[field] !== derivedProbability.meta?.[field]) {
        errors.push(`manifest derived.rewardProbabilities.${field} does not match derived metadata`);
      }
    }
  }
  if (!Array.isArray(probabilityRows)) {
    errors.push("derived reward probabilities must contain a rows array");
  } else {
    if (derivedProbability.meta?.rowCount !== probabilityRows.length) {
      errors.push("derived probability rowCount does not match rows");
    }
    if (derivedProbability.meta?.patch !== manifest.patch) {
      errors.push("derived probability patch does not match manifest");
    }
    if (derivedProbability.meta?.appVersion !== manifest.appVersion) {
      errors.push("derived probability appVersion does not match manifest");
    }
    const totals = new Map();
    for (const row of probabilityRows) {
      if (!(row.probability > 0 && row.probability <= 1)) {
        errors.push(`invalid probability in ${row.groupListKey}: ${row.probability}`);
        continue;
      }
      totals.set(row.groupListKey, (totals.get(row.groupListKey) ?? 0) + row.probability);
    }
    if (derivedProbability.meta?.groupCount !== totals.size) {
      errors.push("derived probability groupCount does not match rows");
    }
    for (const [group, total] of totals) {
      if (Math.abs(total - 1) > 1e-8) errors.push(`${group} probability sum is ${total}`);
    }
  }

  for (const fileName of codexDerivedFiles) {
    const payload = await readJson(root, path.join(root, "assets", "data", "derived", fileName));
    if (!Array.isArray(payload.rows)) {
      errors.push(`${fileName} must contain a rows array`);
      continue;
    }
    if (payload.meta?.rowCount !== payload.rows.length) {
      errors.push(`${fileName} metadata rowCount does not match rows`);
    }
    if (payload.meta?.patch !== manifest.patch || payload.meta?.appVersion !== manifest.appVersion) {
      errors.push(`${fileName} version metadata does not match manifest`);
    }
    const summary = manifest.derived?.[payload.meta?.kind];
    if (!summary) {
      errors.push(`manifest derived.${payload.meta?.kind ?? "unknown"} is missing`);
      continue;
    }
    for (const field of ["rowCount", "formula", "runtimeEvidence", "warning"]) {
      if (payload.meta?.[field] !== undefined && summary[field] !== payload.meta[field]) {
        errors.push(`manifest derived.${payload.meta.kind}.${field} does not match derived metadata`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
    return;
  }
  console.log(`Data validation passed: ${manifest.tableCount} tables, ${manifest.totalRows} raw rows, ${derivedProbability.meta.rowCount} reward odds, ${codexDerivedFiles.length} codex datasets, patch ${manifest.patch}.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
