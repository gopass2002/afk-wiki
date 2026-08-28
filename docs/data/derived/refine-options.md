---
title: 제련 옵션 풀
layout: data
description: "장비 종류 18종 × 등급 5단계의 제련 옵션 가중치, 슬롯 해금률과 등급 확률"
permalink: /docs/data/derived/refine-options/
data_file: "/assets/data/derived/refine-options.json"
data_asset: "제련 옵션 풀 파생 데이터"
data_schema: "pickPercent = optionWeight / Σ optionWeight"
data_manifest_key: "refineOptions"
data_category: "장비·확률"
data_fields: ["itemSubTypeLabel", "itemGradeLabel", "itemSubType", "itemGrade", "optionCount", "options", "silverCost", "stoneItemName", "stoneAmount", "slots", "optionWeightTotal", "id"]
---

`FBDataRefine` 90행(장비 종류 18 × 등급 5)의 `attrKey`·`attrValue`를 옵션 풀과 가중치로 읽고, 등급별 은량 비용(`FBDataRefineAttempt`), 연마석(`FBDataRefineConfig`), 슬롯 해금률(`FBDataRefineSlot`), 옵션 등급 가중치(`FBDataRefineGradePool`)를 같은 행에 결합했습니다.

`options[].pickPercent`는 풀 안에서 그 옵션이 뽑힐 상대 확률, `slots[].gradeOdds[].percent`는 D~S 등급 가중치의 정규화 확률입니다. 옵션 등급별 실제 수치 범위는 [제련 옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }})에 있습니다. 계산기와 해석은 [제련 확률과 옵션]({{ '/docs/refine/' | relative_url }})을 참고하세요.
