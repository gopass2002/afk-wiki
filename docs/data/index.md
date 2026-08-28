---
title: 원본 데이터
layout: default
permalink: /docs/data/
---

# 원본 데이터

현재 배포본 `{{ site.data.generated_manifest.appVersion }}` / 패치 `{{ site.data.generated_manifest.patch }}`에서 FlatBuffer **{{ site.data.generated_manifest.tableCount }}개**, **{{ site.data.generated_manifest.totalRows }}행**을 추출했습니다.

- [전체 테이블 인덱스]({{ '/docs/data/tables/' | relative_url }}): 분야별 목록에서 원본 표와 JSON을 엽니다.
- [보상·획득 확률 계산표]({{ '/docs/data/derived/reward-probabilities/' | relative_url }}): 클라이언트 런타임 공식을 재현한 파생 데이터입니다.
- [데이터 카탈로그와 해석 경계]({{ '/docs/data-catalog/' | relative_url }}): 추출 범위, 관계와 확인할 수 없는 내용을 설명합니다.

각 JSON의 `meta`에는 앱 버전, 추출 시점, 패치, 행 수, 스키마, 원본 에셋과 패치 설정 주소가 함께 들어 있습니다.
