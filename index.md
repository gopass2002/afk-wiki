---
title: 홈
layout: default
description: "비룡 키우기 공개 데이터 위키 — 배포본에서 추출한 장비, 도감, 음식, 지도와 확률"
permalink: /
---

{% assign item_table = site.data.generated_manifest.tables | where: "slug", "item" | first %}
{% assign collection_table = site.data.generated_manifest.tables | where: "slug", "collection" | first %}
{% assign cook_level_table = site.data.generated_manifest.tables | where: "slug", "cook-level" | first %}
{% assign zone_table = site.data.generated_manifest.tables | where: "slug", "zone" | first %}
{% assign zone_spawn_table = site.data.generated_manifest.tables | where: "slug", "zone-spawn" | first %}
{% assign skill_table = site.data.generated_manifest.tables | where: "slug", "skill" | first %}
{% assign skill_level_table = site.data.generated_manifest.tables | where: "slug", "skill-level" | first %}

<section class="hero">
  <p class="eyebrow">비룡 키우기 · 공개 데이터 장부</p>
  <h1>감이 아니라, 배포본의 숫자로 읽습니다.</h1>
  <p class="hero__lead">어디서 잡아야 경험치가 좋은지, 무엇을 입어야 센지, 강화가 얼마나 깨지는지 — 게임이 내려받는 데이터를 그대로 옮겨 정리했습니다.</p>
  <div class="hero__actions">
    <a class="button button--primary" href="{{ '/docs/몬스터/' | relative_url }}">몬스터부터 보기</a>
    <a class="button" href="{{ '/docs/probabilities/' | relative_url }}">확률 먼저 보기</a>
  </div>
</section>

<section aria-labelledby="snapshot-title">
  <div class="section-heading">
    <p class="eyebrow">지금 담긴 것</p>
    <h2 id="snapshot-title">무엇을 찾아볼 수 있나</h2>
  </div>
  <div class="metric-grid">
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived.monsterCodex.rowCount }}</strong><span>몬스터</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived.itemCodex.rowCount | default: item_table.rowCount }}</strong><span>아이템</span></article>
    <article class="metric-card"><strong>{{ skill_table.rowCount }}</strong><span>무공</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived.zoneAtlas.rowCount }}</strong><span>지역</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived.rewardProbabilities.groupCount }}</strong><span>확률을 계산한 보상</span></article>
  </div>
  <p class="snapshot-note">패치 <code>{{ site.data.generated_manifest.patch }}</code> · {{ site.data.generated_manifest.extractedAt | date: '%Y-%m-%d' }} 확인. 원본 표 {{ site.data.generated_manifest.tableCount }}개와 전체 {% include number.html value=site.data.generated_manifest.totalRows %}줄은 <a href="{{ '/docs/data/tables/' | relative_url }}">그대로의 기록</a>에 있습니다.</p>
</section>

<section aria-labelledby="topics-title">
  <div class="section-heading">
    <p class="eyebrow">분야별 장부</p>
    <h2 id="topics-title">무엇이 궁금한가요</h2>
  </div>
  <div class="topic-grid">
    <a class="topic-card" href="{{ '/docs/무공/' | relative_url }}"><span>낱장</span><strong>무공 한 장씩</strong><small>문파별 무공과 공격 배율, 익히는 법</small></a>
    <a class="topic-card" href="{{ '/docs/아이템/' | relative_url }}"><span>낱장</span><strong>아이템 한 장씩</strong><small>능력치와 얻는 곳을 개체마다</small></a>
    <a class="topic-card" href="{{ '/docs/몬스터/' | relative_url }}"><span>낱장</span><strong>몬스터 한 장씩</strong><small>경험치 기록, 출현 지역과 떨구는 것</small></a>
    <a class="topic-card" href="{{ '/docs/지역/' | relative_url }}"><span>낱장</span><strong>지역 한 곳씩</strong><small>레벨대와 등장 몬스터, 아이템 후보</small></a>
    <a class="topic-card" href="{{ '/docs/equipment/' | relative_url }}"><span>장비</span><strong>무엇을 입을까</strong><small>능력치와 등급을 나란히 놓고 견주기</small></a>
    <a class="topic-card" href="{{ '/docs/bestiary/' | relative_url }}"><span>도감</span><strong>무엇을 모을까</strong><small>{{ collection_table.rowCount }}가지 등록으로 영구히 붙는 능력치</small></a>
    <a class="topic-card" href="{{ '/docs/food/' | relative_url }}"><span>음식</span><strong>무엇이 나올까</strong><small>요리 {{ cook_level_table.rowCount }}단계에서 가장 잘 나오는 것</small></a>
    <a class="topic-card" href="{{ '/docs/map/' | relative_url }}"><span>세계</span><strong>어디서 잡을까</strong><small>지역별 레벨대와 일일 도전 {{ site.data.generated_manifest.derived.dailyChallengeStages.rowCount }}단계</small></a>
    <a class="topic-card" href="{{ '/docs/enhance/' | relative_url }}"><span>성장</span><strong>얼마나 깨질까</strong><small>단계별 성공 · 실패 · 파괴 확률</small></a>
    <a class="topic-card" href="{{ '/docs/refine/' | relative_url }}"><span>계산기</span><strong>제련 조합 확률</strong><small>원하는 옵션이 나올 확률과 평균 시도 횟수</small></a>
    <a class="topic-card" href="{{ '/docs/skills/' | relative_url }}"><span>무공</span><strong>무엇이 셀까</strong><small>{{ skill_table.rowCount }}가지 무공의 위력과 수련 성공률</small></a>
  </div>
</section>

<aside class="callout">
  <p class="eyebrow">이 위키를 믿어도 되나</p>
  <h2>말할 수 있는 것과 없는 것을 나눠 적습니다.</h2>
  <p>여기 숫자는 게임이 내려받는 데이터를 그대로 옮긴 것입니다. 계산식이 클라이언트에 남아 있는 확률만 계산하고, 서버가 판정하는 부분은 <strong>모른다고 적습니다</strong>. 어떤 쪽이든 쪽마다 출처를 펼쳐 확인할 수 있습니다.</p>
  <a href="{{ '/docs/data-catalog/' | relative_url }}">무엇까지 확인했는지 읽기 →</a>
</aside>
