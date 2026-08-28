---
title: 장비
layout: default
permalink: /docs/equipment/
---
# 장비

{% assign item_table = site.data.generated_manifest.tables | where: "slug", "item" | first %}
장비 기본 레코드는 [item]({{ '/docs/data/tables/item/' | relative_url }}) {{ item_table.rowCount }}행입니다. `mainType`, `subType`, `slotType`, `grade`, `attrKey`, `dropResource`, `sellPrice` 등 원본 필드만 확인할 수 있습니다. 장비별 강화·제련 수치는 [강화·제련]({{ '/docs/enhance/' | relative_url }})에서 관련 테이블을 교차 확인합니다.

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/item-codex/' | relative_url }}">
    <span><strong>아이템 전체 도감</strong><small>아이템 이름, 설명, 등급, 부위, 능력치와 획득 근거를 탐색합니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }}">
    <span><strong>장비 강화 확률</strong><small>장비 계열과 목표 단계별 성공·실패·파괴 표시 확률을 비교합니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }}">
    <span><strong>계산 가능 획득 확률</strong><small>클라이언트 공식이 확인된 보상 풀의 아이템별 확률만 표시합니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-drop-weights/' | relative_url }}">
    <span><strong>드롭 가중치</strong><small>드롭 후보 그룹 안의 상대 가중치를 확인합니다. 처치당 절대 확률은 아닙니다.</small></span>
  </a>
</div>
