---
title: 강화·제련
layout: default
permalink: /docs/enhance/
description: "장비 강화의 성공·실패·파괴 확률과 제련 옵션."
---
# 강화·제련

한 단계 올리는 데 얼마나 걸리는지, 그리고 얼마나 깨지는지 보는 곳입니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }}">
    <span><strong>장비 강화</strong><small>단계별 성공 · 실패 · 파괴 확률</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">
    <span><strong>무공 수련</strong><small>단계별 성공률과 드는 재료 · 은량</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/refine/' | relative_url }}">
    <span><strong>제련 계산기</strong><small>원하는 옵션 조합의 확률과 평균 시도 횟수</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/refine-options/' | relative_url }}">
    <span><strong>제련 옵션 풀</strong><small>부위와 등급마다 뽑힐 수 있는 옵션</small></span>
  </a>
</div>

<aside class="callout">
  <p class="eyebrow">읽을 때 주의</p>
  <h2>게임 화면의 파괴율은 “실패했을 때”의 값입니다.</h2>
  <p>예를 들어 무기 +13은 성공 15%지만, 파괴는 남은 85% 안에서 절반이라 <strong>전체로는 43%</strong>입니다. 이 위키의 표는 전체 시행 기준으로 환산해 둡니다.</p>
</aside>

{% capture note %}
{% assign enhance_table = site.data.generated_manifest.tables | where: "slug", "enhance" | first %}
강화 원본은 [`enhance.json`]({{ '/docs/data/tables/enhance/' | relative_url }}) {{ enhance_table.rowCount }}행이며 `successRate`, `dropOnFail`, `breakRate`, `materialKey`, `attrBoostPercent` 필드를 포함합니다. 설정·재료·연출은 [enhance-config]({{ '/docs/data/tables/enhance-config/' | relative_url }}), [enhance-material]({{ '/docs/data/tables/enhance-material/' | relative_url }}), [enhance-fx]({{ '/docs/data/tables/enhance-fx/' | relative_url }})에서 분리 확인합니다.

클라이언트의 강화 화면은 목표 단계의 행을 읽어 다음처럼 표시합니다.

- 성공: `successRate`
- 전체 실패: `100 - successRate`
- 파괴: `dropOnFail`일 때 `round((100 - successRate) × breakRate ÷ 100)`
- 파괴를 제외한 실패: `100 - successRate - 파괴`

`breakRate`는 전체 시행의 파괴 확률이 아니라 **실패했을 때 적용되는 조건부 값**입니다.

제련은 [refine]({{ '/docs/data/tables/refine/' | relative_url }}), [refine-attribute]({{ '/docs/data/tables/refine-attribute/' | relative_url }}), [refine-slot]({{ '/docs/data/tables/refine-slot/' | relative_url }}), [refine-grade-pool]({{ '/docs/data/tables/refine-grade-pool/' | relative_url }}), [refine-attempt]({{ '/docs/data/tables/refine-attempt/' | relative_url }})로 구성됩니다.

이 계산은 클라이언트 표시 로직을 재현한 것이며 서버 성공을 보장하지 않습니다.
{% endcapture %}
{% include source-note.html body=note %}
