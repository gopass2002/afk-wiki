#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const DEFAULT_ORIGIN = "https://afk.icecatgames.net/";
const TOOL_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(TOOL_DIRECTORY, "..");
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function parseArgs(argv) {
  const options = { origin: DEFAULT_ORIGIN, root: DEFAULT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--origin") options.origin = argv[++index];
    else if (value === "--chrome") options.chrome = argv[++index];
    else if (value === "--root") options.root = path.resolve(argv[++index]);
    else if (value === "--help") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  options.origin = new URL(options.origin).toString();
  return options;
}

function printHelp() {
  console.log(`Usage: node tools/extract-game-media.mjs [options]

Options:
  --origin <url>  Live game release URL (default: ${DEFAULT_ORIGIN})
  --chrome <path> Chrome/Chromium executable
  --root <path>   Wiki root containing assets/data/raw
  --help          Show help

Outputs (published only after every image validates):
  assets/images/game/skills/<skillId>.png
  assets/images/game/items/<itemId>.png
  assets/images/game/manifest.json`);
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "afk-wiki-media-extractor/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function matchRequired(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) throw new Error(`Unable to resolve ${label}`);
  return match[1];
}

async function resolveRelease(origin) {
  const indexHtml = await fetchText(origin);
  const entryPath = matchRequired(indexHtml, /System\.import\(['"]\.\/(index\.[^'"]+\.js)['"]\)/, "entry script");
  const entryUrl = new URL(entryPath, origin);
  const entryScript = await fetchText(entryUrl);
  const applicationPath = matchRequired(entryScript, /["']\.\/(application\.[^"']+\.js)["']/, "application script");
  const applicationUrl = new URL(applicationPath, entryUrl);
  const applicationScript = await fetchText(applicationUrl);
  const settingsPath = matchRequired(
    applicationScript,
    /settingsPath\s*=\s*['"]([^'"]+settings\.[^'"]+\.json)['"]/,
    "settings file",
  );
  const settingsUrl = new URL(settingsPath, applicationUrl);
  const settings = await fetchJson(settingsUrl);
  const patchVersion = settings.assets?.bundleVers?.PatchResource;
  const scriptPackage = settings.scripting?.scriptPackages?.[0];
  if (!patchVersion || !scriptPackage) throw new Error("Live release metadata is incomplete");
  return {
    origin,
    patchConfigUrl: new URL(`remote/PatchResource/config.${patchVersion}.json`, origin).toString(),
    patchVersion,
    scriptPackageUrl: new URL(scriptPackage, settingsUrl).toString(),
    settings,
  };
}

async function firstExecutable(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through known browser locations.
    }
  }
  throw new Error("Chrome or Chromium was not found; pass --chrome");
}

function findChrome(explicitPath) {
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
  throw new Error(`Chrome DevTools connection failed: ${lastError?.message ?? url}`);
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

  async evaluate(expression) {
    const response = await this.call("Runtime.evaluate", {
      awaitPromise: true,
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

async function startBrowser(chromePath, origin) {
  const profileDirectory = await mkdtemp(path.join(os.tmpdir(), "afk-wiki-media-"));
  const port = await getFreePort();
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${path.join(profileDirectory, "profile")}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  try {
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
        await rm(profileDirectory, { force: true, recursive: true });
      },
    };
  } catch (error) {
    chrome.kill("SIGTERM");
    await rm(profileDirectory, { force: true, recursive: true });
    throw error;
  }
}

async function initializeRuntime(cdp, release) {
  const expression = `(async () => {
    await System.import(${JSON.stringify(release.scriptPackageUrl)});
    const settings = ${JSON.stringify(release.settings)};
    cc.assetManager.init(settings.assets);
    const loadBundle = (name) => new Promise((resolve, reject) => {
      const existing = cc.assetManager.getBundle(name);
      if (existing) return resolve(existing);
      cc.assetManager.loadBundle(name, (error, bundle) => error ? reject(error) : resolve(bundle));
    });
    for (const name of ["resources", "main", "PatchResource"]) await loadBundle(name);
    const appVersionModule = await System.import("chunks:///_virtual/AppVersion.ts");
    const bundle = cc.assetManager.getBundle("PatchResource");

    const load = (assetPath, type) => new Promise((resolve, reject) => {
      bundle.load(assetPath, type, (error, asset) => error ? reject(error) : resolve(asset));
    });

    globalThis.__AFK_WIKI_MEDIA = {
      appVersion: appVersionModule.APP_VERSION,
      async extract(sourcePath) {
        const spriteFrame = await load(sourcePath + "/spriteFrame", cc.SpriteFrame);
        const texture = spriteFrame.texture;
        const imageAsset = texture.image;
        const image = imageAsset.data;
        if (!image) throw new Error("Image data unavailable: " + sourcePath);
        const rect = spriteFrame.rect;
        const original = spriteFrame.originalSize;
        const offset = spriteFrame.offset;
        const sourceWidth = image.naturalWidth || image.videoWidth || image.width;
        const sourceHeight = image.naturalHeight || image.videoHeight || image.height;
        const rotated = Boolean(spriteFrame.rotated);
        const wholeTexture = rect.x === 0 && rect.y === 0 && rect.width === sourceWidth &&
          rect.height === sourceHeight && original.width === sourceWidth && original.height === sourceHeight &&
          !rotated;
        const nativeUrl = imageAsset.nativeUrl || imageAsset._nativeUrl || "";
        if (wholeTexture && /\\.png(?:[?#]|$)/i.test(nativeUrl)) {
          return { height: sourceHeight, mode: "original", nativeUrl, width: sourceWidth };
        }

        const canvas = document.createElement("canvas");
        canvas.width = original.width;
        canvas.height = original.height;
        const context = canvas.getContext("2d");
        const frameWidth = rect.width;
        const frameHeight = rect.height;
        const targetX = (original.width - frameWidth) / 2 + offset.x;
        const targetY = (original.height - frameHeight) / 2 - offset.y;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (rotated) {
          context.save();
          context.translate(targetX, targetY + frameHeight);
          context.rotate(-Math.PI / 2);
          context.drawImage(image, rect.x, rect.y, rect.height, rect.width,
            0, 0, rect.height, rect.width);
          context.restore();
        } else {
          context.drawImage(image, rect.x, rect.y, rect.width, rect.height,
            targetX, targetY, rect.width, rect.height);
        }
        return {
          dataUrl: canvas.toDataURL("image/png"),
          height: canvas.height,
          mode: "sprite-crop",
          nativeUrl,
          width: canvas.width,
        };
      },
    };
    return JSON.stringify({ appVersion: appVersionModule.APP_VERSION });
  })()`;
  return JSON.parse(await cdp.evaluate(expression));
}

async function extractImage(cdp, sourcePath, origin) {
  const result = JSON.parse(await cdp.evaluate(
    `(async () => JSON.stringify(await globalThis.__AFK_WIKI_MEDIA.extract(${JSON.stringify(sourcePath)})))()`,
  ));
  let bytes;
  if (result.mode === "original") {
    const response = await fetch(new URL(result.nativeUrl, origin));
    if (!response.ok) throw new Error(`${response.status} fetching ${result.nativeUrl}`);
    bytes = Buffer.from(await response.arrayBuffer());
  } else {
    const match = result.dataUrl?.match(/^data:image\/png;base64,(.+)$/);
    if (!match) throw new Error(`Invalid canvas result for ${sourcePath}`);
    bytes = Buffer.from(match[1], "base64");
  }
  return { ...result, bytes };
}

function inspectPng(bytes) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
    throw new Error("Downloaded asset is not a PNG");
  }
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`PNG exceeds ${MAX_IMAGE_BYTES} bytes`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width === 0 || height === 0 || width > 8192 || height > 8192) {
    throw new Error(`Invalid PNG dimensions: ${width}x${height}`);
  }
  return { height, width };
}

async function readRows(root, slug) {
  const payload = JSON.parse(await readFile(path.join(root, "assets", "data", "raw", `${slug}.json`), "utf8"));
  if (!Array.isArray(payload.rows)) throw new Error(`${slug}.json has no rows array`);
  return payload.rows;
}

function entityReferences(skills, items) {
  return [
    ...skills.filter((row) => row.iconPath).map((row) => ({
      entityType: "skill",
      id: row.id,
      sourcePath: row.iconPath,
      sourceLabel: row.nameKey,
    })),
    ...items.filter((row) => row.icon).map((row) => ({
      entityType: "item",
      id: row.id,
      sourcePath: row.icon,
      sourceLabel: row.name,
    })),
  ].sort((left, right) =>
    left.entityType.localeCompare(right.entityType) ||
    Number(left.id) - Number(right.id) ||
    String(left.id).localeCompare(String(right.id))
  );
}

async function publish(stageDirectory, liveDirectory) {
  const backupDirectory = `${stageDirectory}.backup`;
  let hadLive = true;
  try {
    await rename(liveDirectory, backupDirectory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    hadLive = false;
  }
  try {
    await rename(stageDirectory, liveDirectory);
  } catch (error) {
    if (hadLive) await rename(backupDirectory, liveDirectory);
    throw error;
  }
  if (hadLive) await rm(backupDirectory, { force: true, recursive: true });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();

  const [manifest, skills, items, release] = await Promise.all([
    readFile(path.join(options.root, "assets", "data", "manifest.json"), "utf8").then(JSON.parse),
    readRows(options.root, "skill"),
    readRows(options.root, "item"),
    resolveRelease(options.origin),
  ]);
  if (manifest.patch !== release.patchVersion || manifest.sourceConfig !== release.patchConfigUrl) {
    throw new Error(
      `Raw data/live release mismatch: raw ${manifest.patch}, live ${release.patchVersion}; re-extract raw data first`,
    );
  }

  const imageParent = path.join(options.root, "assets", "images");
  await mkdir(imageParent, { recursive: true });
  const stageDirectory = await mkdtemp(path.join(imageParent, ".game-stage-"));
  const liveDirectory = path.join(imageParent, "game");
  let published = false;
  let browser;
  try {
    await mkdir(path.join(stageDirectory, "skills"));
    await mkdir(path.join(stageDirectory, "items"));
    browser = await startBrowser(await findChrome(options.chrome), release.origin);
    const runtime = await initializeRuntime(browser.cdp, release);
    if (runtime.appVersion !== manifest.appVersion) {
      throw new Error(`Raw data/live app mismatch: raw ${manifest.appVersion}, live ${runtime.appVersion}`);
    }

    const references = entityReferences(skills, items);
    const uniqueSources = [...new Set(references.map((entry) => entry.sourcePath))].sort();
    const extracted = new Map();
    for (let index = 0; index < uniqueSources.length; index += 1) {
      const sourcePath = uniqueSources[index];
      const image = await extractImage(browser.cdp, sourcePath, release.origin);
      const dimensions = inspectPng(image.bytes);
      if (dimensions.width !== image.width || dimensions.height !== image.height) {
        throw new Error(`PNG/runtime dimension mismatch for ${sourcePath}`);
      }
      extracted.set(sourcePath, {
        bytes: image.bytes,
        height: dimensions.height,
        mode: image.mode,
        nativeUrl: image.nativeUrl,
        sha256: createHash("sha256").update(image.bytes).digest("hex"),
        width: dimensions.width,
      });
      console.log(`[${index + 1}/${uniqueSources.length}] ${sourcePath}`);
    }

    const entries = [];
    for (const reference of references) {
      const image = extracted.get(reference.sourcePath);
      const directory = reference.entityType === "skill" ? "skills" : "items";
      const outputPath = `/assets/images/game/${directory}/${reference.id}.png`;
      await writeFile(path.join(stageDirectory, directory, `${reference.id}.png`), image.bytes);
      entries.push({
        appVersion: manifest.appVersion,
        bytes: image.bytes.length,
        entityType: reference.entityType,
        height: image.height,
        id: reference.id,
        mode: image.mode,
        outputPath,
        patch: manifest.patch,
        sha256: image.sha256,
        sourceConfig: manifest.sourceConfig,
        sourceLabel: reference.sourceLabel,
        sourcePath: reference.sourcePath,
        sourceUrl: image.nativeUrl,
        width: image.width,
      });
    }

    const mediaManifest = {
      appVersion: manifest.appVersion,
      counts: {
        enhancementItems: entries.filter((entry) =>
          entry.entityType === "item" && /(?:^|\/)item_enhance_/i.test(entry.sourcePath)
        ).length,
        items: entries.filter((entry) => entry.entityType === "item").length,
        skills: entries.filter((entry) => entry.entityType === "skill").length,
        total: entries.length,
        uniqueSources: uniqueSources.length,
      },
      entries,
      origin: release.origin,
      patch: manifest.patch,
      sourceConfig: manifest.sourceConfig,
    };
    await writeFile(path.join(stageDirectory, "manifest.json"), `${JSON.stringify(mediaManifest, null, 2)}\n`);

    for (const entry of entries) {
      const bytes = await readFile(path.join(stageDirectory, entry.outputPath.replace("/assets/images/game/", "")));
      const dimensions = inspectPng(bytes);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== entry.sha256 || dimensions.width !== entry.width || dimensions.height !== entry.height) {
        throw new Error(`Staged verification failed: ${entry.outputPath}`);
      }
    }

    await browser.close();
    browser = undefined;
    await publish(stageDirectory, liveDirectory);
    published = true;
    console.log(
      `Media extraction complete: ${mediaManifest.counts.skills} skills, ` +
      `${mediaManifest.counts.items} items (${mediaManifest.counts.enhancementItems} enhancement), ` +
      `${mediaManifest.counts.uniqueSources} unique source images.`,
    );
  } finally {
    if (browser) await browser.close();
    if (!published) await rm(stageDirectory, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
