---
title: 무공 강화 확률
layout: data
description: "무공 강화 단계별 성공·실패 표시 확률과 동일 무공·범용 수련서·은량 비용"
permalink: /docs/data/derived/skill-enhancement-probabilities/
data_file: "/assets/data/derived/skill-enhancement-probabilities.json"
data_asset: "무공 강화 확률 파생 데이터"
data_schema: "failurePercent = 100 - FBDataSkillEnhance.successRate"
data_manifest_key: "skillEnhancementProbabilities"
data_category: "무공·확률"
data_fields: ["id", "level", "successPercent", "failurePercent", "sameSkillMaterialCount", "silverCost", "universalBookItemId", "universalBookImage", "universalBookName"]
data_unit: "단계"
method: |
  `successPercent`는 `FBDataSkillEnhance.successRate`, `failurePercent`는 그 보수인 `100 - successRate`입니다. 동일 무공 재료 수, 은량 비용과 범용 수련서 정보를 같은 강화 단계 행에 연결했습니다.

  이 표는 클라이언트가 표시하는 설정값입니다. 강화 요청의 실제 성공 여부와 서버 측 추가 조건·보정은 클라이언트 데이터만으로 보장할 수 없습니다.
---

무공을 한 단계 올릴 때의 성공 확률과, 그 단계에 필요한 **같은 무공 개수와 은량**입니다. 범용 수련서로 대신할 수 있는 단계도 함께 적었습니다.
