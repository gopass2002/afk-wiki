---
title: 음식·요리
layout: default
permalink: /docs/food/
description: "요리 레벨 30단계에서 무엇이 얼마나 잘 나오는지."
---
# 음식·요리

요리는 레벨이 오를수록 좋은 음식이 나올 확률이 올라갑니다. 단계마다 **무엇이 가장 잘 나오는지**와 **다음 레벨까지 얼마나 걸리는지**를 정리했습니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/cooking-levels/' | relative_url }}">
    <span><strong>요리 레벨 30단계</strong><small>필요 경험치, 조리 시간, 보관 등급과 가장 잘 나오는 결과</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/reward-probabilities/' | relative_url }}">
    <span><strong>결과 확률 전체</strong><small>레벨마다 나올 수 있는 음식과 각각의 확률</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/아이템/' | relative_url }}">
    <span><strong>음식 한 가지씩</strong><small>붙는 능력치와 만드는 법을 한 장에</small></span>
  </a>
</div>

<aside class="callout">
  <p class="eyebrow">읽을 때 주의</p>
  <h2>요리 비중과 결과 확률은 다릅니다.</h2>
  <p>요리 레벨 표의 “후보 안에서 비중”은 원본 가중치를 고르게 편 값입니다. 실제로 무엇이 나올 확률은 <a href="{{ '/docs/data/derived/reward-probabilities/' | relative_url }}">결과 확률 전체</a>에서 보세요.</p>
</aside>

{% capture note %}
실제 확률 미리보기는 `cook-prob.weight`를 직접 쓰지 않고 `Cook_Gacha_Lv1`부터 `Cook_Gacha_Lv30`까지의 보상 그룹을 계산합니다. 위키의 계산표는 클라이언트 `GachaProbability.computeGachaOdds`와 같은 공식을 사용하며, 30개 레벨 모두 대응하는 풀이 존재합니다.

`cook-prob` 30행은 별도 [원본 테이블]({{ '/docs/data/tables/cook-prob/' | relative_url }})로 남겨 의미를 섞지 않습니다. 요리 레벨 표의 `cookProbWeightSharePercent`도 이 원본 가중치를 정규화한 값일 뿐, 결과 확률과 같지 않습니다.

원본 표: [요리 속성]({{ '/docs/data/tables/attribute-cook/' | relative_url }}) · [요리 레벨]({{ '/docs/data/tables/cook-level/' | relative_url }}) · [요리 효율]({{ '/docs/data/tables/cook-efficiency/' | relative_url }}) · [요리 확률]({{ '/docs/data/tables/cook-prob/' | relative_url }}) · [요리 설정]({{ '/docs/data/tables/cook-config/' | relative_url }})

요리로 만든 음식의 도감 등록은 [수집 도감]({{ '/docs/data/derived/collection-codex/' | relative_url }})의 `Cook` 분류 130개 항목에서 확인합니다.
{% endcapture %}
{% include source-note.html body=note %}
