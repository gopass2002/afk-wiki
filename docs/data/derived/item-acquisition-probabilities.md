---
title: 아이템 계산 가능 획득 확률
layout: data
description: "클라이언트의 2단계 보상 풀 공식이 확인된 아이템 결과의 계산 가능 획득 확률"
permalink: /docs/data/derived/item-acquisition-probabilities/
data_file: "/assets/data/derived/item-acquisition-probabilities.json"
data_asset: "아이템 획득 확률 파생 데이터"
data_schema: "GachaProbability.computeGachaOdds"
data_manifest_key: "itemAcquisitionProbabilities"
data_category: "획득·확률"
data_fields: ["groupListKey", "itemId", "image", "itemName", "rewardType", "amountMin", "amountMax", "percent", "probability", "sourceGroups", "evidence"]
data_unit: "가지"
method: |
  바깥 보상 그룹 비율과 안쪽 보상 항목 가중치를 각각 정규화한 뒤 곱하고, 같은 결과로 이어지는 중복 경로를 합산했습니다. `percent`는 사람이 읽기 위한 백분율이며 `probability`는 0–1 값입니다.

  클라이언트 런타임 `GachaProbability.computeGachaOdds`와 같은 미리보기 공식을 적용할 수 있는 풀만 포함합니다. 서버 난수 시드, 이벤트 보정, 횟수 보장, 계정 조건과 실제 지급 결과는 이 표로 확인할 수 없습니다.
---

클라이언트에 계산식이 남아 있어 **확률을 끝까지 따질 수 있는 획득처만** 모았습니다. 같은 아이템으로 이어지는 여러 경로는 하나로 합산했습니다. 여기에 없는 아이템이 안 나온다는 뜻은 아닙니다 — 계산할 근거가 없다는 뜻입니다.
