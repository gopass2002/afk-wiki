---
title: 지도·몬스터·스폰·드롭
layout: default
permalink: /docs/world-data/
---

# 지도·몬스터·스폰·드롭

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/daily-challenge-stages/' | relative_url }}">
    <span><strong>일일 도전 단계</strong><small>시간형 7단계와 보스형 100단계의 지역·몬스터·확인 가능한 보상</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-codex/' | relative_url }}">
    <span><strong>몬스터 도감</strong><small>{{ site.data.generated_manifest.derived.monsterCodex.rowCount }}종의 경험치 기록·레벨·능력치·출현 지역·드롭 후보 아이템</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-drop-seeds/' | relative_url }}">
    <span><strong>몬스터 드롭 seed 그룹</strong><small>몬스터가 참조하는 seed 그룹과 그룹 안 최상위 후보의 가중치 점유율</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/zone-atlas/' | relative_url }}">
    <span><strong>지역·스테이지 도감</strong><small>지역별 권역, 몬스터 레벨대와 NPC</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-drop-weights/' | relative_url }}">
    <span><strong>아이템 드롭 가중치</strong><small>seed 그룹 안 아이템별 상대 가중치</small></span>
  </a>
</div>

## 결합 경로

배포본에서 확인되는 연결은 다음과 같습니다.

```text
zone.spawnKey → zone-spawn.key → actorDataId → actor-monster / actor-npc
zone-spawn.dropGroup → drop-group.dropGroup → seedGroup → drop-item.itemId → item
actor-monster.statKey → attribute-monster.key
actor-monster.name → string-monster-ko.key
actor-monster.id → drop-currency.id → exp
```

몬스터 117종은 능력치와 표시 이름이 모두 해결됩니다. 경험치 기록은 98종에 있고 19종에는 대응 행이 없습니다. 드롭 그룹도 98종에 있으며 나머지 19종에는 배포본 기록이 없습니다.

## 확인할 수 없는 것

몬스터 처치부터 seed 그룹 선택까지의 서버 난수 판정식은 클라이언트 배포본에 없습니다. `drop-group.dropRate`는 원시 값이며 단위가 확인되지 않았습니다. 따라서 seed 그룹 내부 점유율과 곱해 처치당 절대 드롭 확률로 읽지 않습니다.

`drop-currency.exp`는 원본 정수로만 표시합니다. 처치당 지급량인지, 서버나 계정 보정 전 값인지 이 데이터만으로 단정하지 않습니다.

## 원본 테이블

[zone]({{ '/docs/data/tables/zone/' | relative_url }}) · [zone-region]({{ '/docs/data/tables/zone-region/' | relative_url }}) · [zone-spawn]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) · [actor-monster]({{ '/docs/data/tables/actor-monster/' | relative_url }}) · [attribute-monster]({{ '/docs/data/tables/attribute-monster/' | relative_url }}) · [actor-npc]({{ '/docs/data/tables/actor-npc/' | relative_url }}) · [drop-item]({{ '/docs/data/tables/drop-item/' | relative_url }}) · [drop-group]({{ '/docs/data/tables/drop-group/' | relative_url }}) · [drop-currency]({{ '/docs/data/tables/drop-currency/' | relative_url }})
