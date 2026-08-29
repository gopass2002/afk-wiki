---
title: 장비
layout: default
permalink: /docs/equipment/
description: "장비의 능력치와 등급, 얻는 곳과 키우는 법."
---
# 장비

무엇을 입을지 정하고, 그것을 어떻게 키울지 보는 곳입니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/아이템/' | relative_url }}">
    <span><strong>아이템 한 가지씩</strong><small>능력치와 얻는 곳을 한 장에</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-codex/' | relative_url }}">
    <span><strong>아이템 견주기</strong><small>등급 · 부위 · 능력치를 나란히 놓고 비교</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/enhance/' | relative_url }}">
    <span><strong>강화와 제련</strong><small>단계를 올릴 때의 성공 · 실패 · 파괴</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }}">
    <span><strong>어디서 나오나</strong><small>확률을 끝까지 계산할 수 있는 획득처</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-drop-weights/' | relative_url }}">
    <span><strong>드롭 비중</strong><small>같은 후보 묶음 안에서의 상대 비중</small></span>
  </a>
</div>

{% capture note %}
{% assign item_table = site.data.generated_manifest.tables | where: "slug", "item" | first %}
장비 기본 레코드는 [item]({{ '/docs/data/tables/item/' | relative_url }}) {{ item_table.rowCount }}행입니다. `mainType`, `subType`, `slotType`, `grade`, `attrKey`, `dropResource`, `sellPrice` 등 원본 필드만 확인할 수 있습니다. 장비별 강화·제련 수치는 [강화·제련]({{ '/docs/enhance/' | relative_url }})에서 관련 테이블을 교차 확인합니다.

드롭 비중은 후보 묶음이 이미 선택됐다는 조건 아래의 상대 점유율이며, 처치당 절대 확률이 아닙니다.
{% endcapture %}
{% include source-note.html body=note %}
