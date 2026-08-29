---
title: 무공
layout: default
permalink: /docs/skills/
description: "문파별 무공의 위력과 수련 성공률."
---

# 무공

어떤 무공이 센지, 한 단계 올리는 데 무엇이 드는지 보는 곳입니다.

<div class="topic-grid">
  <a class="topic-card" href="{{ '/docs/무공/' | relative_url }}">
    <span><strong>무공 한 가지씩</strong><small>문파와 무기, 공격 배율, 익히는 법을 한 장에</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/skill-codex/' | relative_url }}">
    <span><strong>무공 견주기</strong><small>공격 배율을 나란히 놓고 비교</small></span>
  </a>
  <a class="topic-card" href="{{ '/docs/data/derived/skill-enhancement-probabilities/' | relative_url }}">
    <span><strong>수련 성공률</strong><small>단계별 성공률과 드는 같은 무공 · 은량</small></span>
  </a>
</div>

{% capture note %}
무공 데이터는 [스킬]({{ '/docs/data/tables/skill/' | relative_url }}), [스킬 레벨]({{ '/docs/data/tables/skill-level/' | relative_url }}), [스킬 강화]({{ '/docs/data/tables/skill-enhance/' | relative_url }}), [스킬 능력치]({{ '/docs/data/tables/skill-stat/' | relative_url }}), [스킬 속성 파생]({{ '/docs/data/tables/attr-derivation-skill/' | relative_url }})로 분리되어 있습니다. `string-skill-ko/en`은 표시 문자열이며 수치 원본과 혼동하지 않습니다.

공격 배율은 배포본에 적힌 원본값이며 단위를 환산하지 않았습니다. 무공 뽑기 확률은 클라이언트가 계산 가능한 보상 풀에 한해 도감에 결합했습니다. 강화 성공과 실제 뽑기 결과는 서버가 판정하므로 표는 배포본의 표시·미리보기 근거이지 결과 보장이 아닙니다.
{% endcapture %}
{% include source-note.html body=note %}
