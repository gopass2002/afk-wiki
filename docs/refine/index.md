---
title: 제련 확률과 옵션
layout: default
permalink: /docs/refine/
page_scripts:
  - /assets/js/refine-calculator.js
---

# 제련 확률과 옵션

배포본 `{{ site.data.generated_manifest.appVersion }}` / 패치 `{{ site.data.generated_manifest.patch }}`의 제련 테이블 여섯 개를 계산 가능한 형태로 정리했습니다. 아래 계산기는 [제련 옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }})과 [옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }}) 파생 데이터를 그대로 읽으므로, 데이터를 다시 추출하면 계산 결과도 함께 바뀝니다.

<section class="refine-calculator" data-refine-calculator data-state="loading" data-grade="S" aria-labelledby="rc-title">
  <h2 id="rc-title" class="visually-hidden">제련 조합 계산기</h2>

  <p class="rc-status notice" data-rc="status" role="status">계산기 데이터를 불러오는 중입니다. JavaScript가 필요하며, 원본은 <a href="{{ '/assets/data/derived/refine-options.json' | relative_url }}">refine-options.json</a>에 있습니다.</p>

  <div class="rc-controls">
    <div class="rc-field">
      <p class="rc-label" id="rc-pool-label">장비 — 옵션 풀이 같은 종류끼리 묶입니다</p>
      <div class="rc-row" data-rc="pools" role="group" aria-labelledby="rc-pool-label"></div>
      <p class="rc-label" data-rc="poolNote" style="margin-top:10px"></p>
    </div>

    <div class="rc-field">
      <p class="rc-label" id="rc-grade-label">장비 등급 — 옵션 풀은 그대로, 회당 은량만 달라집니다</p>
      <div class="rc-row" data-rc="grades" role="group" aria-labelledby="rc-grade-label"></div>
    </div>

    <div class="rc-field">
      <p class="rc-label" id="rc-target-label">목표 옵션 — 최대 3줄, 순서는 무관</p>
      <div data-rc="targets" role="group" aria-labelledby="rc-target-label"></div>
    </div>

    <div class="rc-field">
      <p class="rc-label" id="rc-mode-label">슬롯 해석 <em>서버 판정이라 미확정</em></p>
      <div class="rc-row" data-rc="modes" role="group" aria-labelledby="rc-mode-label">
        <button class="rc-chip" type="button" data-mode="roll" aria-pressed="true">매 시도 슬롯 추첨</button>
        <button class="rc-chip" type="button" data-mode="persist" aria-pressed="false">3줄 열린 상태 유지</button>
      </div>
    </div>
  </div>

  <div class="rc-readout">
    <p class="rc-question" data-rc="question"></p>
    <p class="rc-big"><span data-rc="big">—</span><span>%</span></p>
    <p class="rc-sub" data-rc="sub"></p>

    <div class="rc-instrument">
      <div class="rc-axis" aria-hidden="true">
        <span class="rc-axis__tick" style="left:0%"><span>100%</span></span>
        <span class="rc-axis__tick" style="left:20%"><span>1%</span></span>
        <span class="rc-axis__tick" style="left:40%"><span>0.01%</span></span>
        <span class="rc-axis__tick" style="left:60%"><span>10⁻⁴%</span></span>
        <span class="rc-axis__tick" style="left:80%"><span>10⁻⁶%</span></span>
        <span class="rc-axis__tick" style="left:100%"><span>10⁻⁸%</span></span>
        <span class="rc-axis__flag" data-rc="flag"></span>
        <span class="rc-axis__cursor" data-rc="cursor"></span>
      </div>

      <dl class="rc-stats">
        <div><dt>평균 시도</dt><dd data-rc="stat1">—<small>회</small></dd></div>
        <div><dt>절반이 성공하는 지점</dt><dd data-rc="stat2">—<small>회</small></dd></div>
        <div><dt>열에 아홉이 성공</dt><dd data-rc="stat3">—<small>회</small></dd></div>
        <div><dt>지정한 줄</dt><dd data-rc="stat4">—<small>줄</small></dd></div>
      </dl>
    </div>

    <div class="rc-cost">
      <h3 data-rc="costTitle">비용과 재료</h3>
      <div class="rc-scroll">
        <table class="rc-table rc-table--stack">
          <thead><tr><th scope="col">도달 목표</th><th scope="col" class="rc-n">연마 시도</th><th scope="col" class="rc-n">은량</th><th scope="col" class="rc-n">연마석</th></tr></thead>
          <tbody data-rc="costRows"></tbody>
        </table>
      </div>
    </div>

    <details class="rc-fold">
      <summary data-rc="breakTitle">계산 분해</summary>
      <div class="rc-scroll">
        <table class="rc-table rc-table--stack">
          <thead><tr><th scope="col">열린 줄</th><th scope="col" class="rc-n">그 상태가 될 확률</th><th scope="col" class="rc-n">조합 일치</th><th scope="col" class="rc-n">기여</th></tr></thead>
          <tbody data-rc="breakRows"></tbody>
        </table>
      </div>
      <p class="rc-equation" data-rc="breakEquation"></p>
    </details>
  </div>

  <div class="rc-pool">
    <div class="rc-pool__head">
      <h3 data-rc="poolTitle">옵션 풀</h3>
      <p class="rc-pool__meta" data-rc="poolMeta"></p>
    </div>
    <label class="visually-hidden" for="rc-find">옵션 검색</label>
    <input class="rc-find" id="rc-find" data-rc="find" type="search" placeholder="옵션 검색" autocomplete="off">
    <div class="rc-scroll">
      <table class="rc-table">
        <thead><tr><th scope="col">옵션</th><th scope="col">내부 키</th><th scope="col" class="rc-n">가중치</th><th scope="col" class="rc-n">한 줄 확률</th><th scope="col" class="rc-n" data-rc="valueHead">수치</th></tr></thead>
        <tbody data-rc="poolRows"></tbody>
      </table>
    </div>
  </div>

  <button class="rc-dock" type="button" data-rc="dock" aria-label="계산 결과로 돌아가기">
    <span class="rc-dock__rail"><i data-rc="dockCursor"></i></span>
    <span class="rc-dock__grid">
      <span><b data-rc="dockP">—</b><em>1회 확률 %</em></span>
      <span><b data-rc="dockN">—</b><em>평균 시도</em></span>
      <span><b data-rc="dockG">—</b><em>은량</em></span>
    </span>
  </button>
</section>

## 계산에 쓴 값

### 슬롯 해금

[`refine-slot`]({{ '/docs/data/tables/refine-slot/' | relative_url }})의 `unlockRate`는 1번 슬롯 100%, 2번 슬롯 5%, 3번 슬롯 1%입니다. 계산기는 2·3번 슬롯을 독립 판정으로 보고 열린 줄 수 분포를 만듭니다. 이 독립 가정과 재연마 시 기존 줄이 유지되는지는 서버 판정이라 배포 데이터로 확인할 수 없어, **슬롯 해석**을 두 가지로 나눠 두었습니다.

### 옵션 등급

[`refine-grade-pool`]({{ '/docs/data/tables/refine-grade-pool/' | relative_url }})의 15개 행은 장비 등급 1~5와 슬롯 1~3에서 모두 같은 가중치를 사용합니다.

| 등급 | 가중치 | 정규화 확률 |
|---|---:|---:|
| D | 4,000 | 40% |
| C | 3,000 | 30% |
| B | 1,800 | 18% |
| A | 900 | 9% |
| S | 300 | 3% |

합계는 10,000입니다. 계산기의 `등급 이상` 확률은 이 표의 꼬리 합입니다. 예를 들어 A 이상은 9% + 3% = 12%입니다.

### 옵션 풀

[`refine`]({{ '/docs/data/tables/refine/' | relative_url }}) 90행(장비 종류 18 × 등급 5)의 `attrValue`는 옵션별 가중치입니다. 90행을 전수 대조하면 **서로 다른 풀은 다섯 개뿐**이고, 같은 종류라면 장비 등급이 달라도 풀이 동일합니다.

{% assign pool_meta = site.data.generated_manifest.derived.refineOptions %}
| 풀 | 장비 종류 |
|---|---|
| 무기 계열 | 검 · 도 · 창 · 봉 · 암기 |
| 모자 · 장갑 | 모자 · 장갑 |
| 방어구 계열 | 상의 · 하의 · 견갑 · 요대 · 호완 · 경갑 · 수련주 |
| 신발 | 신발 |
| 장신구 | 귀걸이 · 반지 · 목걸이 |

이 묶음은 손으로 정한 것이 아니라 옵션·가중치 구성이 같은 행을 데이터에서 계산한 결과이며, 파생 데이터의 `poolGroup` 필드로 저장돼 있습니다.

### 비용

장비 등급 1~5의 은량 비용은 [`refine-attempt`]({{ '/docs/data/tables/refine-attempt/' | relative_url }}) 기준 1,000 / 3,000 / 5,000 / 10,000 / 20,000이며, [`refine-config`]({{ '/docs/data/tables/refine-config/' | relative_url }})에 연마석(`itemId 90000000`) 1개가 기록돼 있습니다. 등급 이름(범·영·현·선·신)은 `FBDataStringItem_ko`의 `GradeType_*` 문자열이고, 등급 번호 1~5와의 대응은 `FBDataCookEfficiency`의 등급 순서를 근거로 맞췄습니다.

## 확인할 수 없는 것

- 재연마 시 기존 옵션 줄이 유지되는지, 슬롯 해금이 매 시도 다시 판정되는지는 서버 로직입니다.
- 서버 난수 시드, 계정·이벤트 보정, 보장 횟수는 배포 데이터에 없습니다.
- 계산기의 수치는 클라이언트 데이터로 만든 **기댓값**이며, 실제 시행 결과를 보장하지 않습니다.

## 원본과 파생 데이터

[제련 옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }}) · [제련 옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }}) · [refine]({{ '/docs/data/tables/refine/' | relative_url }}) · [refine-attribute]({{ '/docs/data/tables/refine-attribute/' | relative_url }}) · [refine-slot]({{ '/docs/data/tables/refine-slot/' | relative_url }}) · [refine-grade-pool]({{ '/docs/data/tables/refine-grade-pool/' | relative_url }}) · [refine-attempt]({{ '/docs/data/tables/refine-attempt/' | relative_url }}) · [refine-config]({{ '/docs/data/tables/refine-config/' | relative_url }})
