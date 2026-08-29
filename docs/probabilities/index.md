---
title: 확률·드롭
layout: default
permalink: /docs/probabilities/
description: "계산까지 끝낼 수 있는 확률과, 비중만 알 수 있는 확률을 나눠 정리했습니다."
---
# 확률·드롭

확률에는 두 종류가 있습니다. **끝까지 계산되는 것**과 **비중만 알 수 있는 것**입니다. 이 위키는 둘을 절대 섞지 않습니다.

## 몇 %인지 말할 수 있는 것

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/reward-probabilities/' | relative_url }}">
    <span><strong>상자와 뽑기</strong><small>요리와 무공 뽑기 등 {{ site.data.generated_manifest.derived.rewardProbabilities.groupCount }}개 보상에서 무엇이 몇 % 나오는지</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }}">
    <span><strong>아이템 획득 확률</strong><small>여러 경로를 합산한, 아이템별 최종 확률</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }}">
    <span><strong>장비 강화</strong><small>단계별 성공 · 실패 · 파괴</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">
    <span><strong>무공 수련</strong><small>단계별 성공률과 드는 재료 · 은량</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/refine/' | relative_url }}">
    <span><strong>제련 계산기</strong><small>원하는 옵션 조합이 나올 확률과 평균 시도 횟수</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/cooking-levels/' | relative_url }}">
    <span><strong>요리 결과</strong><small>레벨마다 무엇이 가장 잘 나오는지</small></span>
  </a>
</div>

## 비중만 알 수 있는 것

몬스터가 아이템을 떨구는 판정은 서버가 합니다. 배포본에는 **후보 묶음 안에서의 비중**까지만 들어 있어, 처치 한 번의 확률은 계산할 수 없습니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/item-drop-weights/' | relative_url }}">
    <span><strong>아이템 드롭 비중</strong><small>같은 후보 묶음 안에서 무엇이 더 잘 나오는지</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/monster-drop-seeds/' | relative_url }}">
    <span><strong>몬스터별 후보 묶음</strong><small>어떤 몬스터가 어떤 묶음을 참조하는지</small></span>
  </a>
</div>

<aside class="callout">
  <p class="eyebrow">읽을 때 주의</p>
  <h2>비중을 드롭 확률로 읽지 마세요.</h2>
  <p>“후보 안에서 33%”는 그 묶음이 이미 뽑혔다는 조건 아래의 값입니다. 한 번 잡았을 때 33% 확률로 나온다는 뜻이 아닙니다.</p>
</aside>

{% capture note %}
확률 데이터는 값의 의미를 코드로 확인한 **계산 가능 확률**과, 서버 판정이 없어 단위를 확정할 수 없는 **원본 가중치**로 나눕니다.

계산 가능 확률은 클라이언트 `GachaProbability.computeGachaOdds`와 동일하게 2단계 가중치를 정규화하고 중복 결과를 합산했습니다. 무공 강화는 `FBDataSkillEnhance.successRate`와 그 보수, 장비 강화는 실패 조건 안의 `breakRate`를 전체 시행 기준 파괴 표시 확률로 환산합니다. 요리는 레벨별 `Cook_Gacha_Lv*` 풀을 계산합니다.

[drop-item]({{ '/docs/data/tables/drop-item/' | relative_url }})·[drop-group]({{ '/docs/data/tables/drop-group/' | relative_url }})·[drop-currency]({{ '/docs/data/tables/drop-currency/' | relative_url }})는 획득 경로와 `weight`·`dropRate`를 보존합니다. 현재 클라이언트 코드는 이 테이블로 아이템과 드롭 그룹의 관계만 만들며, 몬스터 처치 시 난수 판정식은 제공하지 않습니다. 따라서 아이템 드롭 비중은 같은 `seedGroup` 안에서의 점유율만 계산합니다.

모든 계산표는 배포본의 표시·미리보기 공식을 재현합니다. 서버 난수 시드, 이벤트 보정, 계정별 조건과 실제 시행 결과까지 보장하지는 않습니다.
{% endcapture %}
{% include source-note.html body=note %}
