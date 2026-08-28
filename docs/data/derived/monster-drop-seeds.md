---
title: 몬스터 드롭 seed 그룹
layout: data
description: "몬스터별 드롭 그룹이 참조하는 seed 그룹과 그룹 안 최상위 후보 아이템"
permalink: /docs/data/derived/monster-drop-seeds/
data_file: "/assets/data/derived/monster-drop-seeds.json"
data_asset: "몬스터 드롭 seed 파생 데이터"
data_schema: "topItemSharePercent = top weight / Σ seedGroup weights"
data_manifest_key: "monsterDropSeeds"
data_category: "드롭·가중치"
data_fields: ["monsterName", "monsterLevel", "boss", "zoneName", "seedGroup", "dropRateRaw", "candidateItemCount", "seedWeightTotal", "image", "topItemName", "topItemSharePercent", "dropGroup", "monsterId"]
---

`FBDataZoneSpawn.dropGroup`이 가리키는 `FBDataDropGroup` 행을 몬스터에 연결한 표입니다. 몬스터 한 마리가 여러 seed 그룹을 참조하므로 한 몬스터가 여러 행으로 나타납니다.

`dropRateRaw`는 클라이언트 원시 값이며 단위가 확인되지 않았습니다. `topItemSharePercent`는 **그 seed 그룹이 이미 선택됐다는 조건 아래** 최상위 후보의 가중치 점유율입니다. 두 값을 곱해 처치당 드롭 확률로 읽으면 안 됩니다. 그룹 전체 후보와 가중치는 [아이템 드롭 가중치]({{ '/docs/data/derived/item-drop-weights/' | relative_url }})에서 `seedGroup`으로 검색합니다.
