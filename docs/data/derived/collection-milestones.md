---
title: 도감 단계 보상
layout: data
description: "장비·요리 도감의 누적 등록 수 단계와 각 단계의 보상"
permalink: /docs/data/derived/collection-milestones/
data_file: "/assets/data/derived/collection-milestones.json"
data_asset: "도감 단계 보상 파생 데이터"
data_schema: "FBDataCollectionMilestone + CollectionMilestoneReward + Item"
data_manifest_key: "collectionMilestones"
data_category: "도감"
data_fields: ["category", "requiredCount", "image", "rewardName", "rewardAmount", "rewardType", "rewardCount", "rewards", "rewardGroupKey", "id"]
data_unit: "단계"
method: |
  `FBDataCollectionMilestone` 24행(장비 12 · 요리 12)의 `rewardGroupKey`를 `FBDataCollectionMilestoneReward`로 해결하고, 보상 대상 ID를 `FBDataItem`의 이름·아이콘에 연결했습니다. 24개 단계 모두 보상 그룹이 해결되며 보상 타입은 전부 `Currency`입니다.

  `requiredCount`는 해당 분야에서 등록해야 하는 누적 도감 항목 수입니다. 지급 시점과 중복 수령 조건은 클라이언트 데이터만으로 확정하지 않습니다.
---

도감을 채우면 정해진 개수마다 보상을 받습니다. 장비 12단계와 요리 12단계, 모두 24단계이며 보상은 전부 재화입니다. 몇 개를 모아야 무엇을 받는지 단계별로 정리했습니다.
