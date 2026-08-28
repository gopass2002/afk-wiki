#!/usr/bin/env node

import { execFile, spawn } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const DEFAULT_ORIGIN = "https://afk.icecatgames.net/";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WIKI_ROOT = path.resolve(SCRIPT_DIR, "..");
const execFileAsync = promisify(execFile);
const CODEX_DERIVED_FILES = [
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

const CONFIG_TABLES = new Set([
  "FBDataAuctionConfig",
  "FBDataBagConfig",
  "FBDataCameraConfig",
  "FBDataChatConfig",
  "FBDataColorConfig",
  "FBDataCombatConfig",
  "FBDataCookConfig",
  "FBDataDummyConfig",
  "FBDataEnhanceConfig",
  "FBDataGuildConfig",
  "FBDataInitConfig",
  "FBDataMailConfig",
  "FBDataPlayerConfig",
  "FBDataPotionConfig",
  "FBDataRefineConfig",
  "FBDataShopConfig",
  "FBDataSkillConfig",
  "FBDataSoundConfig",
  "FBDataSystemConfig",
  "FBDataUIConfig",
]);

const CATEGORY_LABELS = {
  collection: "도감",
  economy: "경제·보상",
  equipment: "장비·성장",
  food: "음식·요리",
  items: "아이템",
  localization: "문자열",
  skills: "무공",
  system: "시스템",
  world: "세계·전투",
};

function parseArgs(argv) {
  const options = { origin: DEFAULT_ORIGIN };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--origin") options.origin = argv[++index];
    else if (value === "--chrome") options.chrome = argv[++index];
    else if (value === "--help") options.help = true;
    else throw new Error(`알 수 없는 옵션: ${value}`);
  }
  options.origin = new URL(options.origin).toString();
  return options;
}

function printHelp() {
  console.log(`사용법: node tools/extract-game-data.mjs [옵션]

옵션:
  --origin <url>  게임 배포 주소 (기본값: ${DEFAULT_ORIGIN})
  --chrome <path> Chrome/Chromium 실행 파일
  --help          도움말

출력:
  assets/data/raw/*.json
  assets/data/manifest.json
  _data/generated_manifest.json
  docs/data/tables/*.md`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "afk-wiki-data-extractor/1.0" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function matchRequired(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) throw new Error(`${label} 경로를 찾지 못했습니다.`);
  return match[1];
}

async function resolveRelease(origin) {
  const indexHtml = await fetchText(origin);
  const entryPath = matchRequired(indexHtml, /System\.import\(['"]\.\/(index\.[^'"]+\.js)['"]\)/, "엔트리 스크립트");
  const entryUrl = new URL(entryPath, origin);
  const entryScript = await fetchText(entryUrl);
  const applicationPath = matchRequired(entryScript, /["']\.\/(application\.[^"']+\.js)["']/, "애플리케이션 스크립트");
  const applicationUrl = new URL(applicationPath, entryUrl);
  const applicationScript = await fetchText(applicationUrl);
  const settingsPath = matchRequired(applicationScript, /settingsPath\s*=\s*['"]([^'"]+settings\.[^'"]+\.json)['"]/, "설정 파일");
  const settingsUrl = new URL(settingsPath, applicationUrl);
  const settings = await fetchJson(settingsUrl);
  const patchVersion = settings.assets?.bundleVers?.PatchResource;
  if (!patchVersion) throw new Error("PatchResource 버전을 찾지 못했습니다.");
  const patchConfigUrl = new URL(`remote/PatchResource/config.${patchVersion}.json`, origin);
  const patchConfig = await fetchJson(patchConfigUrl);
  const scriptPackage = settings.scripting?.scriptPackages?.[0];
  if (!scriptPackage) throw new Error("Cocos 스크립트 패키지를 찾지 못했습니다.");
  const scriptPackageUrl = new URL(scriptPackage, settingsUrl);
  const flatBufferAssets = Object.values(patchConfig.paths)
    .map((entry) => entry[0])
    .filter((assetPath) => assetPath.startsWith("00.Data/FlatBuffer/"))
    .map((assetPath) => assetPath.split("/").at(-1))
    .sort((left, right) => left.localeCompare(right));

  return {
    entryUrl: entryUrl.toString(),
    flatBufferAssets,
    origin,
    patchConfigUrl: patchConfigUrl.toString(),
    patchVersion,
    scriptPackageUrl: scriptPackageUrl.toString(),
    settings,
    settingsUrl: settingsUrl.toString(),
  };
}

async function firstExecutable(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // 다음 후보를 확인한다.
    }
  }
  throw new Error("Chrome 또는 Chromium 실행 파일을 찾지 못했습니다. --chrome 경로를 지정하세요.");
}

async function findChrome(explicitPath) {
  return firstExecutable([
    explicitPath,
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForJson(url, attempts = 80) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Chrome DevTools 연결 실패: ${lastError?.message ?? url}`);
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocket = new WebSocket(webSocketUrl);
    this.nextId = 0;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.webSocket.onopen = resolve;
      this.webSocket.onerror = reject;
    });
    this.webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    };
  }

  call(method, params = {}) {
    const id = ++this.nextId;
    this.webSocket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { reject, resolve }));
  }

  async evaluate(expression, awaitPromise = true) {
    const response = await this.call("Runtime.evaluate", {
      awaitPromise,
      expression,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result.value;
  }

  close() {
    this.webSocket.close();
  }
}

function schemaFor(assetName) {
  if (assetName === "FBData") return "FBData";
  if (CONFIG_TABLES.has(assetName)) return "FBDataConfig";
  if (/^FBDataAttribute(?:Cook|Item|Monster|PC)$/.test(assetName)) return "FBDataAttribute";
  return assetName.replace(/_(?:ko|en)$/, "");
}

function slugify(assetName) {
  return assetName
    .replace(/^FBData/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

function categoryFor(assetName) {
  if (assetName.includes("String")) return "localization";
  if (/(Collection|Milestone)/.test(assetName)) return "collection";
  if (/(Cook|AttributeCook)/.test(assetName)) return "food";
  if (/(Zone|Actor|Drop|DailyDungeon|Combat|Quest|Directing|Dialog|AbsorbText)/.test(assetName)) return "world";
  if (/(Skill|UISkill)/.test(assetName)) return "skills";
  if (/(Enhance|Refine|PromotionGrade|AttributeItem|AuctionEnhance)/.test(assetName)) return "equipment";
  if (/(Shop|Gacha|Reward|Membership|AuctionPrice|Selectable)/.test(assetName)) return "economy";
  if (/(Item|Bag|Potion)/.test(assetName)) return "items";
  return "system";
}

function titleFor(assetName) {
  const known = {
    FBData: "데이터 루트",
    FBDataActorMonster: "몬스터",
    FBDataCollection: "도감 항목",
    FBDataCollectionMilestone: "도감 단계",
    FBDataCollectionMilestoneReward: "도감 단계 보상",
    FBDataCollectionRegistry: "도감 등록 규칙",
    FBDataCookEfficiency: "요리 효율",
    FBDataCookLevel: "요리 레벨",
    FBDataCookProb: "요리 확률",
    FBDataDropGroup: "드롭 그룹",
    FBDataDropItem: "아이템 드롭",
    FBDataEnhance: "장비 강화",
    FBDataEnhanceMaterial: "강화 재료",
    FBDataItem: "전체 아이템",
    FBDataRefine: "장비 제련",
    FBDataRefineAttempt: "제련 시도",
    FBDataRefineAttribute: "제련 능력치",
    FBDataRefineGradePool: "제련 등급 풀",
    FBDataRefineSlot: "제련 슬롯",
    FBDataSkill: "무공",
    FBDataZone: "지역·스테이지",
    FBDataZoneRegion: "지도 지역",
    FBDataZoneSpawn: "스테이지 출현 정보",
  };
  return known[assetName] ?? assetName.replace(/^FBData/, "");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function makeDatasetPage(record) {
  const description = `${record.sourceAsset} 원본 ${record.rowCount.toLocaleString("ko-KR")}행을 탐색합니다.`;
  return `---
title: ${yamlString(record.title)}
layout: data
description: ${yamlString(description)}
permalink: /docs/data/tables/${record.slug}/
data_file: ${yamlString(`/assets/data/raw/${record.file}`)}
data_asset: ${yamlString(record.sourceAsset)}
data_schema: ${yamlString(record.schema)}
data_rows: ${record.rowCount}
data_category: ${yamlString(record.categoryLabel)}
data_fields: ${JSON.stringify(record.fields)}
---

이 페이지는 게임 배포본의 \`${record.sourceAsset}\` FlatBuffer를 자동 변환한 결과입니다.
`;
}

async function prepareStagingDirectories(stageRoot) {
  const rawDataDirectory = path.join(stageRoot, "assets", "data", "raw");
  const generatedPagesDirectory = path.join(stageRoot, "docs", "data", "tables");
  await mkdir(rawDataDirectory, { recursive: true });
  await mkdir(generatedPagesDirectory, { recursive: true });
  await mkdir(path.join(stageRoot, "_data"), { recursive: true });
  try {
    await copyFile(
      path.join(WIKI_ROOT, "docs", "data", "tables", "index.md"),
      path.join(generatedPagesDirectory, "index.md"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function startBrowser(chromePath, origin) {
  const profileDir = await mkdtemp(path.join(os.tmpdir(), "afk-wiki-extract-"));
  const port = await getFreePort();
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${port}`,
      "--remote-allow-origins=*",
      `--user-data-dir=${path.join(profileDir, "profile")}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let chromeLog = "";
  chrome.stderr.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });
  const tabs = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const tab = tabs.find((candidate) => candidate.type === "page") ?? tabs[0];
  const cdp = new CdpClient(tab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.call("Runtime.enable");
  await cdp.call("Page.enable");
  await cdp.call("Page.navigate", { url: origin });
  await new Promise((resolve) => setTimeout(resolve, 3500));

  return {
    cdp,
    async close() {
      cdp.close();
      chrome.kill("SIGTERM");
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3000);
        chrome.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
      await rm(profileDir, { force: true, recursive: true });
    },
    getLog: () => chromeLog,
  };
}

async function initializeRuntime(cdp, release) {
  const setupExpression = `(async () => {
    await System.import(${JSON.stringify(release.scriptPackageUrl)});
    const settings = ${JSON.stringify(release.settings)};
    cc.assetManager.init(settings.assets);
    const loadBundle = (name) => new Promise((resolve, reject) => {
      cc.assetManager.loadBundle(name, (error, bundle) => error ? reject(error) : resolve(bundle));
    });
    for (const name of ["resources", "main", "PatchResource"]) await loadBundle(name);
    const flatBufferModule = await System.import("chunks:///_virtual/flat-buffer-data.ts");
    const { FBDataLoader } = await System.import("chunks:///_virtual/FBDataLoader.ts");
    const appVersionModule = await System.import("chunks:///_virtual/AppVersion.ts");

    function serializeValue(value, depth = 0) {
      if (value == null) return value;
      if (typeof value === "bigint") return value.toString();
      if (["string", "number", "boolean"].includes(typeof value)) return value;
      if (depth > 10) return "[max-depth]";
      if (Array.isArray(value)) return value.map((entry) => serializeValue(entry, depth + 1));
      if (ArrayBuffer.isView(value)) return Array.from(value, (entry) => serializeValue(entry, depth + 1));
      if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
      if (value.bb && Number.isInteger(value.bb_pos)) return serializeFlatBuffer(value, depth + 1);
      if (typeof value === "object") {
        const output = {};
        for (const [key, entry] of Object.entries(value)) output[key] = serializeValue(entry, depth + 1);
        return output;
      }
      return String(value);
    }

    function serializeFlatBuffer(record, depth = 0) {
      if (!record) return null;
      const prototype = Object.getPrototypeOf(record);
      const names = Object.getOwnPropertyNames(prototype);
      const vectorNames = new Set(names.filter((name) => name.endsWith("Length")).map((name) => name.slice(0, -6)));
      const output = {};
      for (const name of names) {
        if (name === "constructor" || name === "__init" || name.endsWith("Length")) continue;
        const accessor = record[name];
        if (typeof accessor !== "function") continue;
        try {
          if (vectorNames.has(name)) {
            const length = record[name + "Length"]();
            output[name] = Array.from({ length }, (_, index) => serializeValue(record[name](index), depth + 1));
          } else {
            const value = accessor.call(record);
            if (value !== undefined) output[name] = serializeValue(value, depth + 1);
          }
        } catch (error) {
          output[name] = { _error: String(error) };
        }
      }
      return output;
    }

    globalThis.__AFK_WIKI_CONTEXT = {
      appVersion: appVersionModule.APP_VERSION,
      flatBufferModule,
      loader: new FBDataLoader(),
      serializeFlatBuffer,
    };
    return JSON.stringify({ appVersion: appVersionModule.APP_VERSION });
  })()`;
  return JSON.parse(await cdp.evaluate(setupExpression));
}

async function extractTable(cdp, assetName, schema) {
  const expression = `(async () => {
    const context = globalThis.__AFK_WIKI_CONTEXT;
    const Root = context.flatBufferModule[${JSON.stringify(schema)}];
    if (!Root) throw new Error("스키마 모듈 없음: " + ${JSON.stringify(schema)});
    const getter = Root["getRootAs" + ${JSON.stringify(schema)}];
    if (typeof getter !== "function") throw new Error("루트 접근자 없음: " + ${JSON.stringify(schema)});
    const byteBuffer = await context.loader.readBytes(${JSON.stringify(assetName)});
    const root = getter.call(Root, byteBuffer);
    let rows;
    if (typeof root.elementsLength === "function" && typeof root.elements === "function") {
      rows = Array.from({ length: root.elementsLength() }, (_, index) => context.serializeFlatBuffer(root.elements(index)));
    } else {
      rows = [context.serializeFlatBuffer(root)];
    }
    return JSON.stringify({ rows });
  })()`;
  return JSON.parse(await cdp.evaluate(expression));
}

async function writeDataset(stageRoot, release, runtime, extractedAt, assetName, schema, result) {
  const slug = slugify(assetName) || "root";
  const file = `${slug}.json`;
  const fields = [...new Set(result.rows.flatMap((row) => Object.keys(row ?? {})))];
  const category = categoryFor(assetName);
  const meta = {
    appVersion: runtime.appVersion,
    extractedAt,
    patch: release.patchVersion,
    rowCount: result.rows.length,
    schema,
    sourceAsset: assetName,
    sourceConfig: release.patchConfigUrl,
  };
  const payload = { meta, rows: result.rows };
  await writeFile(path.join(stageRoot, "assets", "data", "raw", file), `${JSON.stringify(payload, null, 2)}\n`);
  const record = {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    fields,
    file,
    rowCount: result.rows.length,
    schema,
    slug,
    sourceAsset: assetName,
    status: "ok",
    title: titleFor(assetName),
  };
  await writeFile(path.join(stageRoot, "docs", "data", "tables", `${slug}.md`), makeDatasetPage(record));
  return record;
}

async function publishSnapshot(stageRoot) {
  const rollbackDirectory = path.join(stageRoot, ".rollback");
  await mkdir(rollbackDirectory);
  const targets = [
    [path.join(stageRoot, "assets", "data"), path.join(WIKI_ROOT, "assets", "data"), "assets-data"],
    [path.join(stageRoot, "docs", "data", "tables"), path.join(WIKI_ROOT, "docs", "data", "tables"), "table-pages"],
    [path.join(stageRoot, "_data", "generated_manifest.json"), path.join(WIKI_ROOT, "_data", "generated_manifest.json"), "generated-manifest"],
  ];
  const changes = [];

  try {
    for (const [staged, live, backupName] of targets) {
      await mkdir(path.dirname(live), { recursive: true });
      const backup = path.join(rollbackDirectory, backupName);
      let hadLive = true;
      try {
        await rename(live, backup);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        hadLive = false;
      }
      const change = { backup, hadLive, live, published: false };
      changes.push(change);
      await rename(staged, live);
      change.published = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const change of changes.reverse()) {
      try {
        if (change.published) await rm(change.live, { force: true, recursive: true });
        if (change.hadLive) await rename(change.backup, change.live);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    if (rollbackErrors.length > 0) {
      const rollbackFailure = new Error(
        `${error.message}; rollback failed: ${rollbackErrors.join("; ")}; recovery data: ${rollbackDirectory}`,
      );
      rollbackFailure.preserveStage = true;
      throw rollbackFailure;
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const stageRoot = await mkdtemp(path.join(WIKI_ROOT, ".extract-stage-"));
  let preserveStage = false;
  try {
    await prepareStagingDirectories(stageRoot);
    console.log(`[1/6] 배포본 확인: ${options.origin}`);
    const release = await resolveRelease(options.origin);
    console.log(`      PatchResource ${release.patchVersion}, FlatBuffer ${release.flatBufferAssets.length}개`);

    console.log("[2/6] Cocos 런타임 준비");
    const chromePath = await findChrome(options.chrome);
    const browser = await startBrowser(chromePath, release.origin);
    const records = [];
    let runtime;
    const extractedAt = new Date().toISOString();
    try {
      runtime = await initializeRuntime(browser.cdp, release);
      console.log(`      앱 버전 ${runtime.appVersion}`);
      console.log("[3/6] 데이터 추출");
      for (let index = 0; index < release.flatBufferAssets.length; index += 1) {
        const assetName = release.flatBufferAssets[index];
        const schema = schemaFor(assetName);
        const prefix = String(index + 1).padStart(String(release.flatBufferAssets.length).length, " ");
        try {
          const result = await extractTable(browser.cdp, assetName, schema);
          const record = await writeDataset(stageRoot, release, runtime, extractedAt, assetName, schema, result);
          records.push(record);
          console.log(`      ${prefix}/${release.flatBufferAssets.length} ${assetName}: ${record.rowCount}행`);
        } catch (error) {
          records.push({
            category: categoryFor(assetName),
            categoryLabel: CATEGORY_LABELS[categoryFor(assetName)],
            error: error.message,
            rowCount: 0,
            schema,
            slug: slugify(assetName) || "root",
            sourceAsset: assetName,
            status: "error",
            title: titleFor(assetName),
          });
          console.warn(`      ${prefix}/${release.flatBufferAssets.length} ${assetName}: 실패 (${error.message})`);
        }
      }
    } finally {
      await browser.close();
    }

    const successfulTableCount = records.filter((record) => record.status === "ok").length;
    if (
      release.flatBufferAssets.length === 0 ||
      records.length !== release.flatBufferAssets.length ||
      successfulTableCount !== release.flatBufferAssets.length
    ) {
      throw new Error(
        `불완전한 추출: ${successfulTableCount}/${records.length}개 (배포본 ${release.flatBufferAssets.length}개)`,
      );
    }

    console.log("[4/6] 매니페스트와 파생 데이터 생성");
    const manifest = {
      appVersion: runtime.appVersion,
      extractedAt,
      failedTableCount: records.filter((record) => record.status !== "ok").length,
      origin: release.origin,
      patch: release.patchVersion,
      sourceConfig: release.patchConfigUrl,
      successfulTableCount: records.filter((record) => record.status === "ok").length,
      tableCount: records.length,
      totalRows: records.reduce((sum, record) => sum + record.rowCount, 0),
      tables: records,
    };
    const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
    await writeFile(path.join(stageRoot, "assets", "data", "manifest.json"), serialized);
    await writeFile(path.join(stageRoot, "_data", "generated_manifest.json"), serialized);
    const derived = await execFileAsync(process.execPath, [
      path.join(SCRIPT_DIR, "generate-derived-data.mjs"),
      "--root",
      stageRoot,
    ]);
    if (derived.stdout.trim()) console.log(`      ${derived.stdout.trim()}`);
    const codexDerived = await execFileAsync(process.execPath, [
      path.join(SCRIPT_DIR, "generate-codex-data.mjs"),
      "--root",
      stageRoot,
    ]);
    if (codexDerived.stdout.trim()) console.log(`      ${codexDerived.stdout.trim()}`);
    const derivedPayload = JSON.parse(
      await readFile(path.join(stageRoot, "assets", "data", "derived", "reward-probabilities.json"), "utf8"),
    );
    manifest.derived = {
      rewardProbabilities: {
        formula: derivedPayload.meta.formula,
        groupCount: derivedPayload.meta.groupCount,
        rowCount: derivedPayload.meta.rowCount,
        runtimeEvidence: derivedPayload.meta.runtimeEvidence,
      },
    };
    for (const fileName of CODEX_DERIVED_FILES) {
      const payload = JSON.parse(
        await readFile(path.join(stageRoot, "assets", "data", "derived", fileName), "utf8"),
      );
      const { kind, rowCount, formula, runtimeEvidence, warning } = payload.meta;
      manifest.derived[kind] = {
        rowCount,
        ...(formula ? { formula } : {}),
        ...(runtimeEvidence ? { runtimeEvidence } : {}),
        ...(warning ? { warning } : {}),
      };
    }
    const finalSerialized = `${JSON.stringify(manifest, null, 2)}\n`;
    await writeFile(path.join(stageRoot, "assets", "data", "manifest.json"), finalSerialized);
    await writeFile(path.join(stageRoot, "_data", "generated_manifest.json"), finalSerialized);

    console.log("[5/6] 스테이징 스냅샷 검증");
    const verified = await execFileAsync(process.execPath, [
      path.join(SCRIPT_DIR, "verify-data.mjs"),
      "--root",
      stageRoot,
    ]);
    if (verified.stdout.trim()) console.log(`      ${verified.stdout.trim()}`);

    console.log("[6/6] 검증된 스냅샷 게시");
    await publishSnapshot(stageRoot);
    console.log(`완료: ${manifest.successfulTableCount}/${manifest.tableCount}개 테이블, ${manifest.totalRows.toLocaleString("ko-KR")}행`);
  } catch (error) {
    preserveStage = error.preserveStage === true;
    throw error;
  } finally {
    if (!preserveStage) await rm(stageRoot, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
