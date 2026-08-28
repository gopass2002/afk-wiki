#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const TOOL_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(TOOL_DIRECTORY, "..");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") options.root = path.resolve(argv[++index]);
    else if (value === "--help") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node tools/verify-media.mjs [--root <wiki-root>]

Validates raw skill/item references, media manifest metadata, stable paths,
PNG signatures and dimensions, byte counts, SHA-256 hashes, and missing/extra files.`);
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${filePath}: invalid JSON (${error.message})`);
  }
}

function expectedEntries(skills, items) {
  return [
    ...skills.filter((row) => row.iconPath).map((row) => ({
      entityType: "skill",
      id: row.id,
      sourcePath: row.iconPath,
    })),
    ...items.filter((row) => row.icon).map((row) => ({
      entityType: "item",
      id: row.id,
      sourcePath: row.icon,
    })),
  ];
}

function inspectPng(bytes) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("invalid PNG signature");
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width === 0 || height === 0 || width > 8192 || height > 8192) {
    throw new Error(`invalid PNG dimensions ${width}x${height}`);
  }
  return { height, width };
}

async function listFiles(directory, relative = "") {
  const files = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const child = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function fail(errors) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();

  const rawManifestPath = path.join(options.root, "assets", "data", "manifest.json");
  const mediaDirectory = path.join(options.root, "assets", "images", "game");
  const [rawManifest, skills, items, mediaManifest] = await Promise.all([
    readJson(rawManifestPath),
    readJson(path.join(options.root, "assets", "data", "raw", "skill.json")).then((value) => value.rows),
    readJson(path.join(options.root, "assets", "data", "raw", "item.json")).then((value) => value.rows),
    readJson(path.join(mediaDirectory, "manifest.json")),
  ]);
  const errors = [];
  if (!Array.isArray(skills) || !Array.isArray(items)) {
    return fail(["raw skill/item data must contain rows arrays"]);
  }
  if (!Array.isArray(mediaManifest.entries)) {
    return fail(["media manifest entries must be an array"]);
  }

  for (const field of ["appVersion", "patch", "sourceConfig"]) {
    if (mediaManifest[field] !== rawManifest[field]) {
      errors.push(`media manifest ${field} does not match raw manifest`);
    }
  }

  const expected = expectedEntries(skills, items);
  const expectedByEntity = new Map(
    expected.map((entry) => [`${entry.entityType}:${entry.id}`, entry]),
  );
  if (expectedByEntity.size !== expected.length) errors.push("raw media entity keys are not unique");
  if (mediaManifest.entries.length !== expected.length) {
    errors.push(`media manifest has ${mediaManifest.entries.length} entries, expected ${expected.length}`);
  }

  const actualEntities = new Set();
  const expectedFiles = new Set(["manifest.json"]);
  for (const entry of mediaManifest.entries) {
    const entityKey = `${entry.entityType}:${entry.id}`;
    if (actualEntities.has(entityKey)) {
      errors.push(`duplicate media entity: ${entityKey}`);
      continue;
    }
    actualEntities.add(entityKey);
    const rawEntry = expectedByEntity.get(entityKey);
    if (!rawEntry) errors.push(`media entity absent from raw data: ${entityKey}`);
    else if (entry.sourcePath !== rawEntry.sourcePath) {
      errors.push(`${entityKey} sourcePath does not match raw data`);
    }

    const directory = entry.entityType === "skill" ? "skills" :
      entry.entityType === "item" ? "items" : null;
    const expectedOutputPath = directory && /^\d+$/.test(String(entry.id)) ?
      `/assets/images/game/${directory}/${entry.id}.png` : null;
    if (!expectedOutputPath || entry.outputPath !== expectedOutputPath) {
      errors.push(`${entityKey} has unsafe or unstable outputPath: ${JSON.stringify(entry.outputPath)}`);
      continue;
    }
    const relativePath = entry.outputPath.slice("/assets/images/game/".length);
    expectedFiles.add(relativePath);

    for (const field of ["appVersion", "patch", "sourceConfig"]) {
      if (entry[field] !== rawManifest[field]) errors.push(`${entityKey} ${field} mismatch`);
    }
    if (!Number.isInteger(entry.bytes) || entry.bytes <= 0) errors.push(`${entityKey} invalid byte count`);
    if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) errors.push(`${entityKey} invalid SHA-256`);

    try {
      const bytes = await readFile(path.join(mediaDirectory, relativePath));
      const dimensions = inspectPng(bytes);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (bytes.length !== entry.bytes) errors.push(`${entityKey} byte count mismatch`);
      if (sha256 !== entry.sha256) errors.push(`${entityKey} SHA-256 mismatch`);
      if (dimensions.width !== entry.width || dimensions.height !== entry.height) {
        errors.push(`${entityKey} PNG dimensions mismatch`);
      }
    } catch (error) {
      errors.push(`${entityKey} image invalid or missing: ${error.message}`);
    }
  }

  for (const entityKey of expectedByEntity.keys()) {
    if (!actualEntities.has(entityKey)) errors.push(`raw media entity missing from manifest: ${entityKey}`);
  }

  const actualFiles = new Set(await listFiles(mediaDirectory));
  for (const file of expectedFiles) {
    if (!actualFiles.has(file)) errors.push(`missing media file: ${file}`);
  }
  for (const file of actualFiles) {
    if (!expectedFiles.has(file)) errors.push(`extra media file: ${file}`);
  }

  const expectedCounts = {
    enhancementItems: expected.filter((entry) =>
      entry.entityType === "item" && /(?:^|\/)item_enhance_/i.test(entry.sourcePath)
    ).length,
    items: expected.filter((entry) => entry.entityType === "item").length,
    skills: expected.filter((entry) => entry.entityType === "skill").length,
    total: expected.length,
    uniqueSources: new Set(expected.map((entry) => entry.sourcePath)).size,
  };
  for (const [field, count] of Object.entries(expectedCounts)) {
    if (mediaManifest.counts?.[field] !== count) errors.push(`media manifest count ${field} mismatch`);
  }

  if (errors.length > 0) return fail(errors);
  console.log(
    `Media validation passed: ${expectedCounts.skills} skills, ${expectedCounts.items} items, ` +
    `${expectedCounts.enhancementItems} enhancement items, ${actualFiles.size - 1} PNG files.`,
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
