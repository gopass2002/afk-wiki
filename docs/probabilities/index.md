---
title: 확률·드롭
layout: default
permalink: /docs/probabilities/
---
# 확률·드롭

확률 데이터는 값의 의미를 코드로 확인한 **계산 가능 확률**과, 서버 판정이 없어 단위를 확정할 수 없는 **원본 가중치**로 나눕니다.

## 계산 가능

- [아이템 계산 가능 획득 확률]({{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }}): 확인된 2단계 보상 풀 공식으로 계산한 아이템 결과만 모아 이름과 이미지에 연결했습니다.
- [보상·획득 확률 계산표]({{ '/docs/data/derived/reward-probabilities/' | relative_url }}): 요리와 무공 뽑기 등 {{ site.data.generated_manifest.derived.rewardProbabilities.groupCount }}개 보상 풀, {{ site.data.generated_manifest.derived.rewardProbabilities.rowCount }}개 결과를 탐색합니다. 클라이언트 `GachaProbability.computeGachaOdds`와 동일하게 2단계 가중치를 정규화하고 중복 결과를 합산했습니다.
- [무공 강화 확률]({{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}): 목표 단계별 `successRate`와 그 보수인 실패율, 재료·비용을 함께 봅니다.
- [장비 강화 확률]({{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }}): 실패 조건 안의 `breakRate`를 전체 시행 기준 파괴 표시 확률로 환산합니다.
- [제련 확률과 계산기]({{ '/docs/refine/' | relative_url }}): 옵션 가중치·등급 가중치·슬롯 해금률로 목표 조합 확률을 계산합니다. 풀과 수치는 [옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }})·[수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }})에 있습니다.
- [요리 레벨]({{ '/docs/data/derived/cooking-levels/' | relative_url }}): 레벨별 `Cook_Gacha_Lv*` 풀의 결과 수와 최상위 결과를 요약합니다.
- [강화]({{ '/docs/enhance/' | relative_url }}): 성공·실패·파괴 표시 확률을 런타임 계산식과 함께 정리합니다.

## 원본만 공개

[drop-item]({{ '/docs/data/tables/drop-item/' | relative_url }})·[drop-group]({{ '/docs/data/tables/drop-group/' | relative_url }})·[drop-currency]({{ '/docs/data/tables/drop-currency/' | relative_url }})는 획득 경로와 `weight`·`dropRate`를 보존합니다. 현재 클라이언트 코드는 이 테이블로 아이템과 드롭 그룹의 관계만 만들며, 몬스터 처치 시 난수 판정식은 제공하지 않습니다.

[아이템 드롭 가중치]({{ '/docs/data/derived/item-drop-weights/' | relative_url }})는 이 원본을 아이템 이름·이미지에 연결하고 같은 `seedGroup` 안에서의 점유율만 계산합니다. [몬스터 드롭 seed 그룹]({{ '/docs/data/derived/monster-drop-seeds/' | relative_url }})은 어느 몬스터가 어느 seed 그룹을 참조하는지까지 이어 줍니다. 두 값 모두 처치당 절대 드롭 확률로 해석하면 안 됩니다.

모든 계산표는 배포본의 표시·미리보기 공식을 재현합니다. 서버 난수 시드, 이벤트 보정, 계정별 조건과 실제 시행 결과까지 보장하지는 않습니다.
