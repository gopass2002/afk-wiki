---
title: 전체 데이터 카탈로그
layout: default
nav_order: 2
permalink: /docs/data-catalog/
---

# 전체 데이터 카탈로그

기준 배포본: `appVersion {{ site.data.generated_manifest.appVersion }}`, `PatchResource {{ site.data.generated_manifest.patch }}`, 확인일 `{{ site.data.generated_manifest.extractedAt | date: '%Y-%m-%d' }}`.

원본은 `/assets/data/raw/*.json`이며, 변환 결과의 목록과 스키마는 `_data/generated_manifest.json`에 기록되어 있습니다. {{ site.data.generated_manifest.tableCount }}개 테이블이 모두 추출 성공했고 총 {{ site.data.generated_manifest.totalRows }}행입니다. 아래 링크는 각 원본을 그대로 탐색하는 테이블 문서입니다.

[데이터 추출 시스템]({{ '/docs/data-extraction/' | relative_url }})에서 배포본 발견, FlatBuffer 변환, 파생 확률 계산, 검증과 게시 절차를 확인할 수 있습니다.

## 분야별 보기

- [장비·성장 테이블]({{ '/docs/data/tables/item/' | relative_url }}) · [강화]({{ '/docs/data/tables/enhance/' | relative_url }}) · [강화 설정]({{ '/docs/data/tables/enhance-config/' | relative_url }}) · [제련]({{ '/docs/data/tables/refine/' | relative_url }}) · [제련 옵션]({{ '/docs/data/tables/refine-attribute/' | relative_url }})
- [음식·요리 테이블]({{ '/docs/data/tables/attribute-cook/' | relative_url }}) · [요리 설정]({{ '/docs/data/tables/cook-config/' | relative_url }}) · [계산된 결과 확률]({{ '/docs/data/derived/reward-probabilities/' | relative_url }})
- [무공·스킬 테이블]({{ '/docs/data/tables/skill/' | relative_url }}) · [스킬 레벨]({{ '/docs/data/tables/skill-level/' | relative_url }}) · [스킬 강화]({{ '/docs/data/tables/skill-enhance/' | relative_url }}) · [스킬 능력치]({{ '/docs/data/tables/skill-stat/' | relative_url }})
- [지도·지역]({{ '/docs/data/tables/zone/' | relative_url }}) · [지역 연결]({{ '/docs/data/tables/zone-region/' | relative_url }}) · [스폰]({{ '/docs/data/tables/zone-spawn/' | relative_url }})
- [드롭·보상]({{ '/docs/data/tables/drop-item/' | relative_url }}) · [드롭 그룹]({{ '/docs/data/tables/drop-group/' | relative_url }}) · [재화 드롭]({{ '/docs/data/tables/drop-currency/' | relative_url }}) · [보상 상자]({{ '/docs/data/tables/reward-box/' | relative_url }})
- [몬스터]({{ '/docs/data/tables/actor-monster/' | relative_url }}) · [몬스터 속성]({{ '/docs/data/tables/attribute-monster/' | relative_url }}) · [PC 속성]({{ '/docs/data/tables/attribute-pc/' | relative_url }})

나머지 테이블은 [테이블 인덱스]({{ '/docs/data/tables/' | relative_url }})에서 확인합니다. 링크가 없는 분야는 데이터가 없다는 뜻이 아니라 인덱스에서 이름을 확인해야 한다는 뜻입니다.

## 결합 파생 데이터

원본을 그대로 두고, 확인된 참조 키로만 결합한 탐색용 데이터입니다.

- 장비·아이템: [아이템 도감]({{ '/docs/data/derived/item-codex/' | relative_url }}) · [획득 확률]({{ '/docs/data/derived/item-acquisition-probabilities/' | relative_url }}) · [드롭 가중치]({{ '/docs/data/derived/item-drop-weights/' | relative_url }}) · [강화 확률]({{ '/docs/data/derived/equipment-enhancement-probabilities/' | relative_url }})
- 제련: [옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }}) · [옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }})
- 무공: [무공 도감]({{ '/docs/data/derived/skill-codex/' | relative_url }}) · [무공 강화 확률]({{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }})
- 세계: [몬스터 도감]({{ '/docs/data/derived/monster-codex/' | relative_url }}) · [몬스터 드롭 seed 그룹]({{ '/docs/data/derived/monster-drop-seeds/' | relative_url }}) · [지역·스테이지 도감]({{ '/docs/data/derived/zone-atlas/' | relative_url }})
- 수집·요리: [수집 도감]({{ '/docs/data/derived/collection-codex/' | relative_url }}) · [도감 단계 보상]({{ '/docs/data/derived/collection-milestones/' | relative_url }}) · [요리 레벨]({{ '/docs/data/derived/cooking-levels/' | relative_url }}) · [보상 확률 계산표]({{ '/docs/data/derived/reward-probabilities/' | relative_url }})

## 해석 경계

JSON 필드명과 값은 추출 사실입니다. 필드가 참조하는 다른 테이블, 서버 계산, 런타임 표시명은 별도 검증이 필요합니다. `successRate`, `breakRate`, `dropOnFail`, `cook-prob`처럼 확률·실패 관련 필드는 클라이언트 데이터에 기록된 값만 보여 주며 실제 서버 판정이나 조건을 단정하지 않습니다.
