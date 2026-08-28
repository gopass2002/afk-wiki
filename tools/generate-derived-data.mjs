#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(TOOLS_DIR, "..");

function parseArgs(argv) {
  const options = { check: false, root: DEFAULT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") options.root = path.resolve(argv[++index]);
    else if (value === "--check") options.check = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function rows(root, slug) {
  const source = await readFile(path.join(root, "assets", "data", "raw", `${slug}.json`), "utf8");
  return JSON.parse(source).rows;
}

function groupBy(values, keyOf) {
  const groups = new Map();
  for (const value of values) {
    const key = keyOf(value);
    const group = groups.get(key) ?? [];
    group.push(value);
    groups.set(key, group);
  }
  return groups;
}

function displayNames(items, skills, skillStrings) {
  const itemNames = new Map(items.map((item) => [item.id, item.name]));
  const strings = new Map(skillStrings.map((entry) => [entry.key, entry.value]));
  const skillNames = new Map(
    skills.map((skill) => [skill.id, strings.get(skill.nameKey) ?? skill.nameKey]),
  );
  return (type, targetId) =>
    type === "Skill" ? skillNames.get(targetId) ?? "" : itemNames.get(targetId) ?? "";
}

function comparablePayload(payload) {
  const copy = structuredClone(payload);
  delete copy.meta?.derivedAt;
  return copy;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const derivedDirectory = path.join(options.root, "assets", "data", "derived");
  const outputPath = path.join(derivedDirectory, "reward-probabilities.json");
  const [listRows, noteRows, boxRows, items, skills, skillStrings, manifest] = await Promise.all([
    rows(options.root, "reward-group-list-box"),
    rows(options.root, "promissory-note-quest"),
    rows(options.root, "reward-box"),
    rows(options.root, "item"),
    rows(options.root, "skill"),
    rows(options.root, "string-skill-ko"),
    readFile(path.join(options.root, "assets", "data", "manifest.json"), "utf8").then(JSON.parse),
  ]);

  const termsByGroup = groupBy(
    [
      ...noteRows.map((row) => ({ ...row, source: "FBDataPromissoryNoteQuest", weight: row.ratio })),
      ...boxRows.map((row) => ({ ...row, source: "FBDataRewardBox" })),
    ],
    (row) => row.groupKey,
  );
  const lists = groupBy(listRows, (row) => row.groupListKey);
  const nameOf = displayNames(items, skills, skillStrings);
  const outputRows = [];

  for (const [groupListKey, entries] of lists) {
    const outerTotal = entries.reduce((sum, entry) => sum + entry.ratio, 0);
    if (outerTotal <= 0) continue;
    const outcomes = new Map();

    for (const entry of entries) {
      const terms = termsByGroup.get(entry.rewardGroup) ?? [];
      const innerTotal = terms.reduce((sum, term) => sum + term.weight, 0);
      if (innerTotal <= 0) continue;

      for (const term of terms) {
        const probability = (entry.ratio / outerTotal) * (term.weight / innerTotal);
        if (probability <= 0) continue;
        const key = `${term.type}:${term.targetId}`;
        const current = outcomes.get(key);
        if (current) current.probability += probability;
        else {
          outcomes.set(key, {
            amountMax: term.amountMax,
            amountMin: term.amountMin,
            groupListKey,
            probability,
            sourceGroups: new Set([entry.rewardGroup]),
            targetId: term.targetId,
            targetName: nameOf(term.type, term.targetId),
            type: term.type,
          });
        }
        outcomes.get(key).sourceGroups.add(entry.rewardGroup);
      }
    }

    for (const outcome of outcomes.values()) {
      outputRows.push({
        ...outcome,
        percent: Number((outcome.probability * 100).toFixed(6)),
        probability: Number(outcome.probability.toFixed(10)),
        sourceGroups: [...outcome.sourceGroups],
      });
    }
  }

  outputRows.sort((left, right) =>
    left.groupListKey.localeCompare(right.groupListKey, "en", { numeric: true }) ||
    right.probability - left.probability,
  );

  const payload = {
    meta: {
      appVersion: manifest.appVersion,
      derivedAt: new Date().toISOString(),
      formula:
        "(group ratio / group-list ratio sum) × (term weight / reward-group weight sum); duplicate type+target outcomes are summed",
      groupCount: new Set(outputRows.map((row) => row.groupListKey)).size,
      patch: manifest.patch,
      rowCount: outputRows.length,
      runtimeEvidence: "GachaProbability.computeGachaOdds",
      sources: [
        "FBDataRewardGroupListBox",
        "FBDataPromissoryNoteQuest",
        "FBDataRewardBox",
      ],
    },
    rows: outputRows,
  };

  if (options.check) {
    const existing = JSON.parse(await readFile(outputPath, "utf8"));
    if (JSON.stringify(comparablePayload(existing)) !== JSON.stringify(comparablePayload(payload))) {
      throw new Error("derived reward probabilities are not reproducible from raw data");
    }
    console.log(`파생 확률 검증: ${payload.meta.groupCount}개 풀, ${payload.meta.rowCount}개 결과`);
    return;
  }

  await mkdir(derivedDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`파생 확률 생성: ${payload.meta.groupCount}개 풀, ${payload.meta.rowCount}개 결과`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
