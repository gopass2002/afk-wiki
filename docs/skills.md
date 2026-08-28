---
title: 무공·스킬 데이터
layout: default
permalink: /docs/skills/
---

# 무공·스킬

무공 데이터는 [스킬]({{ '/docs/data/tables/skill/' | relative_url }}), [스킬 레벨]({{ '/docs/data/tables/skill-level/' | relative_url }}), [스킬 강화]({{ '/docs/data/tables/skill-enhance/' | relative_url }}), [스킬 능력치]({{ '/docs/data/tables/skill-stat/' | relative_url }}), [스킬 속성 파생]({{ '/docs/data/tables/attr-derivation-skill/' | relative_url }})로 분리되어 있습니다. `string-skill-ko/en`은 표시 문자열이며 수치 원본과 혼동하지 않습니다.

## 통합 탐색

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/data/derived/skill-codex/' | relative_url }}">
    <span><strong>무공 도감</strong><small>이름·등급·무기·재사용 대기시간·레벨별 배율과 아이콘을 한 표에서 비교합니다.</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">
    <span><strong>무공 강화 확률</strong><small>목표 단계별 성공·실패율, 동일 무공 재료, 은량 비용을 확인합니다.</small></span>
  </a>
</div>

무공 뽑기 확률은 클라이언트가 계산 가능한 보상 풀에 한해 도감에 결합했습니다. 강화 성공과 실제 뽑기 결과는 서버가 판정하므로 표는 배포본의 표시·미리보기 근거이지 결과 보장이 아닙니다.
