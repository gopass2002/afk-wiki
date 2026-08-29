---
title: 그대로의 기록
description: "게임 배포본에서 그대로 옮긴 원본 표 전체 목록."
layout: default
permalink: /docs/data/tables/
---

# 그대로의 기록

정리하지 않은 원본 표입니다. 열 이름과 값이 배포본에 적힌 그대로라 읽기 어렵습니다 — **먼저 [분야별 안내]({{ '/docs/data-catalog/' | relative_url }})를 보시고, 여기는 근거를 직접 확인할 때 쓰세요.**

자주 열리는 표: [장비]({{ '/docs/data/tables/item/' | relative_url }}) · [강화]({{ '/docs/data/tables/enhance/' | relative_url }}) · [제련]({{ '/docs/data/tables/refine/' | relative_url }}) · [음식]({{ '/docs/data/tables/attribute-cook/' | relative_url }}) · [무공]({{ '/docs/data/tables/skill/' | relative_url }}) · [지도]({{ '/docs/data/tables/zone/' | relative_url }}) · [스폰]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) · [아이템 드롭]({{ '/docs/data/tables/drop-item/' | relative_url }}) · [몬스터]({{ '/docs/data/tables/actor-monster/' | relative_url }})

문서의 행 수·필드 목록은 생성 시점의 매니페스트를 따릅니다. 값의 의미나 테이블 간 관계는 원본 참조 키가 확인되는 경우에만 기술합니다. 아래 문서들은 `/assets/data/raw/`의 {{ site.data.generated_manifest.tableCount }}개 JSON을 1:1로 연결합니다.

## 전체 {{ site.data.generated_manifest.tableCount }}개 테이블

{% assign categories = site.data.generated_manifest.tables | map: 'category' | uniq %}
{% for category in categories %}
{% assign category_sample = site.data.generated_manifest.tables | where: 'category', category | first %}
### {{ category_sample.categoryLabel }}
{% for table in site.data.generated_manifest.tables %}{% if table.category == category %}
- [{{ table.title | default: table.slug }}]({{ '/docs/data/tables/' | append: table.slug | append: '/' | relative_url }}) — {{ table.rowCount }}행 · 원본 [`{{ table.file }}`]({{ '/assets/data/raw/' | append: table.file | relative_url }})
{% endif %}{% endfor %}
{% endfor %}
