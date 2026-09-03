---
title: 몬스터와 드롭
layout: default
permalink: /docs/world-data/
description: "어느 몬스터가 어디에 나오고 무엇을 떨구는지."
---

# 몬스터와 드롭

무엇을 잡아야 원하는 것이 나오는지 찾는 곳입니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/몬스터/' | relative_url }}">
    <span><strong>몬스터 한 마리씩</strong><small>경험치와 능력치, 나오는 곳과 떨구는 것을 한 장에</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-codex/' | relative_url }}">
    <span><strong>몬스터 견주기</strong><small>{{ site.data.generated_manifest.derived.monsterCodex.rowCount }}종의 경험치를 나란히 놓고 비교</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-drop-seeds/' | relative_url }}">
    <span><strong>몬스터별 드롭 후보</strong><small>이 몬스터에게서 무엇이 가장 잘 나오는지</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-drop-weights/' | relative_url }}">
    <span><strong>아이템별 드롭 비중</strong><small>같은 후보 묶음 안에서의 상대 비중</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/zone-atlas/' | relative_url }}">
    <span><strong>지역 견주기</strong><small>지역별 레벨대와 몬스터·NPC</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/daily-challenge-stages/' | relative_url }}">
    <span><strong>일일 도전</strong><small>단계별 지역과 몬스터, 받는 것</small></span>
  </a>
</div>

<aside class="callout">
  <p class="eyebrow">읽을 때 주의</p>
  <h2>처치당 드롭 확률은 배포본에 없습니다.</h2>
  <p>서버가 판정하는 부분이라 클라이언트 데이터로는 계산할 수 없습니다. 이 위키가 말할 수 있는 것은 <strong>후보 묶음 안에서의 비중</strong>까지입니다.</p>
</aside>

{% capture note %}
배포본에서 확인되는 연결은 다음과 같습니다.

```text
zone.spawnKey → zone-spawn.key → actorDataId → actor-monster / actor-npc
zone-spawn.dropGroup → drop-group.dropGroup → seedGroup → drop-item.itemId → item
actor-monster.statKey → attribute-monster.key
actor-monster.name → string-monster-ko.key
actor-monster.id → drop-currency.id → exp
```

몬스터 120종은 능력치와 표시 이름이 모두 해결됩니다. 경험치 기록은 100종에 있고 20종에는 대응 행이 없습니다. 드롭 그룹도 100종에 있으며 나머지 20종에는 배포본 기록이 없습니다.

몬스터 처치부터 seed 그룹 선택까지의 서버 난수 판정식은 클라이언트 배포본에 없습니다. `drop-group.dropRate`는 원시 값이며 단위가 확인되지 않았습니다. 따라서 seed 그룹 내부 점유율과 곱해 처치당 절대 드롭 확률로 읽지 않습니다.

`drop-currency.exp`는 원본 정수로만 표시합니다. 처치당 지급량인지, 서버나 계정 보정 전 값인지 이 데이터만으로 단정하지 않습니다.

원본 표: [zone]({{ '/docs/data/tables/zone/' | relative_url }}) · [zone-region]({{ '/docs/data/tables/zone-region/' | relative_url }}) · [zone-spawn]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) · [actor-monster]({{ '/docs/data/tables/actor-monster/' | relative_url }}) · [attribute-monster]({{ '/docs/data/tables/attribute-monster/' | relative_url }}) · [actor-npc]({{ '/docs/data/tables/actor-npc/' | relative_url }}) · [drop-item]({{ '/docs/data/tables/drop-item/' | relative_url }}) · [drop-group]({{ '/docs/data/tables/drop-group/' | relative_url }}) · [drop-currency]({{ '/docs/data/tables/drop-currency/' | relative_url }})
{% endcapture %}
{% include source-note.html body=note %}
