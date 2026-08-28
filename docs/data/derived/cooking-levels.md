---
title: 요리 레벨
layout: data
description: "요리 레벨 30단계의 필요 경험치, 조리 시간, 보관 등급과 계산된 결과 확률 요약"
permalink: /docs/data/derived/cooking-levels/
data_file: "/assets/data/derived/cooking-levels.json"
data_asset: "요리 레벨 파생 데이터"
data_schema: "FBDataCookLevel + CookProb + Item + reward probabilities"
data_manifest_key: "cookingLevels"
data_category: "음식·요리"
data_fields: ["level", "image", "rewardItemName", "rewardAmount", "requiredCookingExp", "durationSeconds", "maxKeepGrade", "maxSparkStage", "subRewardExpBonus", "rewardOutcomeCount", "topOutcomeName", "topOutcomePercent", "cookProbWeight", "cookProbWeightSharePercent", "rewardPoolKey"]
---

`FBDataCookLevel` 30행에 레벨 보상 아이템, `FBDataCookProb`의 가중치, 그리고 같은 레벨의 `Cook_Gacha_Lv<n>` 보상 풀 계산 결과를 연결했습니다. 30개 레벨 모두 대응하는 보상 풀이 존재합니다.

`topOutcomeName`과 `topOutcomePercent`는 그 레벨 풀에서 확률이 가장 높은 결과이며, 전체 결과는 [보상·획득 확률 계산표]({{ '/docs/data/derived/reward-probabilities/' | relative_url }})에서 `Cook_Gacha_Lv<n>`으로 검색합니다.

`cookProbWeightSharePercent`는 `FBDataCookProb`의 가중치를 30개 레벨 합으로 정규화한 값입니다. 클라이언트 미리보기는 이 값이 아니라 보상 풀 공식을 사용하므로, 두 값을 같은 확률로 읽으면 안 됩니다.
