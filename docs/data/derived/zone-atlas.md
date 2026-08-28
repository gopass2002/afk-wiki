---
title: 지역·스테이지 도감
layout: data
description: "지역 129곳의 소속 권역, 출현 몬스터 레벨대와 NPC를 결합한 지도 데이터"
permalink: /docs/data/derived/zone-atlas/
data_file: "/assets/data/derived/zone-atlas.json"
data_asset: "지역 통합 도감 파생 데이터"
data_schema: "FBDataZone + ZoneRegion + ZoneSpawn + ActorMonster + ActorNPC"
data_manifest_key: "zoneAtlas"
data_category: "세계·전투"
data_fields: ["name", "type", "regionAct", "regionName", "monsterCount", "monsterLevelMin", "monsterLevelMax", "bossCount", "monsterNames", "npcCount", "npcNames", "maxPlayer", "spawnDataFound", "spawnKey", "tmx", "posX", "posY", "id"]
---

`FBDataZone` 129행에 권역(`FBDataZoneRegion`)과 스폰(`FBDataZoneSpawn`)을 연결하고, 스폰의 `actorDataId`를 몬스터 117종·NPC 33종으로 해석했습니다. 스폰 162행은 몬스터 117행과 NPC 45행으로 남김없이 해결됩니다.

`spawnDataFound`가 거짓인 지역은 배포본에 해당 `spawnKey`의 스폰 행이 없다는 뜻입니다. 데이터가 없는 것이지 몬스터가 없는 지역이라는 뜻이 아닙니다. `posX`·`posY`는 원본 좌표이며 실제 이동 규칙이나 지역 간 연결 조건은 이 데이터만으로 확정하지 않습니다.
