---
title: 지도
layout: default
permalink: /docs/map/
---
# 지도

{% assign zone_table = site.data.generated_manifest.tables | where: "slug", "zone" | first %}
지역·스테이지 기본값은 [zone]({{ '/docs/data/tables/zone/' | relative_url }}) {{ zone_table.rowCount }}행, 권역은 [zone-region]({{ '/docs/data/tables/zone-region/' | relative_url }}) 9행, 스폰은 [zone-spawn]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) {{ site.data.generated_manifest.tables | where: "slug", "zone-spawn" | map: "rowCount" | first }}행입니다.

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/daily-challenge-stages/' | relative_url }}">
    <span><strong>일일 도전 단계</strong><small>{{ site.data.generated_manifest.derived.dailyChallengeStages.rowCount }}개 단계의 해금 레벨, 지역, 몬스터 경험치 기록과 확인 가능한 보상을 봅니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/zone-atlas/' | relative_url }}">
    <span><strong>지역·스테이지 도감</strong><small>{{ site.data.generated_manifest.derived.zoneAtlas.rowCount }}개 지역의 권역, 몬스터 레벨대, 보스 수와 NPC를 결합했습니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-codex/' | relative_url }}">
    <span><strong>몬스터 도감</strong><small>{{ site.data.generated_manifest.derived.monsterCodex.rowCount }}종의 경험치 기록, 능력치와 출현 지역, 드롭 후보를 봅니다.</small></span>
  </a>
</div>

## 해석 경계

스폰 {{ site.data.generated_manifest.tables | where: "slug", "zone-spawn" | map: "rowCount" | first }}행은 몬스터와 NPC로 남김없이 해결되지만, 모든 지역이 스폰 행을 가지는 것은 아닙니다. 지역 도감의 `spawnDataFound`가 거짓인 행은 배포본에 해당 `spawnKey` 데이터가 없다는 뜻입니다.

`tmx`, `spawnKey`, `regionId`, 좌표는 원본 값으로 제공됩니다. 실제 이동 규칙과 지역 해금 조건은 이 데이터만으로 추측하지 않습니다.

일일 도전의 시간·능력치 배율 원본값은 단위를 환산하지 않습니다. 시간형 도전 보상은 단계와 보상 그룹 사이의 명시적 키가 없어 단계표에 붙이지 않았습니다.
