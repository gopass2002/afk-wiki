---
title: 음식·요리 데이터
layout: default
permalink: /docs/food/
---

# 음식·요리

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/cooking-levels/' | relative_url }}">
    <span><strong>요리 레벨 30단계</strong><small>필요 경험치, 조리 시간, 보관 등급, 불꽃 단계와 레벨별 결과 확률 요약</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/reward-probabilities/' | relative_url }}">
    <span><strong>결과 확률 계산표</strong><small><code>Cook_Gacha_Lv1</code>~<code>Cook_Gacha_Lv30</code> 풀의 전체 결과</small></span>
  </a>
</div>

## 확률을 읽는 방법

실제 확률 미리보기는 `cook-prob.weight`를 직접 쓰지 않고 `Cook_Gacha_Lv1`부터 `Cook_Gacha_Lv30`까지의 보상 그룹을 계산합니다. 위키의 계산표는 클라이언트 `GachaProbability.computeGachaOdds`와 같은 공식을 사용하며, 30개 레벨 모두 대응하는 풀이 존재합니다.

`cook-prob` 30행은 별도 [원본 테이블]({{ '/docs/data/tables/cook-prob/' | relative_url }})로 남겨 의미를 섞지 않습니다. 요리 레벨 표의 `cookProbWeightSharePercent`도 이 원본 가중치를 정규화한 값일 뿐, 결과 확률과 같지 않습니다.

## 원본 테이블

[요리 속성]({{ '/docs/data/tables/attribute-cook/' | relative_url }}) · [요리 레벨]({{ '/docs/data/tables/cook-level/' | relative_url }}) · [요리 효율]({{ '/docs/data/tables/cook-efficiency/' | relative_url }}) · [요리 확률]({{ '/docs/data/tables/cook-prob/' | relative_url }}) · [요리 설정]({{ '/docs/data/tables/cook-config/' | relative_url }})

요리로 만든 음식의 도감 등록은 [수집 도감]({{ '/docs/data/derived/collection-codex/' | relative_url }})의 `Cook` 분류 130개 항목에서 확인합니다.
