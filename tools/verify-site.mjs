#!/usr/bin/env node

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [siteDirectoryArgument, basePathArgument = "/afk-wiki"] = process.argv.slice(2);
if (!siteDirectoryArgument) {
  console.error("Usage: node tools/verify-site.mjs <site-directory> [base-path]");
  process.exit(2);
}

const siteDirectory = path.resolve(siteDirectoryArgument);
const basePath = `/${basePathArgument.replace(/^\/+|\/+$/g, "")}`.replace(/\/$/, "") || "/";
const origin = "https://pages-validation.invalid";
const errors = [];
let checkedLinks = 0;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(entryPath);
  }
  return files;
}

function pageUrl(filePath) {
  const relativePath = path.relative(siteDirectory, filePath).split(path.sep).join("/");
  const cleanPath = relativePath === "index.html"
    ? "/"
    : relativePath.endsWith("/index.html")
      ? `/${relativePath.slice(0, -"index.html".length)}`
      : `/${relativePath}`;
  return new URL(`${basePath}${cleanPath}`, origin);
}

async function targetExists(url) {
  let relativeTarget = decodeURIComponent(url.pathname.slice(basePath.length)).replace(/^\/+/, "");
  if (relativeTarget === "") relativeTarget = "index.html";
  const target = path.resolve(siteDirectory, relativeTarget);
  if (!target.startsWith(`${siteDirectory}${path.sep}`) && target !== siteDirectory) return false;
  if (await exists(target)) return true;
  if (url.pathname.endsWith("/")) return exists(path.join(target, "index.html"));
  return exists(path.join(target, "index.html"));
}

async function main() {
  if (!await exists(siteDirectory)) throw new Error(`site directory does not exist: ${siteDirectory}`);
  const htmlFiles = await listHtmlFiles(siteDirectory);
  if (htmlFiles.length === 0) throw new Error(`no HTML files found in ${siteDirectory}`);

  for (const filePath of htmlFiles) {
    const html = await readFile(filePath, "utf8");
    const source = path.relative(siteDirectory, filePath);
    const urlPattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
    for (const match of html.matchAll(urlPattern)) {
      const rawUrl = match[2].trim();
      if (!rawUrl || rawUrl.startsWith("#") || /^(?:data|javascript|mailto|tel):/i.test(rawUrl)) continue;

      let resolved;
      try {
        resolved = new URL(rawUrl, pageUrl(filePath));
      } catch {
        errors.push(`${source}: invalid URL ${JSON.stringify(rawUrl)}`);
        continue;
      }
      if (resolved.origin !== origin) continue;
      checkedLinks += 1;
      if (basePath !== "/" && !resolved.pathname.startsWith(`${basePath}/`) && resolved.pathname !== basePath) {
        errors.push(`${source}: ${rawUrl} omits the project base path ${basePath}`);
        continue;
      }
      if (!await targetExists(resolved)) errors.push(`${source}: broken internal URL ${rawUrl}`);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Link validation passed: ${htmlFiles.length} HTML files, ${checkedLinks} internal URLs, base path ${basePath}.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
