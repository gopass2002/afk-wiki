#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const TOOLS_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(TOOLS_DIRECTORY, "..");
const SKILL_GACHA_GROUP = "SkillGacha_Normal";
const COOK_GACHA_PREFIX = "Cook_Gacha_Lv";
const REFINE_GRADE_LABELS = ["D", "C", "B", "A", "S"];

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function rawRows(root, slug) {
  return (await readJson(path.join(root, "assets", "data", "raw", `${slug}.json`))).rows;
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

function cleanRichText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function comparable(payload) {
  const copy = structuredClone(payload);
  delete copy.meta?.derivedAt;
  return copy;
}

function meta(manifest, kind, rows, sources, extra = {}) {
  return {
    appVersion: manifest.appVersion,
    derivedAt: new Date().toISOString(),
    kind,
    patch: manifest.patch,
    rowCount: rows.length,
    sources,
    ...extra,
  };
}

async function writeOrCheck(outputPath, payload, check) {
  if (check) {
    const existing = await readJson(outputPath);
    if (JSON.stringify(comparable(existing)) !== JSON.stringify(comparable(payload))) {
      throw new Error(`${path.basename(outputPath)} is not reproducible from raw data`);
    }
    return;
  }
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function formatAttributes(attribute) {
  if (!attribute) return [];
  return (attribute.attrKey ?? []).map((key, index) => ({
    key,
    value: attribute.attrValue?.[index] ?? attribute.attrValueArray?.[index] ?? null,
  }));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const derivedDirectory = path.join(options.root, "assets", "data", "derived");
  const [
    manifest,
    rewardProbabilities,
    skills,
    skillLevels,
    skillStats,
    skillEnhancements,
    skillConfig,
    skillStrings,
    equipmentEnhancements,
    items,
    itemAttributes,
    dropItems,
    dropGroups,
    monsters,
    monsterAttributes,
    monsterStrings,
    zones,
    zoneRegions,
    zoneSpawns,
    npcs,
    collections,
    collectionRegistry,
    collectionStrings,
    collectionMilestones,
    collectionMilestoneRewards,
    cookLevels,
    cookProbabilities,
    attributeStrings,
    refinePools,
    refineAttributes,
    refineGradePools,
    refineSlots,
    refineAttempts,
    refineConfig,
    itemStrings,
    attributeList,
    cookEfficiencies,
  ] = await Promise.all([
    readJson(path.join(options.root, "assets", "data", "manifest.json")),
    readJson(path.join(derivedDirectory, "reward-probabilities.json")),
    rawRows(options.root, "skill"),
    rawRows(options.root, "skill-level"),
    rawRows(options.root, "skill-stat"),
    rawRows(options.root, "skill-enhance"),
    rawRows(options.root, "skill-config"),
    rawRows(options.root, "string-skill-ko"),
    rawRows(options.root, "enhance"),
    rawRows(options.root, "item"),
    rawRows(options.root, "attribute-item"),
    rawRows(options.root, "drop-item"),
    rawRows(options.root, "drop-group"),
    rawRows(options.root, "actor-monster"),
    rawRows(options.root, "attribute-monster"),
    rawRows(options.root, "string-monster-ko"),
    rawRows(options.root, "zone"),
    rawRows(options.root, "zone-region"),
    rawRows(options.root, "zone-spawn"),
    rawRows(options.root, "actor-npc"),
    rawRows(options.root, "collection"),
    rawRows(options.root, "collection-registry"),
    rawRows(options.root, "string-collection-ko"),
    rawRows(options.root, "collection-milestone"),
    rawRows(options.root, "collection-milestone-reward"),
    rawRows(options.root, "cook-level"),
    rawRows(options.root, "cook-prob"),
    rawRows(options.root, "string-attribute-list-ko"),
    rawRows(options.root, "refine"),
    rawRows(options.root, "refine-attribute"),
    rawRows(options.root, "refine-grade-pool"),
    rawRows(options.root, "refine-slot"),
    rawRows(options.root, "refine-attempt"),
    rawRows(options.root, "refine-config"),
    rawRows(options.root, "string-item-ko"),
    rawRows(options.root, "attribute-list"),
    rawRows(options.root, "cook-efficiency"),
  ]);

  const strings = new Map(skillStrings.map((entry) => [entry.key, entry.value]));
  const levelsByKey = groupBy(skillLevels, (entry) => entry.groupKey);
  const statsBySkill = groupBy(skillStats, (entry) => entry.skillId);
  const skillGachaById = new Map(
    rewardProbabilities.rows
      .filter((entry) => entry.groupListKey === SKILL_GACHA_GROUP && entry.type === "Skill")
      .map((entry) => [entry.targetId, entry]),
  );

  const skillCodexRows = skills.map((skill) => {
    const levels = [...(levelsByKey.get(skill.levelKey) ?? [])]
      .sort((left, right) => left.level - right.level);
    const firstLevel = levels[0];
    const lastLevel = levels.at(-1);
    return {
      id: skill.id,
      image: skill.iconPath ? `/assets/images/game/skills/${skill.id}.png` : "",
      name: strings.get(skill.nameKey) ?? skill.nameKey,
      description: cleanRichText(strings.get(skill.descKey)),
      grade: skill.grade,
      factionType: skill.factionType,
      weaponType: skill.weaponType,
      castType: skill.castType,
      cooldownSeconds: skill.cooldown,
      spCost: skill.spCost,
      range: skill.range,
      hitCount: skill.hitCount,
      maxLevel: lastLevel?.level ?? 0,
      level1AtkMultiplierRaw: firstLevel?.atkMultiplier ?? null,
      maxAtkMultiplierRaw: lastLevel?.atkMultiplier ?? null,
      statRanges: (statsBySkill.get(skill.id) ?? []).map((stat) => ({
        key: stat.statKey,
        min: stat.minValue,
        max: stat.maxValue,
      })),
      skillGachaPercent: skillGachaById.get(skill.id)?.percent ?? null,
      iconSource: skill.iconPath,
    };
  });

  const trainingBookItemId = Number(
    skillConfig.find((entry) => entry.key === "TrainingBookItemId")?.value?.[0] ?? 0,
  );
  const trainingBook = items.find((item) => item.id === trainingBookItemId);
  const skillEnhancementRows = skillEnhancements
    .map((entry) => ({
      id: entry.id,
      level: entry.level,
      successPercent: entry.successRate,
      failurePercent: 100 - entry.successRate,
      sameSkillMaterialCount: entry.materialCount,
      silverCost: entry.cost,
      universalBookItemId: trainingBookItemId,
      universalBookName: trainingBook?.name ?? "",
      universalBookImage: trainingBook?.icon
        ? `/assets/images/game/items/${trainingBookItemId}.png`
        : "",
    }))
    .sort((left, right) => left.level - right.level);

  const equipmentEnhancementRows = equipmentEnhancements
    .map((entry) => {
      const failurePercent = 100 - entry.successRate;
      const destructionPercent = entry.dropOnFail
        ? Math.round((failurePercent * entry.breakRate) / 100)
        : 0;
      return {
        id: entry.id,
        mainType: entry.mainType,
        level: entry.level,
        successPercent: entry.successRate,
        failurePercent,
        destructionPercent,
        nonDestructiveFailurePercent: failurePercent - destructionPercent,
        dropOnFail: entry.dropOnFail,
        conditionalBreakRate: entry.breakRate,
        attributeBoostPercentRaw: entry.attrBoostPercent,
        materialKey: entry.materialKey,
      };
    })
    .sort((left, right) => left.mainType.localeCompare(right.mainType) || left.level - right.level);

  const attributesByKey = new Map(itemAttributes.map((entry) => [entry.key, entry]));
  const dropsByItem = groupBy(dropItems, (entry) => entry.itemId);
  const knownRewardsByItem = groupBy(
    rewardProbabilities.rows.filter((entry) => entry.type !== "Skill"),
    (entry) => entry.targetId,
  );
  const itemById = new Map(items.map((item) => [item.id, item]));
  const itemCodexRows = items.map((item) => {
    const knownRewards = knownRewardsByItem.get(item.id) ?? [];
    return {
      id: item.id,
      image: item.icon ? `/assets/images/game/items/${item.id}.png` : "",
      name: item.name,
      description: item.description,
      mainType: item.mainType,
      subType: item.subType,
      slotType: item.slotType,
      grade: item.grade,
      stack: item.stack,
      sellPrice: item.sellPrice,
      tradable: !item.untradable,
      attributes: formatAttributes(attributesByKey.get(item.attrKey)),
      dropSeedGroupCount: new Set((dropsByItem.get(item.id) ?? []).map((drop) => drop.seedGroup)).size,
      computedRewardPoolCount: new Set(knownRewards.map((reward) => reward.groupListKey)).size,
      iconSource: item.icon,
    };
  });

  const itemAcquisitionRows = rewardProbabilities.rows
    .filter((entry) => entry.type !== "Skill" && itemById.has(entry.targetId))
    .map((entry) => ({
      groupListKey: entry.groupListKey,
      itemId: entry.targetId,
      image: itemById.get(entry.targetId)?.icon
        ? `/assets/images/game/items/${entry.targetId}.png`
        : "",
      itemName: itemById.get(entry.targetId)?.name ?? entry.targetName,
      rewardType: entry.type,
      amountMin: entry.amountMin,
      amountMax: entry.amountMax,
      probability: entry.probability,
      percent: entry.percent,
      sourceGroups: entry.sourceGroups,
      evidence: rewardProbabilities.meta.runtimeEvidence,
    }))
    .sort((left, right) => left.groupListKey.localeCompare(right.groupListKey) || right.probability - left.probability);

  const dropRowsBySeed = groupBy(dropItems, (entry) => entry.seedGroup);
  const usagesBySeed = groupBy(dropGroups, (entry) => entry.seedGroup);
  const itemDropWeightRows = dropItems
    .map((entry) => {
      const seedRows = dropRowsBySeed.get(entry.seedGroup) ?? [];
      const weightTotal = seedRows.reduce((sum, row) => sum + Math.max(0, row.weight), 0);
      const usages = usagesBySeed.get(entry.seedGroup) ?? [];
      const item = itemById.get(entry.itemId);
      return {
        seedGroup: entry.seedGroup,
        itemId: entry.itemId,
        image: item?.icon ? `/assets/images/game/items/${entry.itemId}.png` : "",
        itemName: item?.name ?? "",
        amountMin: entry.amountMin,
        amountMax: entry.amountMax,
        weight: entry.weight,
        seedGroupWeightTotal: weightTotal,
        normalizedWeightSharePercent: weightTotal > 0
          ? Number(((entry.weight / weightTotal) * 100).toFixed(6))
          : null,
        referencedDropGroupCount: new Set(usages.map((usage) => usage.dropGroup)).size,
        dropRateRawValues: [...new Set(usages.map((usage) => usage.dropRate))].sort((a, b) => a - b),
        interpretation: "seedGroup 내부 가중치 점유율이며 실제 처치당 드롭 확률이 아님",
      };
    })
    .sort((left, right) => left.seedGroup.localeCompare(right.seedGroup) || right.weight - left.weight);

  const itemImage = (id) => (itemById.get(id)?.icon ? `/assets/images/game/items/${id}.png` : "");
  const attributeLabels = new Map(attributeStrings.map((entry) => [entry.key, entry.value]));
  const attributeLabel = (key) => attributeLabels.get(`Attribute_${key}`) ?? "";
  const labelledAttributes = (attribute) =>
    formatAttributes(attribute).map((entry) => ({ ...entry, label: attributeLabel(entry.key) }));
  const sharePercent = (weight, total) =>
    total > 0 ? Number(((Math.max(0, weight) / total) * 100).toFixed(6)) : null;

  const monsterStringByKey = new Map(monsterStrings.map((entry) => [entry.key, entry.value]));
  const monsterAttributeByKey = new Map(monsterAttributes.map((entry) => [entry.key, entry]));
  const monsterById = new Map(monsters.map((entry) => [entry.id, entry]));
  const npcById = new Map(npcs.map((entry) => [entry.id, entry]));
  const regionById = new Map(zoneRegions.map((entry) => [entry.id, entry]));
  const spawnsBySpawnKey = groupBy(zoneSpawns, (entry) => entry.key);
  const spawnsByActor = groupBy(zoneSpawns, (entry) => entry.actorDataId);
  const zonesBySpawnKey = groupBy(zones, (entry) => entry.spawnKey);
  const dropGroupsByKey = groupBy(dropGroups, (entry) => entry.dropGroup);

  const monsterCodexRows = monsters
    .map((monster) => {
      const spawnRows = spawnsByActor.get(monster.id) ?? [];
      const appearances = [];
      for (const spawn of spawnRows) {
        for (const zone of zonesBySpawnKey.get(spawn.key) ?? []) {
          const region = regionById.get(zone.regionId);
          appearances.push({
            zoneId: zone.id,
            zoneName: zone.name,
            zoneType: zone.type,
            regionName: region?.name ?? "",
            regionAct: region?.actName ?? "",
            spawnKey: spawn.key,
            spawnType: spawn.type,
            count: spawn.count,
            respawnMin: spawn.respawnMin,
            respawnMax: spawn.respawnMax,
          });
        }
      }
      appearances.sort((left, right) => left.zoneId - right.zoneId || left.spawnKey.localeCompare(right.spawnKey));

      const dropGroupKeys = [...new Set(spawnRows.map((spawn) => spawn.dropGroup).filter(Boolean))].sort();
      const seedRows = dropGroupKeys
        .flatMap((key) => dropGroupsByKey.get(key) ?? [])
        .sort((left, right) => left.seedGroup.localeCompare(right.seedGroup));
      const dropItemIds = new Set();
      for (const seed of seedRows) {
        for (const candidate of dropRowsBySeed.get(seed.seedGroup) ?? []) dropItemIds.add(candidate.itemId);
      }
      const dropItemNames = [...dropItemIds]
        .sort((left, right) => left - right)
        .map((id) => itemById.get(id)?.name ?? String(id));

      return {
        id: monster.id,
        name: monsterStringByKey.get(monster.name) ?? monster.name,
        nameKey: monster.name,
        level: monster.level,
        boss: monster.boss,
        aggressive: monster.aggressive,
        bodyType: monster.bodyType,
        statKey: monster.statKey,
        attributes: labelledAttributes(monsterAttributeByKey.get(monster.statKey)),
        zoneCount: appearances.length,
        zoneNames: [...new Set(appearances.map((appearance) => appearance.zoneName))],
        zones: appearances,
        dropGroups: dropGroupKeys,
        dropSeedGroups: seedRows.map((seed) => ({
          seedGroup: seed.seedGroup,
          dropRateRaw: seed.dropRate,
          candidateItemCount: (dropRowsBySeed.get(seed.seedGroup) ?? []).length,
        })),
        dropSeedGroupCount: seedRows.length,
        dropItemCount: dropItemNames.length,
        dropItems: dropItemNames,
      };
    })
    .sort((left, right) => left.level - right.level || left.id - right.id);

  const monsterDropSeedRows = monsterCodexRows
    .flatMap((monster) =>
      monster.dropSeedGroups.map((seed) => {
        const candidates = [...(dropRowsBySeed.get(seed.seedGroup) ?? [])].sort(
          (left, right) => right.weight - left.weight || left.itemId - right.itemId,
        );
        const weightTotal = candidates.reduce((sum, row) => sum + Math.max(0, row.weight), 0);
        const top = candidates[0];
        return {
          monsterId: monster.id,
          image: top ? itemImage(top.itemId) : "",
          monsterName: monster.name,
          monsterLevel: monster.level,
          boss: monster.boss,
          zoneName: monster.zones[0]?.zoneName ?? "",
          dropGroup: `Mob_${monster.id}`,
          seedGroup: seed.seedGroup,
          dropRateRaw: seed.dropRateRaw,
          candidateItemCount: seed.candidateItemCount,
          seedWeightTotal: weightTotal,
          topItemId: top?.itemId ?? null,
          topItemName: top ? itemById.get(top.itemId)?.name ?? "" : "",
          topItemSharePercent: top ? sharePercent(top.weight, weightTotal) : null,
        };
      }),
    )
    .sort(
      (left, right) =>
        left.monsterLevel - right.monsterLevel ||
        left.monsterId - right.monsterId ||
        left.seedGroup.localeCompare(right.seedGroup),
    );

  const zoneAtlasRows = zones
    .map((zone) => {
      const spawnRows = spawnsBySpawnKey.get(zone.spawnKey) ?? [];
      const region = regionById.get(zone.regionId);
      const zoneMonsters = spawnRows
        .filter((spawn) => monsterById.has(spawn.actorDataId))
        .map((spawn) => {
          const monster = monsterById.get(spawn.actorDataId);
          return {
            id: monster.id,
            name: monsterStringByKey.get(monster.name) ?? monster.name,
            level: monster.level,
            boss: monster.boss,
            count: spawn.count,
            spawnType: spawn.type,
            respawnMin: spawn.respawnMin,
            respawnMax: spawn.respawnMax,
            dropGroup: spawn.dropGroup,
          };
        })
        .sort((left, right) => left.level - right.level || left.id - right.id);
      const zoneNpcs = spawnRows
        .filter((spawn) => npcById.has(spawn.actorDataId))
        .map((spawn) => {
          const npc = npcById.get(spawn.actorDataId);
          return { id: npc.id, name: npc.name, shopId: npc.shopId, spawnObject: spawn.spawnObject };
        })
        .sort((left, right) => left.id - right.id);
      const levels = zoneMonsters.map((monster) => monster.level);

      return {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        regionId: zone.regionId,
        regionName: region?.name ?? "",
        regionAct: region?.actName ?? "",
        maxPlayer: zone.maxPlayer,
        posX: zone.posX,
        posY: zone.posY,
        tmx: zone.tmx,
        spawnKey: zone.spawnKey,
        spawnDataFound: spawnRows.length > 0,
        monsterCount: zoneMonsters.length,
        monsterLevelMin: levels.length > 0 ? Math.min(...levels) : null,
        monsterLevelMax: levels.length > 0 ? Math.max(...levels) : null,
        bossCount: zoneMonsters.filter((monster) => monster.boss).length,
        monsterNames: [...new Set(zoneMonsters.map((monster) => monster.name))],
        monsters: zoneMonsters,
        npcCount: zoneNpcs.length,
        npcNames: [...new Set(zoneNpcs.map((npc) => npc.name))],
        npcs: zoneNpcs,
      };
    })
    .sort((left, right) => left.id - right.id);

  const collectionStringByKey = new Map(collectionStrings.map((entry) => [entry.key, entry.value]));
  const registryByCollection = groupBy(collectionRegistry, (entry) => entry.collectionId);
  const collectionCodexRows = collections
    .map((entry) => {
      const registrations = (registryByCollection.get(entry.id) ?? [])
        .map((registration) => ({
          targetType: registration.targetType,
          targetId: registration.targetId,
          targetName: registration.targetType === "Item" ? itemById.get(registration.targetId)?.name ?? "" : "",
          image: registration.targetType === "Item" ? itemImage(registration.targetId) : "",
          enhanceLevel: registration.enhanceLevel,
          requiredCount: registration.requiredCount,
        }))
        .sort((left, right) => left.enhanceLevel - right.enhanceLevel || left.targetId - right.targetId);
      return {
        id: entry.id,
        image: registrations.find((registration) => registration.image)?.image ?? "",
        name: collectionStringByKey.get(entry.name) ?? entry.name,
        nameKey: entry.name,
        category: entry.category,
        rewardAttributes: (entry.rewardAttributeType ?? []).map((key, index) => ({
          key,
          label: attributeLabel(key),
          value: entry.value?.[index] ?? entry.valueArray?.[index] ?? null,
        })),
        registrationCount: registrations.length,
        registrations,
      };
    })
    .sort((left, right) => left.category.localeCompare(right.category) || left.id - right.id);

  const milestoneRewardsByGroup = groupBy(collectionMilestoneRewards, (entry) => entry.groupKey);
  const collectionMilestoneRows = collectionMilestones
    .map((entry) => {
      const rewards = (milestoneRewardsByGroup.get(entry.rewardGroupKey) ?? [])
        .map((reward) => ({
          rewardType: reward.rewardType,
          targetId: reward.targetId,
          targetName: itemById.get(reward.targetId)?.name ?? "",
          image: itemImage(reward.targetId),
          amount: reward.amount,
        }))
        .sort((left, right) => left.targetId - right.targetId);
      const first = rewards[0];
      return {
        id: entry.id,
        category: entry.category,
        requiredCount: entry.requiredCount,
        image: first?.image ?? "",
        rewardType: first?.rewardType ?? "",
        rewardName: first?.targetName ?? "",
        rewardAmount: first?.amount ?? null,
        rewardGroupKey: entry.rewardGroupKey,
        rewardCount: rewards.length,
        rewards,
      };
    })
    .sort((left, right) => left.category.localeCompare(right.category) || left.requiredCount - right.requiredCount);

  const cookProbByLevel = new Map(cookProbabilities.map((entry) => [entry.cookLevel, entry]));
  const cookWeightTotal = cookProbabilities.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  const rewardRowsByGroup = groupBy(rewardProbabilities.rows, (entry) => entry.groupListKey);
  const cookingLevelRows = [...cookLevels]
    .sort((left, right) => left.id - right.id)
    .map((entry) => {
      const rewardPoolKey = `${COOK_GACHA_PREFIX}${entry.id}`;
      const pool = [...(rewardRowsByGroup.get(rewardPoolKey) ?? [])].sort(
        (left, right) => right.probability - left.probability || left.targetId - right.targetId,
      );
      const best = pool[0];
      const probability = cookProbByLevel.get(entry.id);
      return {
        level: entry.id,
        image: itemImage(entry.rewardItemId),
        requiredCookingExp: entry.requiredCookingExp,
        durationMs: entry.durationMs,
        durationSeconds: Number((entry.durationMs / 1000).toFixed(3)),
        maxKeepGrade: entry.maxKeepGrade,
        maxSparkStage: entry.maxSparkStage,
        subRewardExpBonus: entry.subRewardExpBonus,
        rewardItemId: entry.rewardItemId,
        rewardItemName: itemById.get(entry.rewardItemId)?.name ?? "",
        rewardAmount: entry.rewardAmount,
        cookProbWeight: probability?.weight ?? null,
        cookProbWeightSharePercent: probability ? sharePercent(probability.weight, cookWeightTotal) : null,
        rewardPoolKey,
        rewardOutcomeCount: pool.length,
        topOutcomeName: best?.targetName ?? "",
        topOutcomePercent: best?.percent ?? null,
      };
    });

  const refineAttributesByType = groupBy(refineAttributes, (entry) => entry.attrType);
  const refineCostByGrade = new Map(refineAttempts.map((entry) => [entry.id, entry.cost]));
  const refineGradePoolByKey = new Map(refineGradePools.map((entry) => [`${entry.itemGrade}:${entry.slotId}`, entry]));
  const refineConfigValue = (key) => refineConfig.find((entry) => entry.key === key)?.value?.[0] ?? "";
  const refineStoneItemId = Number(refineConfigValue("RefineStoneItemId") || 0);
  const refineStoneAmount = Number(refineConfigValue("RefineStoneAmount") || 0);
  const refineSlotRows = [...refineSlots].sort((left, right) => left.id - right.id);
  const itemStringByKey = new Map(itemStrings.map((entry) => [entry.key, entry.value]));
  const attributeMetaByKey = new Map(attributeList.map((entry) => [entry.key, entry]));
  const gradeNameByOrdinal = new Map(cookEfficiencies.map((entry) => [entry.id, entry.grade]));
  const gradeLabel = (ordinal) => {
    const name = gradeNameByOrdinal.get(ordinal);
    return name ? itemStringByKey.get(`GradeType_${name}`) ?? name : "";
  };
  const displayValue = (raw, divisor) =>
    divisor > 0 ? Number((raw / divisor).toFixed(6)) : raw;

  const refineAttributeValueRows = [...refineAttributes]
    .sort((left, right) => left.attrType.localeCompare(right.attrType) || left.grade - right.grade)
    .map((entry) => ({
      id: entry.id,
      attrKey: entry.attrType,
      label: attributeLabel(entry.attrType),
      grade: REFINE_GRADE_LABELS[entry.grade - 1] ?? String(entry.grade),
      gradeId: entry.grade,
      min: entry.min,
      max: entry.max,
      displayMin: displayValue(entry.min, attributeMetaByKey.get(entry.attrType)?.divisor ?? 0),
      displayMax: displayValue(entry.max, attributeMetaByKey.get(entry.attrType)?.divisor ?? 0),
      displayDivisor: attributeMetaByKey.get(entry.attrType)?.divisor ?? 0,
      percentDisplay: (attributeMetaByKey.get(entry.attrType)?.divisor ?? 0) > 0,
      fixed: entry.min === entry.max,
    }));

  const refineOptionRows = refinePools
    .map((pool) => {
      const weights = pool.attrValue ?? pool.attrValueArray ?? [];
      const keys = pool.attrKey ?? [];
      const weightTotal = keys.reduce((sum, _key, index) => sum + Math.max(0, weights[index] ?? 0), 0);
      const options = keys
        .map((key, index) => ({
          attrKey: key,
          label: attributeLabel(key),
          weight: weights[index] ?? 0,
          pickPercent: sharePercent(weights[index] ?? 0, weightTotal),
        }))
        .sort((left, right) => right.weight - left.weight || left.attrKey.localeCompare(right.attrKey));

      return {
        id: pool.id,
        itemSubType: pool.itemSubType,
        itemSubTypeLabel: itemStringByKey.get(`ItemSubType_${pool.itemSubType}`) ?? "",
        itemGrade: pool.itemGrade,
        itemGradeName: gradeNameByOrdinal.get(pool.itemGrade) ?? "",
        itemGradeLabel: gradeLabel(pool.itemGrade),
        image: itemImage(refineStoneItemId),
        silverCost: refineCostByGrade.get(pool.itemGrade) ?? null,
        stoneItemId: refineStoneItemId,
        stoneItemName: itemById.get(refineStoneItemId)?.name ?? "",
        stoneAmount: refineStoneAmount,
        optionCount: options.length,
        optionWeightTotal: weightTotal,
        options,
        slots: refineSlotRows.map((slot) => {
          const gradePool = refineGradePoolByKey.get(`${pool.itemGrade}:${slot.id}`);
          const gradeWeights = [
            ["D", gradePool?.weightD],
            ["C", gradePool?.weightC],
            ["B", gradePool?.weightB],
            ["A", gradePool?.weightA],
            ["S", gradePool?.weightS],
          ];
          const gradeTotal = gradeWeights.reduce((sum, [, weight]) => sum + Math.max(0, weight ?? 0), 0);
          return {
            slotId: slot.id,
            unlockPercent: slot.unlockRate,
            gradeOdds: gradeWeights.map(([grade, weight]) => ({
              grade,
              weight: weight ?? null,
              percent: weight === undefined ? null : sharePercent(weight, gradeTotal),
            })),
          };
        }),
      };
    })
    .sort((left, right) => left.itemSubType.localeCompare(right.itemSubType) || left.itemGrade - right.itemGrade);

  // 같은 옵션·가중치 구성을 쓰는 장비 종류는 하나의 풀로 묶인다. 묶음은 데이터에서 계산하고,
  // 묶음 번호와 종류 순서는 원본 FBDataRefine의 행 순서를 따른다.
  const refinePoolSignature = (row) =>
    row.options
      .map((option) => `${option.attrKey}:${option.weight}`)
      .sort()
      .join("|");
  const refinePoolGroups = new Map();
  for (const row of [...refineOptionRows].sort((left, right) => left.id - right.id)) {
    const signature = refinePoolSignature(row);
    const group = refinePoolGroups.get(signature) ?? { group: refinePoolGroups.size + 1, subTypes: [], labels: [] };
    if (!group.subTypes.includes(row.itemSubType)) {
      group.subTypes.push(row.itemSubType);
      group.labels.push(row.itemSubTypeLabel || row.itemSubType);
    }
    refinePoolGroups.set(signature, group);
  }
  for (const row of refineOptionRows) {
    const group = refinePoolGroups.get(refinePoolSignature(row));
    row.poolGroup = group.group;
    row.poolSubTypes = group.subTypes;
    row.poolSubTypeLabels = group.labels;
    row.poolSharedSubTypeCount = group.subTypes.length;
  }

  const outputs = [
    [
      "skill-codex.json",
      {
        meta: meta(manifest, "skillCodex", skillCodexRows, [
          "FBDataSkill",
          "FBDataSkillLevel",
          "FBDataSkillStat",
          "FBDataStringSkill_ko",
          "reward-probabilities.json",
        ]),
        rows: skillCodexRows,
      },
    ],
    [
      "skill-enhancement-probabilities.json",
      {
        meta: meta(manifest, "skillEnhancementProbabilities", skillEnhancementRows, [
          "FBDataSkillEnhance",
          "FBDataSkillConfig",
          "FBDataItem",
        ], { formula: "failurePercent = 100 - successRate" }),
        rows: skillEnhancementRows,
      },
    ],
    [
      "equipment-enhancement-probabilities.json",
      {
        meta: meta(manifest, "equipmentEnhancementProbabilities", equipmentEnhancementRows, [
          "FBDataEnhance",
        ], {
          formula: "failure = 100 - successRate; destruction = dropOnFail ? round(failure × breakRate / 100) : 0",
        }),
        rows: equipmentEnhancementRows,
      },
    ],
    [
      "item-codex.json",
      {
        meta: meta(manifest, "itemCodex", itemCodexRows, [
          "FBDataItem",
          "FBDataAttributeItem",
          "FBDataDropItem",
          "reward-probabilities.json",
        ]),
        rows: itemCodexRows,
      },
    ],
    [
      "item-acquisition-probabilities.json",
      {
        meta: meta(manifest, "itemAcquisitionProbabilities", itemAcquisitionRows, [
          "reward-probabilities.json",
          "FBDataItem",
        ], {
          formula: rewardProbabilities.meta.formula,
          runtimeEvidence: rewardProbabilities.meta.runtimeEvidence,
        }),
        rows: itemAcquisitionRows,
      },
    ],
    [
      "item-drop-weights.json",
      {
        meta: meta(manifest, "itemDropWeights", itemDropWeightRows, [
          "FBDataDropItem",
          "FBDataDropGroup",
          "FBDataItem",
        ], {
          warning: "normalizedWeightSharePercent is not an absolute monster-drop probability",
        }),
        rows: itemDropWeightRows,
      },
    ],
    [
      "monster-codex.json",
      {
        meta: meta(manifest, "monsterCodex", monsterCodexRows, [
          "FBDataActorMonster",
          "FBDataAttributeMonster",
          "FBDataStringMonster_ko",
          "FBDataZone",
          "FBDataZoneSpawn",
          "FBDataZoneRegion",
          "FBDataDropGroup",
          "FBDataDropItem",
          "FBDataItem",
        ], {
          warning: "dropItems lists seedGroup candidates, not per-kill drop odds",
        }),
        rows: monsterCodexRows,
      },
    ],
    [
      "monster-drop-seeds.json",
      {
        meta: meta(manifest, "monsterDropSeeds", monsterDropSeedRows, [
          "FBDataActorMonster",
          "FBDataZoneSpawn",
          "FBDataDropGroup",
          "FBDataDropItem",
          "FBDataItem",
        ], {
          formula: "topItemSharePercent = top candidate weight / Σ seedGroup candidate weights",
          warning: "dropRateRaw is a client value of unconfirmed unit; it is not multiplied into a per-kill probability",
        }),
        rows: monsterDropSeedRows,
      },
    ],
    [
      "zone-atlas.json",
      {
        meta: meta(manifest, "zoneAtlas", zoneAtlasRows, [
          "FBDataZone",
          "FBDataZoneRegion",
          "FBDataZoneSpawn",
          "FBDataActorMonster",
          "FBDataActorNPC",
          "FBDataStringMonster_ko",
        ], {
          warning: "spawnDataFound=false means the deployed build ships no spawn rows for this zone spawnKey",
        }),
        rows: zoneAtlasRows,
      },
    ],
    [
      "collection-codex.json",
      {
        meta: meta(manifest, "collectionCodex", collectionCodexRows, [
          "FBDataCollection",
          "FBDataCollectionRegistry",
          "FBDataStringCollection_ko",
          "FBDataItem",
          "FBDataStringAttributeList_ko",
        ]),
        rows: collectionCodexRows,
      },
    ],
    [
      "collection-milestones.json",
      {
        meta: meta(manifest, "collectionMilestones", collectionMilestoneRows, [
          "FBDataCollectionMilestone",
          "FBDataCollectionMilestoneReward",
          "FBDataItem",
        ]),
        rows: collectionMilestoneRows,
      },
    ],
    [
      "cooking-levels.json",
      {
        meta: meta(manifest, "cookingLevels", cookingLevelRows, [
          "FBDataCookLevel",
          "FBDataCookProb",
          "FBDataItem",
          "reward-probabilities.json",
        ], {
          runtimeEvidence: rewardProbabilities.meta.runtimeEvidence,
          warning: "cookProbWeightSharePercent normalizes FBDataCookProb weights; the client preview uses the Cook_Gacha_Lv* reward pools",
        }),
        rows: cookingLevelRows,
      },
    ],
    [
      "refine-attribute-values.json",
      {
        meta: meta(manifest, "refineAttributeValues", refineAttributeValueRows, [
          "FBDataRefineAttribute",
          "FBDataStringAttributeList_ko",
          "FBDataAttributeList",
        ], {
          warning: "grade D–S maps to FBDataRefineAttribute.grade 1–5 in ascending order; displayMin/displayMax divide the raw value by FBDataAttributeList.divisor",
        }),
        rows: refineAttributeValueRows,
      },
    ],
    [
      "refine-options.json",
      {
        meta: meta(manifest, "refineOptions", refineOptionRows, [
          "FBDataRefine",
          "FBDataRefineAttribute",
          "FBDataRefineGradePool",
          "FBDataRefineSlot",
          "FBDataRefineAttempt",
          "FBDataRefineConfig",
          "FBDataItem",
          "FBDataStringAttributeList_ko",
          "FBDataStringItem_ko",
          "FBDataCookEfficiency",
        ], {
          formula: "pickPercent = optionWeight / Σ optionWeight; gradeOdds.percent = gradeWeight / Σ gradeWeight; slot unlock uses FBDataRefineSlot.unlockRate",
          poolGroupCount: refinePoolGroups.size,
        }),
        rows: refineOptionRows,
      },
    ],
  ];

  if (!options.check) await mkdir(derivedDirectory, { recursive: true });
  for (const [fileName, payload] of outputs) {
    await writeOrCheck(path.join(derivedDirectory, fileName), payload, options.check);
  }
  const summary = outputs.map(([fileName, payload]) => `${fileName} ${payload.meta.rowCount}행`).join(", ");
  console.log(`${options.check ? "도감 파생 검증" : "도감 파생 생성"}: ${summary}`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
