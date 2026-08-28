---
title: 강화·제련
layout: default
permalink: /docs/enhance/
---
# 강화·제련

<div class="hero__actions">
  <a class="btn btn-primary" href="{{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }}">장비 강화 확률표</a>
  <a class="btn" href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">무공 강화 확률표</a>
  <a class="btn" href="{{ '/docs/refine/' | relative_url }}">제련 조합 계산기</a>
</div>

{% assign enhance_table = site.data.generated_manifest.tables | where: "slug", "enhance" | first %}
강화 원본은 [`enhance.json`]({{ '/docs/data/tables/enhance/' | relative_url }}) {{ enhance_table.rowCount }}행이며 `successRate`, `dropOnFail`, `breakRate`, `materialKey`, `attrBoostPercent` 필드를 포함합니다. 설정·재료·연출은 [enhance-config]({{ '/docs/data/tables/enhance-config/' | relative_url }}), [enhance-material]({{ '/docs/data/tables/enhance-material/' | relative_url }}), [enhance-fx]({{ '/docs/data/tables/enhance-fx/' | relative_url }})에서 분리 확인합니다.

## 강화 표시 확률

클라이언트의 강화 화면은 목표 단계의 행을 읽어 다음처럼 표시합니다.

- 성공: `successRate`
- 전체 실패: `100 - successRate`
- 파괴: `dropOnFail`일 때 `round((100 - successRate) × breakRate ÷ 100)`
- 파괴를 제외한 실패: `100 - successRate - 파괴`

`breakRate`는 전체 시행의 파괴 확률이 아니라 **실패했을 때 적용되는 조건부 값**입니다. 예를 들어 무기 +13 목표 행은 성공 15%, `breakRate` 50이므로 화면상 파괴는 43%(85 × 50%를 반올림), 나머지 실패는 42%입니다.

## 제련

제련은 [refine]({{ '/docs/data/tables/refine/' | relative_url }}), [refine-attribute]({{ '/docs/data/tables/refine-attribute/' | relative_url }}), [refine-slot]({{ '/docs/data/tables/refine-slot/' | relative_url }}), [refine-grade-pool]({{ '/docs/data/tables/refine-grade-pool/' | relative_url }}), [refine-attempt]({{ '/docs/data/tables/refine-attempt/' | relative_url }})로 구성됩니다. 확률·비용·옵션 풀과 조합 계산기는 [제련 확률과 옵션]({{ '/docs/refine/' | relative_url }})에 있고, 원본을 그대로 탐색하려면 [옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }})과 [옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }})를 봅니다.

이 계산은 클라이언트 표시 로직을 재현한 것이며 서버 성공을 보장하지 않습니다.
