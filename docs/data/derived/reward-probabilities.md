---
title: 보상·획득 확률 계산표
layout: data
description: "클라이언트 런타임과 같은 2단계 가중치 공식으로 계산한 보상 풀별 획득 확률"
permalink: /docs/data/derived/reward-probabilities/
data_file: "/assets/data/derived/reward-probabilities.json"
data_asset: "보상 풀 파생 데이터"
data_schema: "GachaProbability.computeGachaOdds"
data_manifest_key: "rewardProbabilities"
data_category: "확률"
data_fields: ["groupListKey", "type", "targetId", "targetName", "amountMin", "amountMax", "percent", "probability", "sourceGroups"]
data_unit: "줄"
method: |
  `FBDataRewardGroupListBox`의 바깥 가중치와 `FBDataPromissoryNoteQuest`·`FBDataRewardBox`의 안쪽 가중치를 게임 클라이언트의 `computeGachaOdds`와 같은 순서로 정규화한 결과입니다.

  같은 `type + targetId`가 여러 경로에서 나오면 확률을 합산합니다. `percent`는 표시 편의를 위해 백분율로 변환한 값이며, 실제 결과 판정은 서버가 담당합니다.
---

상자와 보상 묶음을 열었을 때 **무엇이 몇 % 확률로 나오는지**입니다. 게임 클라이언트가 쓰는 것과 같은 순서로 계산했습니다.
