#!/usr/bin/env node

// 개체별 낱장 페이지 생성기.
// 파생 데이터에서 무공·아이템·몬스터·지역 한 개체마다 한 장을 만든다.
// 내부 식별자(고유번호, 스키마명, seedGroup, 내부 키)는 페이지에 내보내지 않는다.

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const TOOLS_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(TOOLS_DIRECTORY, "..");

const SECTIONS = {
  skill: { dir: "무공", title: "무공", eyebrow: "무공 낱장" },
  item: { dir: "아이템", title: "아이템", eyebrow: "아이템 낱장" },
  monster: { dir: "몬스터", title: "몬스터", eyebrow: "몬스터 낱장" },
  zone: { dir: "지역", title: "지역", eyebrow: "지역 낱장" },
};

const GRADE_KEYS = ["Normal", "Rare", "Epic", "Unique", "Legendary"];
const CAST_LABELS = { Active: "발동형", Passive: "상시형" };
const BODY_LABELS = { Beast: "짐승", Human: "사람", Object: "사물" };
const MAIN_TYPE_FALLBACK = { Consumable: "소모품" };
const SUB_TYPE_FALLBACK = {
  Avatar: "역용",
  Face: "얼굴",
  FaceTicket: "역용부 · 얼굴",
  HairTicket: "역용부 · 머리",
  TradeCoin: "교환패",
};
const USE_TYPE_LABELS = { Heal: "생명력 회복" };

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--root") options.root = path.resolve(argv[++index]);
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const derived = (root, name) => readJson(path.join(root, "assets", "data", "derived", `${name}.json`));
const raw = (root, name) => readJson(path.join(root, "assets", "data", "raw", `${name}.json`));

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const frontMatterString = (value) => `"${String(value ?? "").replace(/\s+/g, " ").replace(/"/g, "'").trim()}"`;

const slugify = (value) => String(value)
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[^\p{Letter}\p{Number}-]/gu, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

const number = (value) => Number(value).toLocaleString("ko-KR");

const levelBand = (level) => Math.floor(Math.max(0, level - 1) / 10) * 10;
const bandLabel = (level) => `${levelBand(level) + 1}~${levelBand(level) + 10}레벨`;
const levelRangeLabel = (minimum, maximum) => {
  if (minimum === null || minimum === undefined || maximum === null || maximum === undefined) return "몬스터 미기록";
  return minimum === maximum ? `${number(minimum)}레벨` : `${number(minimum)}~${number(maximum)}레벨`;
};
const respawnLabel = (minimum, maximum) => {
  if (!(maximum > 0)) return "";
  const seconds = (value) => Number((value / 1000).toFixed(1)).toLocaleString("ko-KR");
  return minimum === maximum
    ? `${seconds(maximum)}초 뒤 다시 나타남`
    : `${seconds(minimum)}~${seconds(maximum)}초 뒤 다시 나타남`;
};
const isCutsceneZone = (zone) => zone.name.startsWith("연출_") || zone.name === "마지막 연출";

// 배포본이 쓰는 표시 나눗값을 그대로 적용한다.
const makeValueFormatter = (attributeList) => {
  const meta = new Map(attributeList.map((entry) => [entry.key, entry]));
  const normalize = (key) => key.replace(/[^A-Za-z]/g, "").toUpperCase();
  const normalized = new Map(attributeList.map((entry) => [normalize(entry.key), entry]));
  const resolve = (key) => {
    if (meta.has(key)) return meta.get(key);
    if (key.endsWith("%")) {
      const base = key.slice(0, -1);
      if (meta.has(`${base}_PER`)) return meta.get(`${base}_PER`);
      if (meta.has(base)) return meta.get(base);
    }
    return normalized.get(normalize(key)) ?? null;
  };
  // 나눗값은 플레이어 능력치 표시에서 확인된 규칙이라 아이템 값에만 적용한다.
  // 몬스터·무공 표의 값은 대응되는 표시 경로를 확인하지 못했으므로 원본 그대로 둔다.
  return (key, value, { scale = false } = {}) => {
    if (value === null || value === undefined) return "—";
    const divisor = resolve(key)?.divisor ?? 0;
    if (scale && divisor > 0) return `${Number((value / divisor).toFixed(2)).toLocaleString("ko-KR")}%`;
    return number(value);
  };
};

const rewardPoolLabel = (key) => {
  const cook = /^Cook_Gacha_Lv(\d+)$/.exec(key);
  if (cook) return `요리 ${cook[1]}레벨 결과`;
  if (key === "SkillGacha_Normal") return "무공 뽑기";
  if (key === "FaceGacha_Normal") return "얼굴 뽑기";
  if (key === "HairGacha_Normal") return "머리 뽑기";
  return "보상 꾸러미";
};

const percentText = (percent) => {
  if (percent === null || percent === undefined) return "—";
  if (percent >= 10) return `${percent.toFixed(1)}%`;
  if (percent >= 1) return `${percent.toFixed(2)}%`;
  if (percent >= 0.01) return `${percent.toFixed(3)}%`;
  return `${percent.toFixed(4)}%`;
};

// 같은 또래 안에서 이 값이 몇 번째인지. 위키가 흔히 주지 못하는 맥락이다.
// 값 하나만 있는 표는 크고 작음을 판단할 기준을 독자에게 떠넘긴다.
const makeRanker = (values) => {
  const total = values.length;
  const max = Math.max(0, ...values);
  return (value) => {
    if (!(max > 0) || total === 0) return { share: 0, rank: null, total };
    const rank = values.reduce((count, entry) => (entry > value ? count + 1 : count), 1);
    return { share: Math.max(3, Math.round((value / max) * 100)), rank, total };
  };
};

const rankNote = (rank, total, cohort) =>
  rank === null || total < 3 ? "" : `${cohort} ${total}종 중 ${rank}위`;

const seal = (character, gradeKey) =>
  `<span class="leaf-seal" data-grade="${escapeHtml(gradeKey)}" aria-hidden="true">${escapeHtml(character)}</span>`;

const leafHeader = ({ sealCharacter, gradeKey, eyebrow, name, image, alt, description, badges = [] }) => `
<header class="leaf-head" data-grade="${escapeHtml(gradeKey)}">
  ${sealCharacter ? seal(sealCharacter, gradeKey) : ""}
  <div class="leaf-head__body">
    <p class="leaf-eyebrow">${eyebrow.map((part) => escapeHtml(part)).join(" <span aria-hidden=\"true\">·</span> ")}</p>
    <h1 class="leaf-name">${escapeHtml(name)}</h1>
    ${description ? `<p class="leaf-lede">${description}</p>` : ""}
    ${badges.length > 0 ? `<p class="leaf-badges">${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</p>` : ""}
  </div>
  ${image ? `<figure class="leaf-portrait"><img src="{{ '${image}' | relative_url }}" alt="${escapeHtml(alt)}" width="96" height="96" loading="eager" decoding="async"></figure>` : ""}
</header>`;

const statStrip = (entries) => {
  const rows = entries.filter((entry) => entry && entry.value !== null && entry.value !== undefined && entry.value !== "");
  if (rows.length === 0) return "";
  return `
<dl class="leaf-strip">
  ${rows.map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}${entry.unit ? `<small>${escapeHtml(entry.unit)}</small>` : ""}</dd></div>`).join("\n  ")}
</dl>`;
};

const barRows = (rows) => `
<ul class="leaf-bars">
  ${rows.map((row) => `<li>
    <span class="leaf-bars__label">${escapeHtml(row.label)}</span>
    <span class="leaf-bars__track"><span class="leaf-bars__fill" style="width:${row.share}%"></span></span>
    <span class="leaf-bars__value">${escapeHtml(row.value)}</span>
    ${row.note ? `<span class="leaf-bars__note">${escapeHtml(row.note)}</span>` : "<span class=\"leaf-bars__note\"></span>"}
  </li>`).join("\n  ")}
</ul>`;

const section = (title, body, note) => body
  ? `
<section class="leaf-section">
  <h2>${escapeHtml(title)}</h2>
  ${note ? `<p class="leaf-note">${note}</p>` : ""}
  ${body}
</section>`
  : "";

// 견줄 대상이 없는 값에까지 막대를 그리면 막대가 정보를 잃는다.
const factList = (rows) => `
<dl class="leaf-facts">
  ${rows.map((row) => `<div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join("\n  ")}
</dl>`;

const emptyState = (message) => `<p class="leaf-empty">${escapeHtml(message)}</p>`;

const linkCards = (entries) => entries.length === 0 ? "" : `
<ul class="leaf-links">
  ${entries.map((entry) => `<li><a href="{{ '${entry.url}' | relative_url }}">
    ${entry.image ? `<img src="{{ '${entry.image}' | relative_url }}" alt="" width="40" height="40" loading="lazy" decoding="async">` : `<span class="leaf-links__seal" data-grade="${escapeHtml(entry.gradeKey ?? "")}" aria-hidden="true">${escapeHtml(entry.sealCharacter ?? "")}</span>`}
    <span><strong>${escapeHtml(entry.name)}</strong>${entry.meta ? `<small>${escapeHtml(entry.meta)}</small>` : ""}</span>
  </a></li>`).join("\n  ")}
</ul>`;

const sourceList = (entries) => entries.length === 0 ? "" : `
<ul class="leaf-sources">
  ${entries.map((entry) => `<li>
    ${entry.url ? `<a href="{{ '${entry.url}' | relative_url }}">${escapeHtml(entry.title)}</a>` : `<span>${escapeHtml(entry.title)}</span>`}
    <em>${escapeHtml(entry.detail)}</em>
  </li>`).join("\n  ")}
</ul>`;

function pageFile({ kind, slug, title, description, body, extra = {} }) {
  const meta = SECTIONS[kind];
  const front = [
    "---",
    `title: ${frontMatterString(title)}`,
    "layout: entity",
    `permalink: /docs/${meta.dir}/${slug}/`,
    `parent_title: ${frontMatterString(meta.title)}`,
    `parent_url: /docs/${meta.dir}/`,
    `description: ${frontMatterString(description)}`,
    ...Object.entries(extra).map(([key, value]) => `${key}: ${frontMatterString(value)}`),
    "---",
    "",
  ].join("\n");
  return `${front}${body.trim()}\n`;
}

async function main() {
  const { root } = parseArgs(process.argv.slice(2));
  const [
    manifest, skills, items, monsters, zones, dropSeeds, dropWeights, acquisitions,
    collections, cookingLevels, skillEnhancements, attributeList, itemStrings, shopProducts, itemUses, skillStrings,
  ] = await Promise.all([
    readJson(path.join(root, "assets", "data", "manifest.json")),
    derived(root, "skill-codex"),
    derived(root, "item-codex"),
    derived(root, "monster-codex"),
    derived(root, "zone-atlas"),
    derived(root, "monster-drop-seeds"),
    derived(root, "item-drop-weights"),
    derived(root, "item-acquisition-probabilities"),
    derived(root, "collection-codex"),
    derived(root, "cooking-levels"),
    derived(root, "skill-enhancement-probabilities"),
    raw(root, "attribute-list"),
    raw(root, "string-item-ko"),
    raw(root, "shop-product"),
    raw(root, "item-use"),
    raw(root, "string-skill-ko"),
  ].map((value) => Promise.resolve(value).then((resolved) => resolved.rows ?? resolved)));

  const strings = new Map(itemStrings.map((entry) => [entry.key, entry.value]));
  const formatValue = makeValueFormatter(attributeList);

  const koreanAttribute = new Map(
    (await raw(root, "string-attribute-list-ko")).rows.map((entry) => [entry.key, entry.value]),
  );
  const rawAttributeLabel = (key) => {
    const direct = koreanAttribute.get(`Attribute_${key}`);
    if (direct) return direct;
    if (key.endsWith("%")) {
      const base = key.slice(0, -1);
      return koreanAttribute.get(`Attribute_${base}_PER`) ?? koreanAttribute.get(`Attribute_${base}`) ?? base;
    }
    const compact = key.replace(/[^A-Za-z]/g, "").toUpperCase();
    for (const [stringKey, value] of koreanAttribute) {
      if (stringKey.replace(/^Attribute_/, "").replace(/[^A-Za-z]/g, "").toUpperCase() === compact) return value;
    }
    return key;
  };
  const attributeLabel = (key) => rawAttributeLabel(key).replace(/%$/, "");

  const gradeLabel = (grade) => (GRADE_KEYS.includes(grade) ? strings.get(`GradeType_${grade}`) ?? grade : "");
  const gradeKey = (grade) => (GRADE_KEYS.includes(grade) ? grade.toLowerCase() : "none");
  const mainTypeLabel = (value) =>
    strings.get(`ItemMainType_${value}`) ?? strings.get(`ItemMainType_${value[0]}${value.slice(1).toLowerCase()}`)
    ?? MAIN_TYPE_FALLBACK[value] ?? "";
  const subTypeLabel = (value) =>
    strings.get(`ItemSubType_${value}`) ?? SUB_TYPE_FALLBACK[value] ?? "";

  const outputRoot = path.join(root, "docs");
  const registry = { skill: [], item: [], monster: [], zone: [] };

  /* ── 무공 ──────────────────────────────────────────────── */
  const factionStrings = new Map(skillStrings.map((entry) => [entry.key, entry.value]));
  const factionLabel = (value) => (value ? factionStrings.get(value) ?? "" : "");
  const skillPages = [];
  const multiplierValues = skills.map((skill) => skill.maxAtkMultiplierRaw ?? 0);
  const rankMultiplier = makeRanker(multiplierValues.filter((value) => value > 0));
  const usedSkillSlugs = new Map();

  for (const skill of skills) {
    const slugBase = slugify(skill.name);
    const count = (usedSkillSlugs.get(slugBase) ?? 0) + 1;
    usedSkillSlugs.set(slugBase, count);
    const slug = count === 1 ? slugBase : `${slugBase}-${count}`;
    skillPages.push({ skill, slug });
  }
  const skillBySlug = new Map(skillPages.map((entry) => [entry.skill.name, entry.slug]));
  const skillsByFaction = new Map();
  for (const entry of skillPages) {
    const key = entry.skill.factionType || "";
    skillsByFaction.set(key, [...(skillsByFaction.get(key) ?? []), entry]);
  }

  for (const { skill, slug } of skillPages) {
    const eyebrow = [factionLabel(skill.factionType), CAST_LABELS[skill.castType] ?? "", subTypeLabel(
      skill.weaponType === "HIDDEN" ? "Hidden" : skill.weaponType,
    )].filter(Boolean);
    const description = escapeHtml(skill.description)
      .replace(/\{\d+\}/g, "<span class=\"leaf-slot\" title=\"레벨에 따라 채워지는 수치\">…</span>");

    const level1 = skill.level1AtkMultiplierRaw ? skill.level1AtkMultiplierRaw / 100 : null;
    const levelMax = skill.maxAtkMultiplierRaw ? skill.maxAtkMultiplierRaw / 100 : null;
    const maxRank = rankMultiplier(skill.maxAtkMultiplierRaw);
    const growth = levelMax
      ? barRows([{
        label: "최대 레벨",
        share: maxRank.share,
        value: `${number(Math.round(levelMax))}%`,
        note: rankNote(maxRank.rank, maxRank.total, "공격 무공"),
      }, {
        label: "1레벨",
        share: rankMultiplier(skill.level1AtkMultiplierRaw).share,
        value: `${number(Math.round(level1))}%`,
        note: levelMax && level1 ? `최대까지 ${(levelMax / level1).toFixed(1)}배` : "",
      }])
      : "";

    const stats = skill.statRanges.length > 0
      ? factList(skill.statRanges.map((range) => ({
        label: rawAttributeLabel(range.key),
        value: `${formatValue(range.key, range.min)} ~ ${formatValue(range.key, range.max)}`,
      })))
      : "";

    const gacha = skill.skillGachaPercent !== null
      ? `<p class="leaf-figure"><strong>${percentText(skill.skillGachaPercent)}</strong><span>무공 뽑기 한 번에서 이 무공이 나올 확률</span></p>`
      : emptyState("이 배포본의 계산 가능한 뽑기에는 이 무공이 들어 있지 않습니다.");

    const siblings = (skillsByFaction.get(skill.factionType || "") ?? [])
      .filter((entry) => entry.slug !== slug)
      .slice(0, 8)
      .map((entry) => ({
        url: `/docs/무공/${entry.slug}/`,
        image: entry.skill.image || "",
        name: entry.skill.name,
        meta: [gradeLabel(entry.skill.grade), CAST_LABELS[entry.skill.castType]].filter(Boolean).join(" · "),
        gradeKey: gradeKey(entry.skill.grade),
        sealCharacter: gradeLabel(entry.skill.grade),
      }));

    const body = [
      leafHeader({
        sealCharacter: gradeLabel(skill.grade) || "무",
        gradeKey: gradeKey(skill.grade),
        eyebrow: eyebrow.length > 0 ? eyebrow : ["무공"],
        name: skill.name,
        image: skill.image,
        alt: `${skill.name} 아이콘`,
        description,
      }),
      statStrip([
        { label: "재사용 대기시간", value: skill.cooldownSeconds ? number(skill.cooldownSeconds) : null, unit: "초" },
        { label: "소모 정신력", value: skill.spCost ? number(skill.spCost) : null },
        { label: "사거리", value: skill.range ? number(skill.range) : null },
        { label: "연속 타격", value: skill.hitCount ? number(skill.hitCount) : null, unit: "타" },
        { label: "최대 레벨", value: skill.maxLevel ? number(skill.maxLevel) : null },
      ]),
      section("공격 배율", growth, "레벨을 올리면 오르는 피해량입니다. 막대는 공격 무공끼리 견준 것입니다."),
      section("무공이 주는 능력치", stats, stats ? "1레벨에서 최대 레벨까지의 범위이며, 배포본에 적힌 값 그대로입니다." : ""),
      section("익히는 법", gacha),
      section("수련", `<p class="leaf-note">같은 무공을 재료로 단계를 올립니다. 목표 단계별 성공률과 은량은 <a href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">무공 강화 확률</a>에 정리돼 있습니다. 1단계 성공률은 ${skillEnhancements[0]?.successPercent ?? "—"}%, 마지막 ${skillEnhancements.length}단계는 ${skillEnhancements.at(-1)?.successPercent ?? "—"}%입니다.</p>`),
      section(`${factionLabel(skill.factionType) || "같은 갈래"}의 다른 무공`, linkCards(siblings)),
    ].join("\n");

    registry.skill.push({ slug, skill });
    await queueWrite(outputRoot, "무공", slug, pageFile({
      kind: "skill",
      slug,
      title: skill.name,
      description: `${eyebrow.join(" · ")} 무공. 재사용 대기시간, 공격 배율과 익히는 법.`,
      body,
    }));
  }

  /* ── 아이템 ────────────────────────────────────────────── */
  const itemById = new Map(items.map((item) => [item.id, item]));
  const groupKey = (item) => JSON.stringify([
    item.name, item.grade, item.mainType, item.subType, item.slotType, item.tradable,
    item.description, item.attributes,
  ]);
  const itemGroups = new Map();
  for (const item of items) {
    const key = groupKey(item);
    itemGroups.set(key, [...(itemGroups.get(key) ?? []), item]);
  }
  const gradesByName = new Map();
  for (const group of itemGroups.values()) {
    const [first] = group;
    gradesByName.set(first.name, new Set([...(gradesByName.get(first.name) ?? []), first.grade]));
  }

  const itemPages = [];
  const usedItemSlugs = new Map();
  for (const group of itemGroups.values()) {
    const [first] = group;
    const needsGrade = (gradesByName.get(first.name)?.size ?? 1) > 1 && gradeLabel(first.grade);
    const base = slugify(needsGrade ? `${first.name} ${gradeLabel(first.grade)}` : first.name);
    const count = (usedItemSlugs.get(base) ?? 0) + 1;
    usedItemSlugs.set(base, count);
    itemPages.push({ group, first, slug: count === 1 ? base : `${base}-${count}` });
  }
  const itemSlugById = new Map();
  for (const page of itemPages) for (const item of page.group) itemSlugById.set(item.id, page.slug);

  const dropWeightsByItem = new Map();
  const dropWeightsBySeed = new Map();
  for (const row of dropWeights) {
    dropWeightsByItem.set(row.itemId, [...(dropWeightsByItem.get(row.itemId) ?? []), row]);
    dropWeightsBySeed.set(row.seedGroup, [...(dropWeightsBySeed.get(row.seedGroup) ?? []), row]);
  }
  const monstersBySeed = new Map();
  const dropSeedsByMonster = new Map();
  for (const row of dropSeeds) {
    monstersBySeed.set(row.seedGroup, [...(monstersBySeed.get(row.seedGroup) ?? []), row]);
    dropSeedsByMonster.set(row.monsterId, [...(dropSeedsByMonster.get(row.monsterId) ?? []), row]);
  }
  const acquisitionsByItem = new Map();
  for (const row of acquisitions) {
    acquisitionsByItem.set(row.itemId, [...(acquisitionsByItem.get(row.itemId) ?? []), row]);
  }
  const collectionsByItem = new Map();
  for (const collection of collections) {
    for (const registration of collection.registrations) {
      collectionsByItem.set(registration.targetId, [
        ...(collectionsByItem.get(registration.targetId) ?? []),
        { collection, registration },
      ]);
    }
  }
  const cookRewardByItem = new Map();
  for (const level of cookingLevels) {
    cookRewardByItem.set(level.rewardItemId, [...(cookRewardByItem.get(level.rewardItemId) ?? []), level]);
  }
  const shopByItem = new Map();
  for (const product of shopProducts) {
    if (!product.active) continue;
    shopByItem.set(product.itemId, [...(shopByItem.get(product.itemId) ?? []), product]);
  }
  const useByItem = new Map(itemUses.map((entry) => [entry.itemId, entry]));

  // 몬스터나 NPC가 기록된 곳만 낱장으로 내고, 연출용 지역은 일반 사냥터와 구분한다.
  const pageZones = zones.filter((zone) => zone.monsterCount > 0 || zone.npcCount > 0);
  const zoneNameCounts = new Map();
  for (const zone of pageZones) zoneNameCounts.set(zone.name, (zoneNameCounts.get(zone.name) ?? 0) + 1);

  const usedZoneSlugs = new Map();
  const zonePages = pageZones.map((zone) => {
    const duplicated = (zoneNameCounts.get(zone.name) ?? 0) > 1;
    const levelSuffix = zone.monsterLevelMin === zone.monsterLevelMax
      ? `${zone.monsterLevelMin}레벨`
      : `${zone.monsterLevelMin}-${zone.monsterLevelMax}레벨`;
    const disambiguator = duplicated && zone.monsterLevelMin !== null
      ? ` ${levelSuffix}`
      : duplicated && zone.regionName
        ? ` ${zone.regionName}`
        : "";
    const base = slugify(`${zone.name}${disambiguator}`);
    const count = (usedZoneSlugs.get(base) ?? 0) + 1;
    usedZoneSlugs.set(base, count);
    return { zone, slug: count === 1 ? base : `${base}-${count}` };
  });
  const zoneSlugById = new Map(zonePages.map(({ zone, slug }) => [zone.id, slug]));
  const zonePagesByMonster = new Map();
  for (const page of zonePages) {
    for (const monster of page.zone.monsters) {
      zonePagesByMonster.set(monster.id, [...(zonePagesByMonster.get(monster.id) ?? []), page]);
    }
  }

  // 능력치 막대는 같은 부위 안에서 견준다.
  const attributeCohort = new Map();
  for (const item of items) {
    for (const attribute of item.attributes) {
      const key = `${item.subType}:${attribute.key}`;
      attributeCohort.set(key, [...(attributeCohort.get(key) ?? []), attribute.value]);
    }
  }
  const cohortRankers = new Map();
  for (const [key, values] of attributeCohort) cohortRankers.set(key, makeRanker(values));

  const itemsBySubType = new Map();
  for (const page of itemPages) {
    const key = page.first.subType;
    itemsBySubType.set(key, [...(itemsBySubType.get(key) ?? []), page]);
  }

  for (const { group, first, slug } of itemPages) {
    const ids = group.map((item) => item.id);
    const eyebrow = [mainTypeLabel(first.mainType), subTypeLabel(first.subType)].filter(Boolean);
    const sellPrices = [...new Set(group.map((item) => item.sellPrice))].sort((left, right) => left - right);
    const sellText = sellPrices.length > 1
      ? `${number(sellPrices[0])} ~ ${number(sellPrices.at(-1))}`
      : number(sellPrices[0]);

    const attributes = first.attributes.length > 0
      ? barRows(first.attributes.map((attribute) => {
        const ranker = cohortRankers.get(`${first.subType}:${attribute.key}`);
        const rank = ranker ? ranker(attribute.value) : { share: 100, rank: null, total: 0 };
        const cohortSize = attributeCohort.get(`${first.subType}:${attribute.key}`)?.length ?? 0;
        return {
          label: attributeLabel(attribute.key),
          share: rank.share,
          value: formatValue(attribute.key, attribute.value, { scale: true }),
          note: rankNote(rank.rank, cohortSize, `같은 ${subTypeLabel(first.subType) || "종류"}`),
        };
      }))
      : "";

    const use = useByItem.get(first.id);
    const drops = [];
    for (const id of ids) {
      for (const weight of dropWeightsByItem.get(id) ?? []) {
        for (const monster of monstersBySeed.get(weight.seedGroup) ?? []) {
          drops.push({ monster, share: weight.normalizedWeightSharePercent, amountMin: weight.amountMin, amountMax: weight.amountMax });
        }
      }
    }
    const dropByMonster = new Map();
    for (const drop of drops) {
      const current = dropByMonster.get(drop.monster.monsterId);
      if (!current || (drop.share ?? 0) > (current.share ?? 0)) dropByMonster.set(drop.monster.monsterId, drop);
    }
    const dropEntries = [...dropByMonster.values()]
      .sort((left, right) => (right.share ?? 0) - (left.share ?? 0) || left.monster.monsterLevel - right.monster.monsterLevel)
      .slice(0, 12)
      .map((drop) => ({
        url: `/docs/몬스터/${monsterSlug(drop.monster.monsterName, drop.monster.monsterLevel)}/`,
        title: `${drop.monster.monsterName} · ${drop.monster.monsterLevel}레벨`,
        detail: `${drop.monster.zoneName || "출현 지역 미기록"} · 후보 안에서 ${percentText(drop.share)}`,
      }));

    const zonePagesForItem = new Map();
    for (const drop of drops) {
      for (const page of zonePagesByMonster.get(drop.monster.monsterId) ?? []) {
        zonePagesForItem.set(page.slug, page);
      }
    }
    const zoneEntries = [...zonePagesForItem.values()]
      .sort((left, right) => (left.zone.monsterLevelMin ?? Number.MAX_SAFE_INTEGER) - (right.zone.monsterLevelMin ?? Number.MAX_SAFE_INTEGER)
        || left.zone.name.localeCompare(right.zone.name, "ko")
        || left.slug.localeCompare(right.slug, "ko"))
      .map(({ zone, slug: zoneSlug }) => ({
        url: `/docs/지역/${zoneSlug}/`,
        title: zone.name,
        detail: [
          levelRangeLabel(zone.monsterLevelMin, zone.monsterLevelMax),
          zone.regionName || "권역 미기록",
          "이 지역 몬스터의 드롭 후보",
        ].join(" · "),
      }));

    const rewardEntries = ids.flatMap((id) => acquisitionsByItem.get(id) ?? [])
      .sort((left, right) => right.percent - left.percent)
      .slice(0, 10)
      .map((row) => ({
        title: rewardPoolLabel(row.groupListKey),
        detail: `${percentText(row.percent)}${row.amountMax > 1 ? ` · ${row.amountMin}~${row.amountMax}개` : ""}`,
      }));

    const cookEntries = ids.flatMap((id) => cookRewardByItem.get(id) ?? []).map((level) => ({
      url: "/docs/data/derived/cooking-levels/",
      title: `요리 ${level.level}레벨 달성 보상`,
      detail: level.rewardAmount > 0 ? `${number(level.rewardAmount)}개` : "레벨 보상",
    }));

    const shopEntries = ids.flatMap((id) => shopByItem.get(id) ?? []).map((product) => ({
      title: "상점",
      detail: `${itemById.get(product.costItemId)?.name ?? "재화"} ${number(product.costAmount)}에 ${number(product.amount)}개`,
    }));

    const sources = [...zoneEntries, ...dropEntries, ...rewardEntries, ...cookEntries, ...shopEntries];
    const sourceBody = sources.length > 0
      ? sourceList(sources)
      : emptyState("이 배포본에는 이 아이템의 획득 경로가 기록돼 있지 않습니다.");

    const collectionEntries = ids.flatMap((id) => collectionsByItem.get(id) ?? []).map(({ collection, registration }) => ({
      title: collection.name,
      detail: [
        registration.enhanceLevel > 0 ? `+${registration.enhanceLevel} 이상` : null,
        registration.requiredCount > 1 ? `${registration.requiredCount}개` : null,
        collection.rewardAttributes.map((reward) => `${reward.label} ${formatValue(reward.key, reward.value, { scale: true })}`).join(" · "),
      ].filter(Boolean).join(" · "),
    }));

    const siblings = (itemsBySubType.get(first.subType) ?? [])
      .filter((page) => page.slug !== slug)
      .sort((left, right) => GRADE_KEYS.indexOf(left.first.grade) - GRADE_KEYS.indexOf(right.first.grade))
      .slice(0, 8)
      .map((page) => ({
        url: `/docs/아이템/${page.slug}/`,
        image: page.first.image || "",
        name: page.first.name,
        meta: gradeLabel(page.first.grade),
        gradeKey: gradeKey(page.first.grade),
        sealCharacter: gradeLabel(page.first.grade),
      }));

    const body = [
      leafHeader({
        sealCharacter: gradeLabel(first.grade) || "품",
        gradeKey: gradeKey(first.grade),
        eyebrow: eyebrow.length > 0 ? eyebrow : ["아이템"],
        name: first.name,
        image: first.image,
        alt: `${first.name} 아이콘`,
        description: escapeHtml(first.description).replace(/\n/g, "<br>"),
      }),
      statStrip([
        { label: "판매가", value: sellText, unit: "은량" },
        { label: "거래", value: first.tradable ? "가능" : "불가" },
        { label: "한 칸에", value: first.stack > 0 ? number(first.stack) : null, unit: "개" },
        use ? { label: USE_TYPE_LABELS[use.useType] ?? "사용 효과", value: number(use.useValue) } : null,
      ]),
      section("능력치", attributes),
      section("얻는 곳", sourceBody),
      section("도감", collectionEntries.length > 0 ? sourceList(collectionEntries) : ""),
      section(`같은 ${subTypeLabel(first.subType) || "종류"}`, linkCards(siblings)),
    ].join("\n");

    registry.item.push({ slug, first, group });
    await queueWrite(outputRoot, "아이템", slug, pageFile({
      kind: "item",
      slug,
      title: first.name,
      description: `${eyebrow.join(" · ")}. ${first.description || "능력치와 얻는 곳."}`,
      body,
    }));
  }

  /* ── 지역 ──────────────────────────────────────────────── */
  for (const { zone, slug } of zonePages) {
    const levelText = levelRangeLabel(zone.monsterLevelMin, zone.monsterLevelMax);
    const regionText = zone.regionName || "권역 미기록";
    const monsterEntries = [...zone.monsters]
      .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name, "ko"))
      .map((monster) => ({
        url: `/docs/몬스터/${monsterSlug(monster.name, monster.level)}/`,
        title: monster.name,
        detail: [
          `${number(monster.level)}레벨`,
          monster.boss ? "우두머리" : null,
          monster.experience === null || monster.experience === undefined
            ? "경험치 기록 없음"
            : `경험치 기록 ${number(monster.experience)}`,
          `동시에 ${number(monster.count)}마리`,
          respawnLabel(monster.respawnMin, monster.respawnMax),
        ].filter(Boolean).join(" · "),
      }));

    const npcEntries = [...zone.npcs]
      .sort((left, right) => left.name.localeCompare(right.name, "ko"))
      .map((npc) => ({
        title: npc.name,
        detail: npc.shopId > 0 ? "상점 이용 가능" : "등장 인물",
      }));

    // 한 지역에 등장하는 모든 몬스터의 드롭 후보를 합치되, 서로 다른 확률을 곱하거나 합치지 않는다.
    const itemPagesInZone = new Map();
    for (const monster of zone.monsters) {
      for (const seed of dropSeedsByMonster.get(monster.id) ?? []) {
        for (const weight of dropWeightsBySeed.get(seed.seedGroup) ?? []) {
          const item = itemById.get(weight.itemId);
          const itemSlug = itemSlugById.get(weight.itemId);
          if (!item || !itemSlug || itemPagesInZone.has(itemSlug)) continue;
          itemPagesInZone.set(itemSlug, { item, slug: itemSlug });
        }
      }
    }
    const zoneItems = [...itemPagesInZone.values()]
      .sort((left, right) => {
        const leftGrade = GRADE_KEYS.indexOf(left.item.grade);
        const rightGrade = GRADE_KEYS.indexOf(right.item.grade);
        return leftGrade - rightGrade || left.item.name.localeCompare(right.item.name, "ko");
      })
      .map(({ item, slug: itemSlug }) => ({
        url: `/docs/아이템/${itemSlug}/`,
        image: item.image || "",
        name: item.name,
        meta: [gradeLabel(item.grade), subTypeLabel(item.subType)].filter(Boolean).join(" · "),
        gradeKey: gradeKey(item.grade),
        sealCharacter: gradeLabel(item.grade) || "품",
      }));

    const eyebrow = [
      zone.regionAct,
      regionText,
      zone.monsterCount > 0 ? "몬스터 출현" : isCutsceneZone(zone) ? "연출용 지역" : "NPC만 기록",
    ].filter(Boolean);
    const badges = [
      levelText,
      `몬스터 ${number(zone.monsterCount)}종`,
      zone.bossCount > 0 ? `우두머리 ${number(zone.bossCount)}종` : null,
      zone.npcCount > 0 ? `NPC ${number(zone.npcCount)}명` : null,
      isCutsceneZone(zone) ? "플레이어 이동 지역 아님" : null,
    ].filter(Boolean);
    const body = [
      leafHeader({
        sealCharacter: zone.monsterLevelMin === null ? "인" : String(zone.monsterLevelMin),
        gradeKey: zone.bossCount > 0 ? "unique" : "none",
        eyebrow: eyebrow.length > 0 ? eyebrow : ["지역"],
        name: zone.name,
        image: "",
        alt: "",
        description: "",
        badges,
      }),
      statStrip([
        { label: "레벨대", value: levelText },
        { label: "몬스터", value: number(zone.monsterCount), unit: "종" },
        { label: "우두머리", value: number(zone.bossCount), unit: "종" },
        { label: "등장 인물", value: number(zone.npcCount), unit: "명" },
      ]),
      section("등장 몬스터", monsterEntries.length > 0
        ? sourceList(monsterEntries)
        : emptyState("이 배포본에는 이 지역에 등장하는 몬스터가 기록돼 있지 않습니다.")),
      section("만날 수 있는 인물", npcEntries.length > 0
        ? sourceList(npcEntries)
        : emptyState("이 배포본에는 이 지역에서 만날 수 있는 인물이 기록돼 있지 않습니다.")),
      section("이 지역에서 나오는 아이템", zoneItems.length > 0
        ? linkCards(zoneItems)
        : emptyState("이 지역에는 몬스터가 기록돼 있지 않아 아이템 후보를 묶지 않았습니다."),
      zoneItems.length > 0 ? "등장 몬스터별 드롭 후보를 합친 목록입니다. 처치 한 번의 드롭 확률을 뜻하지 않습니다." : ""),
    ].join("\n");

    registry.zone.push({ slug, zone });
    await queueWrite(outputRoot, "지역", slug, pageFile({
      kind: "zone",
      slug,
      title: zone.name,
      description: [regionText, levelText, "등장 몬스터와 인물, 아이템 후보"].join(" · "),
      // 지역 낱장은 이미지·설명이 비는 경우가 많아 템플릿 자리의 들여쓰기만 남지 않게 한다.
      body: body.replace(/[ \t]+$/gm, ""),
    }));
  }

  /* ── 몬스터 ────────────────────────────────────────────── */
  function monsterSlug(name, level) {
    const base = slugify(name);
    const duplicated = monsters.filter((entry) => entry.name === name).length > 1;
    return duplicated ? `${base}-${level}레벨` : base;
  }

  // 1레벨과 100레벨을 같은 자로 재면 막대가 전부 바닥에 눕는다. 또래끼리 견준다.
  const monsterCohorts = new Map();
  for (const monster of monsters) {
    for (const attribute of monster.attributes) {
      const key = `${levelBand(monster.level)}:${attribute.key}`;
      monsterCohorts.set(key, [...(monsterCohorts.get(key) ?? []), attribute.value]);
    }
  }
  const monsterRankers = new Map();
  for (const [key, values] of monsterCohorts) monsterRankers.set(key, makeRanker(values));

  const monstersByZone = new Map();
  for (const monster of monsters) {
    for (const zone of monster.zones) {
      monstersByZone.set(zone.zoneId, [...(monstersByZone.get(zone.zoneId) ?? []), monster]);
    }
  }

  for (const monster of monsters) {
    const slug = monsterSlug(monster.name, monster.level);
    const zone = monster.zones[0];
    const eyebrow = [
      zone?.regionAct ? `${zone.regionAct}` : null,
      BODY_LABELS[monster.bodyType] ?? null,
      monster.boss ? "우두머리" : null,
    ].filter(Boolean);

    const attributes = monster.attributes.length > 0
      ? barRows(monster.attributes.map((attribute) => {
        const cohortKey = `${levelBand(monster.level)}:${attribute.key}`;
        const rank = monsterRankers.get(cohortKey)?.(attribute.value) ?? { share: 100, rank: null, total: 0 };
        return {
          label: rawAttributeLabel(attribute.key),
          share: rank.share,
          value: formatValue(attribute.key, attribute.value),
          note: rankNote(rank.rank, rank.total, bandLabel(monster.level)),
        };
      }))
      : "";

    const zones = monster.zones.length > 0
      ? sourceList(monster.zones.map((entry) => ({
        url: zoneSlugById.has(entry.zoneId) ? `/docs/지역/${zoneSlugById.get(entry.zoneId)}/` : "",
        title: entry.zoneName,
        detail: [
          entry.regionName,
          entry.count > 1 ? `동시에 ${entry.count}마리` : null,
          entry.respawnMax > 0 ? `${(entry.respawnMin / 1000).toFixed(0)}~${(entry.respawnMax / 1000).toFixed(0)}초 뒤 다시 나타남` : null,
        ].filter(Boolean).join(" · "),
      })))
      : emptyState("이 배포본에는 출현 지역이 기록돼 있지 않습니다.");

    const dropRows = dropSeedsByMonster.get(monster.id) ?? [];
    const dropItems = new Map();
    for (const row of dropRows) {
      for (const weight of dropWeightsBySeed.get(row.seedGroup) ?? []) {
        const current = dropItems.get(weight.itemId);
        if (!current || (weight.normalizedWeightSharePercent ?? 0) > (current.share ?? 0)) {
          dropItems.set(weight.itemId, { weight, share: weight.normalizedWeightSharePercent });
        }
      }
    }
    const drops = [...dropItems.values()]
      .sort((left, right) => (right.share ?? 0) - (left.share ?? 0))
      .map(({ weight, share }) => ({
        url: `/docs/아이템/${itemSlugById.get(weight.itemId) ?? ""}/`,
        image: weight.image || "",
        name: weight.itemName || "이름 없음",
        meta: `후보 안에서 ${percentText(share)}`,
        gradeKey: gradeKey(itemById.get(weight.itemId)?.grade ?? ""),
        sealCharacter: gradeLabel(itemById.get(weight.itemId)?.grade ?? ""),
      }))
      .filter((entry) => entry.url !== "/docs/아이템//");

    const neighbours = (monstersByZone.get(zone?.zoneId) ?? [])
      .filter((entry) => entry.id !== monster.id)
      .slice(0, 8)
      .map((entry) => ({
        url: `/docs/몬스터/${monsterSlug(entry.name, entry.level)}/`,
        name: entry.name,
        meta: `${entry.level}레벨${entry.boss ? " · 우두머리" : ""}`,
        gradeKey: entry.boss ? "unique" : "none",
        sealCharacter: String(entry.level),
      }));

    const body = [
      leafHeader({
        sealCharacter: String(monster.level),
        gradeKey: monster.boss ? "unique" : "normal",
        eyebrow: eyebrow.length > 0 ? eyebrow : ["몬스터"],
        name: monster.name,
        image: "",
        alt: "",
        description: "",
        badges: [`${monster.level}레벨`, monster.aggressive ? "먼저 덤빔" : "먼저 덤비지 않음"],
      }),
      section("경험치", monster.experienceRecorded
        ? factList([{ label: "원본값", value: number(monster.experience) }])
        : emptyState("이 배포본에는 이 몬스터의 경험치가 기록돼 있지 않습니다."),
      monster.experienceRecorded
        ? "배포본의 경험치 기록을 환산하지 않고 그대로 표시합니다. 실제 지급 시점과 보정은 이 값만으로 확정하지 않습니다."
        : "레벨이나 다른 몬스터의 값으로 추정하지 않습니다."),
      section("능력치", attributes, `막대는 ${escapeHtml(bandLabel(monster.level))} 몬스터끼리 견준 것이고, 수치는 배포본에 적힌 값 그대로입니다.`),
      section("출현", zones),
      section("떨구는 것", drops.length > 0 ? linkCards(drops) : emptyState("이 배포본에는 이 몬스터의 드롭 후보가 기록돼 있지 않습니다."),
        drops.length > 0 ? "후보 안에서의 상대 비중입니다. 처치 한 번의 드롭 확률이 아닙니다." : ""),
      section("같은 곳의 다른 몬스터", linkCards(neighbours)),
    ].join("\n");

    registry.monster.push({ slug, monster });
    await queueWrite(outputRoot, "몬스터", slug, pageFile({
      kind: "monster",
      slug,
      title: monster.name,
      description: `${monster.level}레벨 ${eyebrow.join(" · ")}. 능력치, 출현 지역과 떨구는 것.`,
      body: body.replace(/[ \t]+$/gm, ""),
    }));
  }

  await flushWrites();
  await writeSearchIndex({ root, registry, gradeLabel, subTypeLabel, factionLabel, mainTypeLabel });
  await writeIndexes({ root, registry, gradeLabel, gradeKey, mainTypeLabel, subTypeLabel, factionLabel, zoneTotal: zones.length });
  console.log(`개체 낱장 생성: 무공 ${registry.skill.length}장, 아이템 ${registry.item.length}장, 몬스터 ${registry.monster.length}장, 지역 ${registry.zone.length}장`);
}


/* ── 목록 ─────────────────────────────────────────────── */
function indexCard({ url, image, sealCharacter, gradeKey, name, meta }) {
  return `<li><a class="leaf-card" data-grade="${escapeHtml(gradeKey)}" href="{{ '${url}' | relative_url }}">
    ${image
      ? `<img src="{{ '${image}' | relative_url }}" alt="" width="48" height="48" loading="lazy" decoding="async">`
      : `<span class="leaf-card__seal" data-grade="${escapeHtml(gradeKey)}" aria-hidden="true">${escapeHtml(sealCharacter)}</span>`}
    <span class="leaf-card__body"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(meta)}</small></span>
  </a></li>`;
}

function indexPage({ title, permalink, lede, groups, count, unit }) {
  const front = [
    "---",
    `title: ${frontMatterString(title)}`,
    "layout: default",
    `permalink: ${permalink}`,
    `description: ${frontMatterString(lede)}`,
    "---",
    "",
  ].join("\n");
  const body = `
<header class="leaf-index__head">
  <p class="leaf-eyebrow">${escapeHtml(count)}${escapeHtml(unit)}</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="leaf-index__lede">${escapeHtml(lede)}</p>
</header>

${groups.map((group) => `<section class="leaf-index__group">
  <h2>${escapeHtml(group.title)}<small>${escapeHtml(group.meta)}</small></h2>
  <ul class="leaf-grid">
    ${group.cards.join("\n    ")}
  </ul>
</section>`).join("\n\n")}
`;
  return `${front}${body.trim()}\n`;
}

async function writeIndexes({ root, registry, gradeLabel, gradeKey, mainTypeLabel, subTypeLabel, factionLabel, zoneTotal }) {
  const docs = path.join(root, "docs");

  // 무공 — 문파로 묶는다. 문파는 플레이어가 무공을 찾는 첫 기준이다.
  const byFaction = new Map();
  for (const entry of registry.skill) {
    const key = entry.skill.factionType || "";
    byFaction.set(key, [...(byFaction.get(key) ?? []), entry]);
  }
  const factionGroups = [...byFaction.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .map(([faction, entries]) => ({
      title: factionLabel(faction) || "갈래 없음",
      meta: `${entries.length}종`,
      cards: entries
        .sort((left, right) => GRADE_KEYS.indexOf(right.skill.grade) - GRADE_KEYS.indexOf(left.skill.grade)
          || left.skill.name.localeCompare(right.skill.name, "ko"))
        .map((entry) => indexCard({
          url: `/docs/무공/${entry.slug}/`,
          image: entry.skill.image || "",
          sealCharacter: gradeLabel(entry.skill.grade) || "무",
          gradeKey: gradeKey(entry.skill.grade),
          name: entry.skill.name,
          meta: [gradeLabel(entry.skill.grade), CAST_LABELS[entry.skill.castType]].filter(Boolean).join(" · "),
        })),
    }));
  await writeFile(path.join(docs, "무공", "index.md"), indexPage({
    title: "무공",
    permalink: "/docs/무공/",
    lede: "문파별로 익힐 수 있는 무공입니다. 한 장을 열면 공격 배율, 재사용 대기시간, 익히는 법을 볼 수 있습니다.",
    groups: factionGroups,
    count: registry.skill.length,
    unit: "종",
  }));

  // 아이템 — 분류로 묶고, 분류 안에서는 부위별로 세운다.
  const byMain = new Map();
  for (const entry of registry.item) {
    const key = entry.first.mainType || "";
    byMain.set(key, [...(byMain.get(key) ?? []), entry]);
  }
  const mainOrder = ["Weapon", "Armor", "Accessory", "Special", "Cooking", "Consumable", "Appearance", "Currency", "Exp", "ETC"];
  const itemGroups = [...byMain.entries()]
    .sort((left, right) => {
      const leftIndex = mainOrder.indexOf(left[0]);
      const rightIndex = mainOrder.indexOf(right[0]);
      return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
    })
    .map(([main, entries]) => ({
      title: mainTypeLabel(main) || "그 밖의 물건",
      meta: `${entries.length}종`,
      cards: entries
        .sort((left, right) => (left.first.subType || "").localeCompare(right.first.subType || "")
          || GRADE_KEYS.indexOf(left.first.grade) - GRADE_KEYS.indexOf(right.first.grade)
          || left.first.name.localeCompare(right.first.name, "ko"))
        .map((entry) => indexCard({
          url: `/docs/아이템/${entry.slug}/`,
          image: entry.first.image || "",
          sealCharacter: gradeLabel(entry.first.grade) || "품",
          gradeKey: gradeKey(entry.first.grade),
          name: entry.first.name,
          meta: [gradeLabel(entry.first.grade), subTypeLabel(entry.first.subType)].filter(Boolean).join(" · "),
        })),
    }));
  await writeFile(path.join(docs, "아이템", "index.md"), indexPage({
    title: "아이템",
    permalink: "/docs/아이템/",
    lede: "장비와 재료, 소모품까지 배포본에 들어 있는 물건입니다. 한 장을 열면 능력치와 얻는 곳을 볼 수 있습니다.",
    groups: itemGroups,
    count: registry.item.length,
    unit: "종",
  }));

  // 몬스터 — 장(章)으로 묶는다. 진행 순서가 곧 사냥터 순서다.
  const byAct = new Map();
  for (const entry of registry.monster) {
    const key = entry.monster.zones[0]?.regionAct ?? "";
    byAct.set(key, [...(byAct.get(key) ?? []), entry]);
  }
  const actGroups = [...byAct.entries()]
    .sort((left, right) => {
      const level = (entries) => Math.min(...entries.map((entry) => entry.monster.level));
      return level(left[1]) - level(right[1]);
    })
    .map(([act, entries]) => ({
      title: act || "출현 지역 미기록",
      meta: `${entries.length}종`,
      cards: entries
        .sort((left, right) => left.monster.level - right.monster.level || left.monster.name.localeCompare(right.monster.name, "ko"))
        .map((entry) => indexCard({
          url: `/docs/몬스터/${entry.slug}/`,
          image: "",
          sealCharacter: String(entry.monster.level),
          gradeKey: entry.monster.boss ? "unique" : "normal",
          name: entry.monster.name,
          meta: [
            `${entry.monster.level}레벨`,
            entry.monster.experienceRecorded ? `경험치 ${number(entry.monster.experience)}` : "경험치 기록 없음",
            entry.monster.boss ? "우두머리" : null,
            entry.monster.zones[0]?.zoneName,
          ]
            .filter(Boolean).join(" · "),
        })),
    }));
  await writeFile(path.join(docs, "몬스터", "index.md"), indexPage({
    title: "몬스터",
    permalink: "/docs/몬스터/",
    lede: "장별로 만나는 몬스터입니다. 한 장을 열면 경험치 기록, 능력치, 출현 지역과 떨구는 것을 볼 수 있습니다.",
    groups: actGroups,
    count: registry.monster.length,
    unit: "종",
  }));

  // 지역 — 사냥터를 고르기 쉽도록 가장 낮은 몬스터 레벨의 10레벨 구간으로 묶는다.
  const byLevelBand = new Map();
  for (const entry of registry.zone) {
    const key = isCutsceneZone(entry.zone)
      ? "cutscene"
      : entry.zone.monsterLevelMin === null
        ? "npc"
        : String(levelBand(entry.zone.monsterLevelMin));
    byLevelBand.set(key, [...(byLevelBand.get(key) ?? []), entry]);
  }
  const zoneGroups = [...byLevelBand.entries()]
    .sort((left, right) => {
      const trailingOrder = { npc: 1, cutscene: 2 };
      if (left[0] in trailingOrder || right[0] in trailingOrder) {
        return (trailingOrder[left[0]] ?? 0) - (trailingOrder[right[0]] ?? 0);
      }
      return Number(left[0]) - Number(right[0]);
    })
    .map(([band, entries]) => ({
      title: band === "npc"
        ? "NPC만 기록된 지역"
        : band === "cutscene"
          ? "연출용 지역"
          : `${Number(band) + 1}~${Number(band) + 10}레벨 사냥터`,
      meta: `${entries.length}곳`,
      cards: entries
        .sort((left, right) => (left.zone.monsterLevelMin ?? Number.MAX_SAFE_INTEGER) - (right.zone.monsterLevelMin ?? Number.MAX_SAFE_INTEGER)
          || (left.zone.monsterLevelMax ?? Number.MAX_SAFE_INTEGER) - (right.zone.monsterLevelMax ?? Number.MAX_SAFE_INTEGER)
          || left.zone.name.localeCompare(right.zone.name, "ko"))
        .map((entry) => indexCard({
          url: `/docs/지역/${entry.slug}/`,
          image: "",
          sealCharacter: entry.zone.monsterLevelMin === null ? "인" : String(entry.zone.monsterLevelMin),
          gradeKey: entry.zone.bossCount > 0 ? "unique" : "none",
          name: entry.zone.name,
          meta: [
            levelRangeLabel(entry.zone.monsterLevelMin, entry.zone.monsterLevelMax),
            `몬스터 ${entry.zone.monsterCount}종`,
            `우두머리 ${entry.zone.bossCount}종`,
            entry.zone.regionName || "권역 미기록",
            isCutsceneZone(entry.zone) ? "플레이어 이동 지역 아님" : null,
          ].filter(Boolean).join(" · "),
        })),
    }));
  const huntingZoneCount = registry.zone.filter((entry) => entry.zone.monsterCount > 0).length;
  const cutsceneZoneCount = registry.zone.filter((entry) => isCutsceneZone(entry.zone)).length;
  const npcOnlyZoneCount = registry.zone.length - huntingZoneCount - cutsceneZoneCount;
  await writeFile(path.join(docs, "지역", "index.md"), indexPage({
    title: "지역",
    permalink: "/docs/지역/",
    lede: `몬스터가 기록된 ${huntingZoneCount}곳은 레벨 구간별로, NPC만 기록된 ${npcOnlyZoneCount}곳과 연출용 ${cutsceneZoneCount}곳은 별도로 묶었습니다. 몬스터와 NPC가 모두 기록되지 않은 ${zoneTotal - registry.zone.length}곳은 목록에서 제외했습니다.`,
    groups: zoneGroups,
    count: registry.zone.length,
    unit: "곳",
  }));
}

// 낱장은 이름으로 찾을 수 있어야 한다. 모든 페이지에 심으면 무거우니
// 검색창을 열 때 한 번 내려받도록 별도 색인으로 낸다.
async function writeSearchIndex({ root, registry, gradeLabel, subTypeLabel, factionLabel, mainTypeLabel }) {
  const entries = [
    ...registry.skill.map(({ slug, skill }) => ({
      name: skill.name,
      url: `/docs/무공/${slug}/`,
      kind: "무공",
      meta: [factionLabel(skill.factionType), gradeLabel(skill.grade), CAST_LABELS[skill.castType]].filter(Boolean).join(" · "),
    })),
    ...registry.item.map(({ slug, first }) => ({
      name: first.name,
      url: `/docs/아이템/${slug}/`,
      kind: "아이템",
      meta: [mainTypeLabel(first.mainType), subTypeLabel(first.subType), gradeLabel(first.grade)].filter(Boolean).join(" · "),
    })),
    ...registry.monster.map(({ slug, monster }) => ({
      name: monster.name,
      url: `/docs/몬스터/${slug}/`,
      kind: "몬스터",
      meta: [
        `${monster.level}레벨`,
        monster.experienceRecorded ? `경험치 ${number(monster.experience)}` : "경험치 기록 없음",
        monster.boss ? "우두머리" : null,
        monster.zones[0]?.zoneName,
      ].filter(Boolean).join(" · "),
    })),
    ...registry.zone.map(({ slug, zone }) => ({
      name: zone.name,
      url: `/docs/지역/${slug}/`,
      kind: "지역",
      meta: [
        levelRangeLabel(zone.monsterLevelMin, zone.monsterLevelMax),
        zone.regionName || "권역 미기록",
        `몬스터 ${zone.monsterCount}종`,
        zone.npcCount > 0 ? `NPC ${zone.npcCount}명` : null,
        isCutsceneZone(zone) ? "연출용 지역" : null,
      ].filter(Boolean).join(" · "),
    })),
  ].sort((left, right) => left.kind.localeCompare(right.kind, "ko") || left.name.localeCompare(right.name, "ko"));

  // assets/data 는 데이터 추출 때 통째로 교체되는 자리라 색인을 그 밖에 둔다.
  await writeFile(
    path.join(root, "assets", "entity-index.json"),
    `${JSON.stringify({ count: entries.length, entries }, null, 0)}\n`,
  );
}

/* ── 파일 쓰기 ─────────────────────────────────────────── */
const pendingWrites = [];
const preparedDirectories = new Set();
async function queueWrite(outputRoot, directory, slug, contents) {
  const target = path.join(outputRoot, directory);
  if (!preparedDirectories.has(target)) {
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    preparedDirectories.add(target);
  }
  pendingWrites.push(writeFile(path.join(target, `${slug}.md`), contents));
  if (pendingWrites.length > 200) await flushWrites();
}
async function flushWrites() {
  const queued = pendingWrites.splice(0, pendingWrites.length);
  await Promise.all(queued);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
