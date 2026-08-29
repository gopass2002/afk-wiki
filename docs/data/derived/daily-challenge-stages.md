---
title: 일일 도전 단계
layout: data
description: "시간형 도전 7단계와 보스형 도전 100단계의 지역, 몬스터, 경험치 기록과 보상을 결합한 단계표"
permalink: /docs/data/derived/daily-challenge-stages/
data_file: "/assets/data/derived/daily-challenge-stages.json"
data_asset: "일일 도전 단계 파생 데이터"
data_schema: "FBDataDailyDungeonBoss + BossTier + BossReward + TimeField + TimeFieldTier"
data_manifest_key: "dailyChallengeStages"
data_category: "세계·전투"
data_fields: ["challengeType", "challengeName", "stage", "stageName", "difficulty", "unlockLevelRaw", "zoneName", "monsterLevelMin", "monsterLevelMax", "monsterCount", "monsterNames", "monsterExperienceMin", "monsterExperienceMax", "monsterExperienceMissingCount", "monsterExperience", "attributeScaleRaw", "rewardSummary", "entryItemName", "dailyTimeRaw", "timeLimitRaw", "zoneId"]
---

배포본의 일일 도전은 **시간형 7단계**와 **보스형 100단계**로 나뉩니다. 시간형은 흑랑의 소굴 3단계와 심마의 세계 4단계이며, 각 단계의 해금 레벨·지역·등장 몬스터를 연결했습니다. 보스형은 숟가락 할배 습격 100단계이며, 단계별 능력치 배율 원본값과 은량 보상을 연결했습니다.

`monsterExperience`는 각 지역에 등장하는 몬스터의 경험치 기록입니다. 배포본에 대응 행이 없으면 `null`이며 다른 몬스터나 레벨로 추정하지 않습니다. `dailyTimeRaw`, `timeLimitRaw`, `attributeScaleRaw`도 단위를 환산하지 않은 클라이언트 원본값입니다.

시간형 보상 원본 7행은 [daily-dungeon-reward]({{ '/docs/data/tables/daily-dungeon-reward/' | relative_url }})에 있지만, 단계에서 보상 그룹으로 이어지는 명시적 키가 배포본에 없습니다. 따라서 단계별 보상으로 임의 연결하지 않았습니다. 보스형 보상은 `rewardGroupKey`가 양쪽 테이블에 있어 정확히 연결됩니다.
