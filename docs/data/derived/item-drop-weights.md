---
title: 아이템 드롭 가중치
layout: data
description: "드롭 seedGroup별 아이템 후보와 그룹 내부 가중치 점유율—처치당 절대 드롭 확률 아님"
permalink: /docs/data/derived/item-drop-weights/
data_file: "/assets/data/derived/item-drop-weights.json"
data_asset: "아이템 드롭 가중치 파생 데이터"
data_schema: "normalizedWeightShare = item weight / seedGroup total weight"
data_manifest_key: "itemDropWeights"
data_category: "드롭·가중치"
data_fields: ["seedGroup", "itemId", "image", "itemName", "amountMin", "amountMax", "weight", "seedGroupWeightTotal", "normalizedWeightSharePercent", "referencedDropGroupCount", "dropRateRawValues", "interpretation"]
---

`FBDataDropItem` 후보를 아이템 이름·이미지와 연결하고 같은 `seedGroup` 안에서 `weight ÷ seedGroupWeightTotal`을 계산했습니다. `normalizedWeightSharePercent`는 **그룹이 이미 선택됐다는 조건 아래 후보 간 상대 점유율**입니다.

클라이언트 배포본에는 몬스터 처치부터 seed 그룹 선택까지의 완전한 서버 난수 판정식이 없습니다. 따라서 `dropRateRawValues`와 정규화 점유율을 곱해 처치당 절대 드롭 확률이라고 단정하지 않습니다.
