---
title: 지도
layout: default
permalink: /docs/map/
description: "사냥터와 던전, 일일 도전 단계, 그리고 어디에 무엇이 나오는지."
---
# 지도

어디서 사냥할지 정할 때 보는 곳입니다. 지역마다 레벨대와 나오는 몬스터가 다르고, 몬스터마다 떨구는 것이 다릅니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/지역/' | relative_url }}">
    <span><strong>지역 한 곳씩</strong><small>레벨대와 등장 몬스터, 나오는 아이템 후보를 한 장에</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/zone-atlas/' | relative_url }}">
    <span><strong>지역 견주기</strong><small>{{ site.data.generated_manifest.derived.zoneAtlas.rowCount }}곳의 레벨대와 몬스터 수를 나란히</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/daily-challenge-stages/' | relative_url }}">
    <span><strong>일일 도전</strong><small>{{ site.data.generated_manifest.derived.dailyChallengeStages.rowCount }}단계의 해금 레벨과 지역, 받는 것</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/몬스터/' | relative_url }}">
    <span><strong>몬스터 한 마리씩</strong><small>경험치와 능력치, 나오는 곳과 떨구는 것</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-codex/' | relative_url }}">
    <span><strong>몬스터 견주기</strong><small>{{ site.data.generated_manifest.derived.monsterCodex.rowCount }}종의 경험치를 나란히 놓고 비교</small></span>
  </a>
</div>

{% capture note %}
{% assign zone_table = site.data.generated_manifest.tables | where: "slug", "zone" | first %}
{% assign spawn_rows = site.data.generated_manifest.tables | where: "slug", "zone-spawn" | map: "rowCount" | first %}
지역·스테이지 기본값은 [zone]({{ '/docs/data/tables/zone/' | relative_url }}) {{ zone_table.rowCount }}행, 권역은 [zone-region]({{ '/docs/data/tables/zone-region/' | relative_url }}) 9행, 스폰은 [zone-spawn]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) {{ spawn_rows }}행입니다.

스폰 {{ spawn_rows }}행은 몬스터와 NPC로 남김없이 해결되지만, 모든 지역이 스폰 행을 가지는 것은 아닙니다. 지역 도감의 `spawnDataFound`가 거짓인 행은 배포본에 해당 `spawnKey` 데이터가 없다는 뜻입니다.

`tmx`, `spawnKey`, `regionId`, 좌표는 원본 값으로 제공됩니다. 실제 이동 규칙과 지역 해금 조건은 이 데이터만으로 추측하지 않습니다.
{% endcapture %}
{% include source-note.html body=note %}
