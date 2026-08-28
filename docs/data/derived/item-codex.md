---
title: 아이템 전체 도감
layout: data
description: "아이템 이름·설명·분류·등급·능력치와 계산 가능한 획득 근거를 결합한 통합 도감"
permalink: /docs/data/derived/item-codex/
data_file: "/assets/data/derived/item-codex.json"
data_asset: "아이템 통합 도감 파생 데이터"
data_schema: "FBDataItem + AttributeItem + DropItem + reward probabilities"
data_manifest_key: "itemCodex"
data_category: "장비·수집"
data_fields: ["id", "image", "name", "description", "mainType", "subType", "slotType", "grade", "stack", "sellPrice", "tradable", "attributes", "dropSeedGroupCount", "computedRewardPoolCount", "iconSource"]
---

`FBDataItem`의 표시 정보에 능력치, 드롭 후보 그룹 수, 클라이언트 공식으로 계산 가능한 보상 풀 수를 연결했습니다. `dropSeedGroupCount`와 `computedRewardPoolCount`는 획득 근거의 존재를 뜻하며 그 자체가 획득 확률은 아닙니다.

아이콘이 없는 행은 원본 `iconSource`가 비어 있거나 공개 배포본에서 대응 이미지를 만들 수 없는 경우입니다. 거래·지급·드롭의 실제 허용 여부는 서버 상태와 콘텐츠 조건에 따라 달라질 수 있습니다.
