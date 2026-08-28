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
  <p class="hero__lead">장비와 도감부터 음식, 지도, 강화·제련, 획득 확률까지 게임이 내려받는 데이터를 검색 가능한 위키로 정리했습니다.</p>
  <div class="hero__actions">
    <a class="button button--primary" href="{{ '/docs/data/tables/' | relative_url }}">{{ site.data.generated_manifest.tableCount }}개 테이블 탐색</a>
    <a class="button" href="{{ '/docs/probabilities/' | relative_url }}">확률 계산표 보기</a>
  </div>
</section>

<section aria-labelledby="snapshot-title">
  <div class="section-heading">
    <p class="eyebrow">현재 스냅샷</p>
    <h2 id="snapshot-title">한눈에 보는 추출 범위</h2>
  </div>
  <div class="metric-grid">
    <article class="metric-card"><strong>{{ site.data.generated_manifest.tableCount }}</strong><span>FlatBuffer 테이블</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.totalRows }}</strong><span>검색 가능한 원본 행</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived.rewardProbabilities.groupCount }}</strong><span>계산된 보상 풀</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.derived | size }}</strong><span>결합 파생 데이터셋</span></article>
    <article class="metric-card"><strong>{{ site.data.generated_manifest.patch }}</strong><span>PatchResource</span></article>
  </div>
</section>

<section aria-labelledby="topics-title">
  <div class="section-heading">
    <p class="eyebrow">분야별 장부</p>
    <h2 id="topics-title">찾고 싶은 데이터부터 시작하세요</h2>
  </div>
  <div class="topic-grid">
    <a class="topic-card" href="{{ '/docs/무공/' | relative_url }}"><span>낱장</span><strong>무공 한 장씩</strong><small>문파별 무공과 공격 배율, 익히는 법</small></a>
    <a class="topic-card" href="{{ '/docs/아이템/' | relative_url }}"><span>낱장</span><strong>아이템 한 장씩</strong><small>능력치와 얻는 곳을 개체마다</small></a>
    <a class="topic-card" href="{{ '/docs/몬스터/' | relative_url }}"><span>낱장</span><strong>몬스터 한 장씩</strong><small>출현 지역과 떨구는 것</small></a>
    <a class="topic-card" href="{{ '/docs/equipment/' | relative_url }}"><span>장비</span><strong>아이템 · 속성 · 강화 재료</strong><small>{{ item_table.rowCount }}개 아이템과 성장 테이블</small></a>
    <a class="topic-card" href="{{ '/docs/bestiary/' | relative_url }}"><span>도감</span><strong>등록 규칙 · 단계 · 보상</strong><small>{{ collection_table.rowCount }}개 도감 항목과 {{ site.data.generated_manifest.derived.collectionMilestones.rowCount }}개 단계 보상</small></a>
    <a class="topic-card" href="{{ '/docs/food/' | relative_url }}"><span>음식</span><strong>조리 레벨 · 효율 · 결과</strong><small>{{ cook_level_table.rowCount }}개 조리 단계의 보상 확률</small></a>
    <a class="topic-card" href="{{ '/docs/map/' | relative_url }}"><span>세계</span><strong>지역 · 스폰 · 몬스터</strong><small>{{ zone_table.rowCount }}개 지역과 몬스터 {{ site.data.generated_manifest.derived.monsterCodex.rowCount }}종의 능력치·출현지·드롭</small></a>
    <a class="topic-card" href="{{ '/docs/enhance/' | relative_url }}"><span>성장</span><strong>강화 · 제련</strong><small>성공/실패/파괴 표시식과 옵션 풀</small></a>
    <a class="topic-card" href="{{ '/docs/refine/' | relative_url }}"><span>계산기</span><strong>제련 조합 확률</strong><small>목표 옵션 조합의 확률·평균 시도·은량을 계산합니다</small></a>
    <a class="topic-card" href="{{ '/docs/skills/' | relative_url }}"><span>무공</span><strong>스킬 · 레벨 · 강화</strong><small>{{ skill_table.rowCount }}개 무공과 {{ skill_level_table.rowCount }}개 레벨 행</small></a>
  </div>
</section>

<aside class="callout">
  <p class="eyebrow">증거 원칙</p>
  <h2>클라이언트 데이터와 서버 판정을 구분합니다.</h2>
  <p>모든 원본 행에는 앱 버전, 패치 해시, 스키마와 추출 시점이 함께 기록됩니다. 코드로 확인한 공식만 계산하며, 서버 난수와 숨은 보정은 추측하지 않습니다.</p>
  <a href="{{ '/docs/data-catalog/' | relative_url }}">데이터 범위와 한계 읽기 →</a>
</aside>
