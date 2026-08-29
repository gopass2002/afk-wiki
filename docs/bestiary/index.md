---
title: 도감
layout: default
permalink: /docs/bestiary/
description: "무엇을 몇 개 등록하면 어떤 능력치가 영구히 붙는지."
---
# 도감

아이템을 등록하면 능력치가 **영구히** 붙습니다. 무엇을 몇 개 모아야 하는지, 그리고 몇 개째마다 따로 보상이 있는지 정리했습니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/collection-codex/' | relative_url }}">
    <span><strong>등록할 것 전체</strong><small>{{ site.data.generated_manifest.derived.collectionCodex.rowCount }}가지의 필요한 개수와 붙는 능력치</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/collection-milestones/' | relative_url }}">
    <span><strong>단계 보상</strong><small>장비 12단계 · 요리 12단계, 몇 개를 모으면 무엇을 받는지</small></span>
  </a>
</div>

{% capture note %}
{% assign collection_table = site.data.generated_manifest.tables | where: "slug", "collection" | first %}
도감 레코드는 [collection]({{ '/docs/data/tables/collection/' | relative_url }}) {{ collection_table.rowCount }}행이며, 등록 규칙 {{ site.data.generated_manifest.tables | where: "slug", "collection-registry" | map: "rowCount" | first }}행이 각 항목에 필요한 아이템과 강화 단계를 지정합니다. 등록 대상은 모두 아이템이고 전부 `FBDataItem`에서 해결됩니다.

원본 표: [collection]({{ '/docs/data/tables/collection/' | relative_url }}) · [collection-registry]({{ '/docs/data/tables/collection-registry/' | relative_url }}) · [collection-milestone]({{ '/docs/data/tables/collection-milestone/' | relative_url }}) · [collection-milestone-reward]({{ '/docs/data/tables/collection-milestone-reward/' | relative_url }})

`name`·`category`·보상 필드는 추출값이며, 플레이어가 언제 해금하는지와 보상 중복 적용 규칙은 별도 런타임 검증 없이 단정하지 않습니다.
{% endcapture %}
{% include source-note.html body=note %}
