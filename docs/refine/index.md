---
title: 제련 확률과 옵션
layout: default
permalink: /docs/refine/
page_scripts:
  - /assets/js/refine-calculator.js
---

# 제련 확률과 옵션

배포본 `{{ site.data.generated_manifest.appVersion }}` / 패치 `{{ site.data.generated_manifest.patch }}`의 제련 테이블 여섯 개를 계산 가능한 형태로 정리했습니다. 아래 계산기는 [제련 옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }})과 [옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }}) 파생 데이터를 그대로 읽으므로, 데이터를 다시 추출하면 계산 결과도 함께 바뀝니다.

<section class="refine-calculator" data-refine-calculator data-state="loading" data-grade="S" data-target-mode="grade" aria-labelledby="rc-title">
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
      <p class="rc-label" id="rc-target-mode-label">계산 대상</p>
      <div class="rc-row" data-rc="targetModes" role="group" aria-labelledby="rc-target-mode-label">
        <button class="rc-chip" type="button" data-target-mode="grade" aria-pressed="true">등급만</button>
        <button class="rc-chip" type="button" data-target-mode="option" aria-pressed="false">특정 옵션 + 등급</button>
      </div>
    </div>

    <div class="rc-field">
      <p class="rc-label" id="rc-target-label">목표 줄 — 최대 3줄, 순서는 무관</p>
      <div data-rc="targets" role="group" aria-labelledby="rc-target-label"></div>
    </div>

    <div class="rc-field">
      <p class="rc-label" id="rc-slot-label">현재 열린 슬롯 — 열린 슬롯은 재연마 후에도 유지됩니다</p>
      <div class="rc-row" data-rc="slots" role="group" aria-labelledby="rc-slot-label">
        <button class="rc-chip" type="button" data-slots="1" aria-pressed="false">1줄</button>
        <button class="rc-chip" type="button" data-slots="2" aria-pressed="false">2줄</button>
        <button class="rc-chip" type="button" data-slots="3" aria-pressed="true">3줄</button>
      </div>
      <p class="rc-label" style="margin-top:10px">재연마하면 슬롯 수는 그대로이고, 열린 모든 줄의 기존 옵션과 등급을 다시 추첨합니다.</p>
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
          <thead><tr><th scope="col">열린 줄</th><th scope="col" class="rc-n">슬롯 유지</th><th scope="col" class="rc-n">조합 일치</th><th scope="col" class="rc-n">최종 확률</th></tr></thead>
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

[`refine-slot`]({{ '/docs/data/tables/refine-slot/' | relative_url }})의 `unlockRate`는 1번 슬롯 100%, 2번 슬롯 5%, 3번 슬롯 1%입니다. 이 값은 배포 데이터에 기록된 슬롯별 해금률이며, 재연마할 때마다 열린 슬롯을 다시 판정한다는 뜻은 아닙니다.

실제 플레이에서 확인한 동작은 다음과 같습니다.

- 한 번 열린 슬롯은 이후 재연마에서도 닫히지 않습니다.
- 재연마하면 기존 옵션 줄은 유지되지 않고, 열린 모든 줄의 옵션과 등급을 다시 추첨합니다.

따라서 계산기는 `unlockRate`를 재연마 확률에 다시 곱하지 않습니다. 현재 장비에서 열린 슬롯 수를 1~3줄 중 고르면 그 수를 고정해 계산하며, 기본값은 3줄입니다.

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

**등급만** 계산은 옵션 종류와 무관하게 열린 줄의 등급 조합만 셉니다. 예를 들어 열린 3줄에서 `S/S/*`를 만족할 확률은 S가 두 줄 이상 나올 확률인 `0.2646%`(약 378번에 한 번)입니다. **특정 옵션 + 등급** 계산은 선택한 옵션의 풀 가중치까지 곱하므로 같은 S 목표라도 훨씬 낮을 수 있습니다.

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

- 아직 닫힌 슬롯의 정확한 해금 판정 시점과 조건은 배포 데이터만으로 확인할 수 없습니다.
- 서버 난수 시드, 계정·이벤트 보정, 보장 횟수는 배포 데이터에 없습니다.
- 계산기의 수치는 클라이언트 데이터로 만든 **기댓값**이며, 실제 시행 결과를 보장하지 않습니다.

## 원본과 파생 데이터

[제련 옵션 풀]({{ '/docs/data/derived/refine-options/' | relative_url }}) · [제련 옵션 수치 범위]({{ '/docs/data/derived/refine-attribute-values/' | relative_url }}) · [refine]({{ '/docs/data/tables/refine/' | relative_url }}) · [refine-attribute]({{ '/docs/data/tables/refine-attribute/' | relative_url }}) · [refine-slot]({{ '/docs/data/tables/refine-slot/' | relative_url }}) · [refine-grade-pool]({{ '/docs/data/tables/refine-grade-pool/' | relative_url }}) · [refine-attempt]({{ '/docs/data/tables/refine-attempt/' | relative_url }}) · [refine-config]({{ '/docs/data/tables/refine-config/' | relative_url }})
