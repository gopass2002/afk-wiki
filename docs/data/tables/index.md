---
title: 테이블 인덱스
layout: default
permalink: /docs/data/tables/
---

# 테이블 인덱스

아래 문서들은 `/assets/data/raw/`의 {{ site.data.generated_manifest.tableCount }}개 JSON을 1:1로 연결합니다. 전체 목록은 이 디렉터리의 문서 파일명과 `_data/generated_manifest.json`의 `tables` 배열을 기준으로 합니다.

분야별 빠른 이동: [장비]({{ '/docs/data/tables/item/' | relative_url }}) · [강화]({{ '/docs/data/tables/enhance/' | relative_url }}) · [제련]({{ '/docs/data/tables/refine/' | relative_url }}) · [음식]({{ '/docs/data/tables/attribute-cook/' | relative_url }}) · [무공]({{ '/docs/data/tables/skill/' | relative_url }}) · [지도]({{ '/docs/data/tables/zone/' | relative_url }}) · [스폰]({{ '/docs/data/tables/zone-spawn/' | relative_url }}) · [아이템 드롭]({{ '/docs/data/tables/drop-item/' | relative_url }}) · [몬스터]({{ '/docs/data/tables/actor-monster/' | relative_url }})

문서의 행 수·필드 목록은 생성 시점의 매니페스트를 따릅니다. 값의 의미나 테이블 간 관계는 원본 참조 키가 확인되는 경우에만 기술합니다.

## 전체 {{ site.data.generated_manifest.tableCount }}개 테이블

{% assign categories = site.data.generated_manifest.tables | map: 'category' | uniq %}
{% for category in categories %}
{% assign category_sample = site.data.generated_manifest.tables | where: 'category', category | first %}
### {{ category_sample.categoryLabel }}
{% for table in site.data.generated_manifest.tables %}{% if table.category == category %}
- [{{ table.title | default: table.slug }}]({{ '/docs/data/tables/' | append: table.slug | append: '/' | relative_url }}) — {{ table.rowCount }}행 · 원본 [`{{ table.file }}`]({{ '/assets/data/raw/' | append: table.file | relative_url }})
{% endif %}{% endfor %}
{% endfor %}
