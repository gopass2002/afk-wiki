---
title: 도감
layout: default
permalink: /docs/bestiary/
---
# 도감

{% assign collection_table = site.data.generated_manifest.tables | where: "slug", "collection" | first %}
도감 레코드는 [collection]({{ '/docs/data/tables/collection/' | relative_url }}) {{ collection_table.rowCount }}행이며, 등록 규칙 {{ site.data.generated_manifest.tables | where: "slug", "collection-registry" | map: "rowCount" | first }}행이 각 항목에 필요한 아이템과 강화 단계를 지정합니다. 등록 대상은 모두 아이템이고 전부 `FBDataItem`에서 해결됩니다.

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/collection-codex/' | relative_url }}">
    <span><strong>수집 도감</strong><small>{{ site.data.generated_manifest.derived.collectionCodex.rowCount }}개 항목의 이름, 등록 조건 아이템, 강화 단계와 보상 능력치를 한 표에서 봅니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/collection-milestones/' | relative_url }}">
    <span><strong>도감 단계 보상</strong><small>장비·요리 분야의 누적 등록 수 단계와 각 단계 보상을 확인합니다.</small></span>
  </a>
</div>

## 원본 테이블

[collection]({{ '/docs/data/tables/collection/' | relative_url }}) · [collection-registry]({{ '/docs/data/tables/collection-registry/' | relative_url }}) · [collection-milestone]({{ '/docs/data/tables/collection-milestone/' | relative_url }}) · [collection-milestone-reward]({{ '/docs/data/tables/collection-milestone-reward/' | relative_url }})

`name`·`category`·보상 필드는 추출값이며, 플레이어가 언제 해금하는지와 보상 중복 적용 규칙은 별도 런타임 검증 없이 단정하지 않습니다.
