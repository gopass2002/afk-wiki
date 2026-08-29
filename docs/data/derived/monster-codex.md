---
title: 몬스터 도감
layout: data
description: "몬스터 117종의 경험치 기록, 능력치, 출현 지역과 드롭 후보 아이템을 결합한 통합 도감"
permalink: /docs/data/derived/monster-codex/
data_file: "/assets/data/derived/monster-codex.json"
data_asset: "몬스터 통합 도감 파생 데이터"
data_schema: "FBDataActorMonster + DropCurrency + AttributeMonster + ZoneSpawn + DropGroup"
data_manifest_key: "monsterCodex"
data_category: "세계·전투"
data_fields: ["name", "level", "experience", "experienceRecorded", "boss", "aggressive", "bodyType", "zoneNames", "attributes", "dropItemCount", "dropItems", "dropSeedGroupCount", "dropSeedGroups", "id", "statKey"]
---

`FBDataActorMonster` 117행을 경험치 기록(`FBDataDropCurrency.id`), 표시 이름(`FBDataStringMonster_ko`), 능력치(`FBDataAttributeMonster.statKey`), 출현 지역(`FBDataZoneSpawn` → `FBDataZone`), 드롭 후보(`FBDataDropGroup` → `FBDataDropItem`)와 결합했습니다. 117종 모두 능력치와 이름 키가 해결되며, 이 중 98종에 경험치 원본값이 있고 19종은 대응 행이 없습니다.

`experience`는 `FBDataDropCurrency.exp`를 환산하지 않고 그대로 옮긴 값입니다. 실제 지급 시점과 서버 보정은 이 값만으로 확정하지 않으며, 대응 행이 없는 몬스터는 `experienceRecorded`가 거짓이고 `experience`가 `null`입니다.

`dropItems`는 그 몬스터의 seed 그룹에 들어 있는 **후보 아이템 목록**이며 처치당 드롭 확률이 아닙니다. 그룹 안 상대 가중치는 [몬스터 드롭 seed 그룹]({{ '/docs/data/derived/monster-drop-seeds/' | relative_url }})과 [아이템 드롭 가중치]({{ '/docs/data/derived/item-drop-weights/' | relative_url }})에서 확인합니다. 몬스터 아이콘은 배포본에 개별 스프라이트로 존재하지 않아 추출하지 않았습니다.
