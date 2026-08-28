---
title: 장비 강화 확률
layout: data
description: "장비 계열별 강화 단계의 성공·실패·파괴 표시 확률과 강화 재료 키"
permalink: /docs/data/derived/equipment-enhancement-probabilities/
data_file: "/assets/data/derived/equipment-enhancement-probabilities.json"
data_asset: "장비 강화 확률 파생 데이터"
data_schema: "failure = 100 - successRate; destruction = round(failure × breakRate / 100)"
data_manifest_key: "equipmentEnhancementProbabilities"
data_category: "장비·확률"
data_fields: ["id", "mainType", "level", "successPercent", "failurePercent", "destructionPercent", "nonDestructiveFailurePercent", "dropOnFail", "conditionalBreakRate", "attributeBoostPercentRaw", "materialKey"]
---

`FBDataEnhance`의 성공률을 기준으로 전체 실패율을 구하고, `dropOnFail`인 행만 실패 조건부 `breakRate`를 곱해 클라이언트 화면의 전체 시행 기준 파괴 확률로 환산했습니다. `conditionalBreakRate` 자체를 전체 파괴 확률로 읽으면 안 됩니다.

이 값은 클라이언트 표시 로직의 재현입니다. 실제 강화 성공·실패·파괴와 보호 효과, 이벤트 또는 계정별 보정은 서버 판정을 따릅니다.
