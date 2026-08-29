---
title: 무공 도감
layout: data
description: "무공 표시 정보·성장 수치와 계산 가능한 뽑기 확률을 원본 테이블에 연결한 통합 도감"
permalink: /docs/data/derived/skill-codex/
data_file: "/assets/data/derived/skill-codex.json"
data_asset: "무공 통합 도감 파생 데이터"
data_schema: "FBDataSkill + SkillLevel + SkillStat + StringSkill_ko"
data_manifest_key: "skillCodex"
data_category: "무공"
data_fields: ["id", "image", "name", "description", "grade", "factionType", "weaponType", "castType", "cooldownSeconds", "spCost", "range", "hitCount", "maxLevel", "level1AtkMultiplierRaw", "maxAtkMultiplierRaw", "statRanges", "skillGachaPercent", "iconSource"]
data_unit: "가지"
method: |
  `FBDataSkill`을 이름·설명, 레벨별 공격 배율, 무공 능력치 범위와 결합한 탐색용 도감입니다. `skillGachaPercent`는 클라이언트 `GachaProbability.computeGachaOdds` 공식을 적용할 수 있는 보상 풀에서만 채워지며, 값이 없는 무공을 확률 0으로 뜻하지 않습니다.

  수치와 확률은 패치 배포본의 클라이언트 데이터 및 미리보기 계산 결과입니다. 실제 뽑기, 보정, 계정 조건과 지급은 서버가 판정합니다.
---

무공 전체입니다. 문파와 무기, 재사용 대기와 내공 소모, 그리고 **최고 단계에서의 공격 배율**을 함께 봅니다. 공격 배율은 배포본에 적힌 원본값이라 게임 화면의 표시와 단위가 다를 수 있습니다.

한 무공씩 자세히 보려면 [무공 낱장]({{ '/docs/무공/' | relative_url }})으로 가세요.
