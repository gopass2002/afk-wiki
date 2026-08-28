(() => {
  "use strict";

  const root = document.querySelector("[data-refine-calculator]");
  if (!root) return;

  const $ = (id) => root.querySelector(`[data-rc="${id}"]`);
  const baseurl = String(document.body.dataset.baseurl || "").replace(/\/+$/, "");
  const GRADES = ["D", "C", "B", "A", "S"];
  const locale = "ko-KR";

  /* ── 표기 ─────────────────────────────────────────────── */
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const SUB = { 1: "₁", 2: "₂", 3: "₃" };
  const sup = (n) => String(n).split("").map((c) => SUP[c] ?? c).join("");
  const sub = (n) => SUB[String(n)] ?? String(n);

  const fmtPct = (x) => {
    if (!isFinite(x) || x <= 0) return "0";
    if (x >= 10) return x.toFixed(2);
    if (x >= 1) return x.toFixed(3);
    if (x >= 0.01) return x.toFixed(4);
    if (x >= 0.0001) return x.toFixed(6);
    const e = Math.floor(Math.log10(x));
    return `${(x / 10 ** e).toFixed(2)}×10${sup(e)}`;
  };

  // 만·억·조 — 자릿수가 커지면 숫자보다 규모가 정보다
  const kNum = (n) => {
    if (!isFinite(n)) return "∞";
    if (n < 10000) return Math.round(n).toLocaleString(locale);
    if (n >= 1e12) return `${(n / 1e12).toFixed(n / 1e12 < 10 ? 2 : 1)}조`;
    if (n >= 1e8) return `${(n / 1e8).toFixed(n / 1e8 < 10 ? 2 : 1)}억`;
    return `${(n / 1e4).toFixed(n / 1e4 < 10 ? 1 : 0)}만`;
  };

  // 한국어 목적격 조사 — 받침 유무로 갈린다
  const eul = (word) => {
    const code = word.charCodeAt(word.length - 1);
    return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 ? "을" : "를";
  };

  const axisPos = (percent) => {
    if (!(percent > 0)) return 100;
    return Math.max(0, Math.min(100, ((2 - Math.log10(percent)) / 10) * 100));
  };

  /* ── 수학 ─────────────────────────────────────────────── */
  // n줄이 열렸을 때 지정한 k개 목표가 모두 최소 한 번 등장할 확률.
  // n이 3 이하라 닫힌식으로 전개한다. 포함배제식은 p가 작아지면 상대오차가 커진다.
  const allPresent = (ps, n) => {
    const k = ps.length;
    if (k === 0) return 1;
    if (k > n) return 0;
    if (k === 1) {
      const p = ps[0];
      return n === 1 ? p : n === 2 ? p * (2 - p) : p * (3 - 3 * p + p * p);
    }
    if (k === 2) {
      const [a, b] = ps;
      return n === 2 ? 2 * a * b : 3 * a * b * (2 - a - b);
    }
    return 6 * ps[0] * ps[1] * ps[2];
  };

  const tries = (P, target) => {
    if (P <= 0) return Infinity;
    if (P >= 1) return 1;
    return Math.ceil(Math.log(1 - target) / Math.log(1 - P));
  };

  const FORMULA = {
    1: "1줄 지정 → p₁(3 − 3p₁ + p₁²)  ·  3줄 열림 기준",
    2: "2줄 지정 → 3 · p₁p₂(2 − p₁ − p₂)  ·  3줄 열림 기준",
    3: "3줄 지정 → 3! · p₁p₂p₃",
  };

  /* ── 상태 ─────────────────────────────────────────────── */
  const state = {
    pools: [],
    valuesByAttr: new Map(),
    poolGroup: null,
    grade: null,
    mode: "roll",
    active: 0,
    find: "",
    targets: [{ k: null, g: "S" }, { k: null, g: "S" }, { k: null, g: "B" }],
  };

  const currentPool = () => state.pools.find((pool) => pool.group === state.poolGroup);
  const currentRow = () => currentPool()?.rows.find((row) => row.itemGrade === state.grade);
  const activeTargets = () => state.targets.filter((target) => target.k);

  // 등급 X 이상이 뜰 확률 — D~S 가중치의 꼬리 합
  const gradeAtLeast = (row, grade) => {
    const odds = row?.slots?.[0]?.gradeOdds ?? [];
    const index = odds.findIndex((entry) => entry.grade === grade);
    if (index < 0) return 0;
    return odds.slice(index).reduce((sum, entry) => sum + (entry.percent ?? 0), 0) / 100;
  };

  // 열린 줄 수 분포 — 1번 슬롯은 항상 열리고 2·3번은 각자 해금률로 독립 판정한다
  const slotDistribution = (row) => {
    const rates = (row?.slots ?? []).map((slot) => (slot.unlockPercent ?? 0) / 100);
    const [, second = 0, third = 0] = rates;
    return [
      { n: 1, q: (1 - second) * (1 - third) },
      { n: 2, q: second * (1 - third) + third * (1 - second) },
      { n: 3, q: second * third },
    ];
  };

  const lineP = (row, key, grade) => {
    const option = row?.options.find((entry) => entry.attrKey === key);
    return option ? (option.weight / row.optionWeightTotal) * gradeAtLeast(row, grade) : 0;
  };

  const perAttempt = () => {
    const row = currentRow();
    const ps = activeTargets().map((target) => lineP(row, target.k, target.g));
    if (state.mode === "persist") return { P: allPresent(ps, 3), ps };
    const P = slotDistribution(row).reduce((sum, slot) => sum + slot.q * allPresent(ps, slot.n), 0);
    return { P, ps };
  };

  const valueText = (attrKey, grade) => {
    const entry = state.valuesByAttr.get(`${attrKey}:${grade}`);
    if (!entry) return "—";
    const format = (value) => (entry.percentDisplay ? `${value.toFixed(2)}%` : value.toLocaleString(locale));
    return entry.displayMin === entry.displayMax
      ? format(entry.displayMin)
      : `${format(entry.displayMin)} ~ ${format(entry.displayMax)}`;
  };

  /* ── 조립 ─────────────────────────────────────────────── */
  function buildPools() {
    const wrap = $("pools");
    wrap.innerHTML = "";
    for (const pool of state.pools) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rc-chip";
      button.dataset.pool = String(pool.group);
      button.textContent = pool.labels.join(" · ");
      button.addEventListener("click", () => {
        state.poolGroup = pool.group;
        for (const target of state.targets) {
          if (target.k && !pool.rows[0].options.some((option) => option.attrKey === target.k)) target.k = null;
        }
        if (activeTargets().length === 0) state.targets[0].k = pool.rows[0].options[0].attrKey;
        render();
      });
      wrap.appendChild(button);
    }
  }

  function buildGrades() {
    const wrap = $("grades");
    wrap.innerHTML = "";
    const byGrade = new Map();
    for (const row of state.pools[0]?.rows ?? []) {
      if (!byGrade.has(row.itemGrade)) byGrade.set(row.itemGrade, row);
    }
    const rows = [...byGrade.values()].sort((left, right) => left.itemGrade - right.itemGrade);
    for (const row of rows) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rc-chip";
      button.dataset.grade = String(row.itemGrade);
      button.innerHTML = `${row.itemGradeLabel || row.itemGradeName}<small>${row.silverCost.toLocaleString(locale)}</small>`;
      button.setAttribute("aria-label", `${row.itemGradeLabel} 등급 — 회당 은량 ${row.silverCost.toLocaleString(locale)}`);
      button.addEventListener("click", () => {
        state.grade = row.itemGrade;
        render();
      });
      wrap.appendChild(button);
    }
  }

  function buildTargets() {
    const wrap = $("targets");
    wrap.innerHTML = "";
    state.targets.forEach((target, index) => {
      const row = document.createElement("div");
      row.className = "rc-target";
      row.addEventListener("click", () => {
        state.active = index;
        render();
      });

      const number = document.createElement("span");
      number.className = "rc-target__n";
      number.textContent = `${index + 1}줄`;
      row.appendChild(number);

      const select = document.createElement("select");
      select.className = "rc-target__select";
      select.setAttribute("aria-label", `${index + 1}줄 목표 옵션`);
      select.addEventListener("change", (event) => {
        const value = event.target.value;
        state.targets[index].k = value || null;
        if (value) {
          state.targets.forEach((other, otherIndex) => {
            if (otherIndex !== index && other.k === value) other.k = null;
          });
        }
        state.active = index;
        render();
      });
      row.appendChild(select);

      const grades = document.createElement("span");
      grades.className = "rc-target__grades";
      for (const grade of GRADES) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "rc-gchip";
        button.dataset.g = grade;
        button.textContent = grade;
        button.setAttribute("aria-label", `${grade} 이상`);
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          state.targets[index].g = grade;
          state.active = index;
          render();
        });
        grades.appendChild(button);
      }
      row.appendChild(grades);

      const hint = document.createElement("span");
      hint.className = "rc-target__hint";
      hint.textContent = "옵션을 고르면 등급을 정합니다";
      row.appendChild(hint);

      if (index > 0) {
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "rc-target__clear";
        clear.textContent = "×";
        clear.setAttribute("aria-label", `${index + 1}줄 목표 지우기`);
        clear.addEventListener("click", (event) => {
          event.stopPropagation();
          state.targets[index].k = null;
          render();
        });
        row.appendChild(clear);
      }
      wrap.appendChild(row);
    });
  }

  function syncTargets(row) {
    const nodes = $("targets").children;
    state.targets.forEach((target, index) => {
      const node = nodes[index];
      node.dataset.active = String(state.active === index);
      node.dataset.empty = String(!target.k);

      const select = node.querySelector("select");
      const markup = ['<option value="">지정 안 함</option>']
        .concat(
          [...row.options]
            .sort((left, right) => left.label.localeCompare(right.label, "ko"))
            .map((option) => `<option value="${option.attrKey}">${option.label}</option>`),
        )
        .join("");
      if (select.innerHTML !== markup) select.innerHTML = markup;
      select.value = target.k || "";

      for (const button of node.querySelectorAll(".rc-gchip")) {
        button.setAttribute("aria-pressed", String(target.k != null && button.dataset.g === target.g));
        button.disabled = !target.k;
      }
      const clear = node.querySelector(".rc-target__clear");
      if (clear) clear.style.visibility = target.k ? "visible" : "hidden";
    });
  }

  /* ── 그리기 ───────────────────────────────────────────── */
  function render() {
    const pool = currentPool();
    const row = currentRow();
    if (!pool || !row) return;
    const targets = activeTargets();
    const count = targets.length;

    for (const button of $("pools").children) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.pool) === state.poolGroup));
    }
    for (const button of $("grades").children) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.grade) === state.grade));
    }
    for (const button of $("modes").querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    }
    $("poolNote").textContent =
      `${pool.labels.join(" · ")} — 옵션 ${row.options.length}종 · 총 가중치 ${row.optionWeightTotal.toLocaleString(locale)}`;
    syncTargets(row);

    const active = state.targets[state.active].k ? state.targets[state.active] : targets[0] ?? { g: "S" };
    root.dataset.grade = active.g;

    const { P, ps } = perAttempt();
    const label = targets.map((target) => `<b>${row.options.find((o) => o.attrKey === target.k).label}</b> ${target.g}↑`).join(" + ");
    const subject = pool.labels[pool.labels.length - 1];
    $("question").innerHTML = count
      ? `<b>${pool.labels.join(" · ")}</b>${eul(subject)} 한 번 연마해서 ${label} ${count > 1 ? "가 모두" : "가"} 붙을 확률`
        + (state.mode === "persist" ? " <em>· 3줄 열린 상태 기준</em>" : "")
      : "목표 옵션을 한 줄 이상 고르세요.";
    $("big").textContent = count ? fmtPct(P * 100) : "—";
    $("sub").innerHTML = count
      ? (P > 0 ? `약 <b>${kNum(1 / P)}</b>번에 한 번` : "이 조합은 나올 수 없습니다")
      : "옵션과 등급을 정하면 계산합니다";

    const position = axisPos(P * 100);
    $("cursor").style.left = `${position}%`;
    const flag = $("flag");
    flag.style.left = `${position}%`;
    flag.textContent = count ? `${fmtPct(P * 100)}%` : "";
    flag.style.transform = position > 86 ? "translateX(-100%)" : position < 7 ? "translateX(0)" : "translateX(-50%)";

    $("stat1").innerHTML = `${P > 0 ? kNum(1 / P) : "—"}<small>회</small>`;
    $("stat2").innerHTML = `${kNum(tries(P, 0.5))}<small>회</small>`;
    $("stat3").innerHTML = `${kNum(tries(P, 0.9))}<small>회</small>`;
    $("stat4").innerHTML = `${count}<small>줄</small>`;

    $("costTitle").innerHTML =
      `비용과 재료 — <b>${row.itemGradeLabel}</b> 등급 · 회당 은량 <span class="rc-mono">${row.silverCost.toLocaleString(locale)}</span> + ${row.stoneItemName} ${row.stoneAmount}`;
    $("costRows").innerHTML = [
      ["평균", P > 0 ? 1 / P : Infinity],
      ["절반이 성공", tries(P, 0.5)],
      ["열에 아홉이 성공", tries(P, 0.9)],
    ]
      .map(([label, n]) =>
        `<tr><td data-l="도달 목표">${label}</td><td class="rc-n" data-l="연마 시도">${kNum(n)}</td>`
        + `<td class="rc-n" data-l="은량">${kNum(n * row.silverCost)}</td>`
        + `<td class="rc-n" data-l="${row.stoneItemName}">${kNum(n * row.stoneAmount)}</td></tr>`)
      .join("");

    $("dockP").textContent = count ? fmtPct(P * 100) : "—";
    $("dockN").textContent = P > 0 ? kNum(1 / P) : "—";
    $("dockG").textContent = P > 0 ? kNum(row.silverCost / P) : "—";
    $("dockCursor").style.left = `calc(${position}% - 1.5px)`;

    const breakdown = $("breakRows");
    if (state.mode === "persist") {
      $("breakTitle").textContent = "계산 분해 — 3줄 열린 상태 기준";
      const match = allPresent(ps, 3);
      breakdown.innerHTML =
        `<tr><td data-l="열린 줄">3줄</td><td class="rc-n" data-l="그 상태가 될 확률">100%</td>`
        + `<td class="rc-n" data-l="조합 일치">${fmtPct(match * 100)}%</td><td class="rc-n" data-l="기여">${fmtPct(match * 100)}%</td></tr>`;
    } else {
      $("breakTitle").textContent = "계산 분해 — 매 시도 슬롯 추첨";
      breakdown.innerHTML = slotDistribution(row)
        .map((slot) => {
          const match = allPresent(ps, slot.n);
          const contribution = slot.q * match;
          const dead = match === 0 ? " is-dead" : "";
          return `<tr><td class="${dead.trim()}" data-l="열린 줄">${slot.n}줄</td>`
            + `<td class="rc-n${dead}" data-l="그 상태가 될 확률">${(slot.q * 100).toFixed(2)}%</td>`
            + `<td class="rc-n${dead}" data-l="조합 일치">${match === 0 ? "불가" : `${fmtPct(match * 100)}%`}</td>`
            + `<td class="rc-n${dead}" data-l="기여">${contribution === 0 ? "0" : `${fmtPct(contribution * 100)}%`}</td></tr>`;
        })
        .join("")
        + `<tr><td data-l="열린 줄">합계</td><td class="rc-n" data-l="그 상태가 될 확률">100.00%</td>`
        + `<td class="rc-n" data-l="조합 일치">—</td><td class="rc-n" data-l="기여">${fmtPct(P * 100)}%</td></tr>`;
    }

    $("breakEquation").innerHTML = count
      ? targets
        .map((target, index) => {
          const option = row.options.find((entry) => entry.attrKey === target.k);
          return `<span class="rc-mono">p${sub(index + 1)} = ${option.weight} ÷ ${row.optionWeightTotal.toLocaleString(locale)}`
            + ` × ${(gradeAtLeast(row, target.g) * 100).toFixed(0)}% = ${fmtPct(ps[index] * 100)}%</span>`;
        })
        .join("<br>") + `<br><span class="rc-mono">${FORMULA[count]}</span>`
      : "";

    $("poolTitle").textContent = `${pool.labels.join(" · ")} 옵션 풀`;
    $("poolMeta").textContent = (pool.labels.length > 1 ? `${pool.labels.length}개 종류 공용` : "이 종류 전용")
      + ` · 등급 ${row.itemGradeLabel} · ${active.g} 이상 기준`;
    $("valueHead").textContent = `${active.g} 수치`;

    const query = state.find.trim();
    const options = [...row.options]
      .sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label, "ko"))
      .filter((option) => !query || option.label.includes(query) || option.attrKey.toLowerCase().includes(query.toLowerCase()));

    const body = $("poolRows");
    if (options.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="rc-empty">“${query}”에 맞는 옵션이 이 풀에는 없습니다.</td></tr>`;
    } else {
      body.innerHTML = options
        .map((option) => {
          const linePercent = (option.weight / row.optionWeightTotal) * gradeAtLeast(row, active.g) * 100;
          const selected = targets.some((target) => target.k === option.attrKey);
          return `<tr data-attr="${option.attrKey}" aria-selected="${selected}">`
            + `<td>${option.label}</td>`
            + `<td class="rc-key">${option.attrKey}</td>`
            + `<td class="rc-n">${option.weight.toLocaleString(locale)}</td>`
            + `<td class="rc-n">${fmtPct(linePercent)}%</td>`
            + `<td class="rc-n">${valueText(option.attrKey, active.g)}</td></tr>`;
        })
        .join("");
    }
  }

  /* ── 하단 고정 판독 ───────────────────────────────────── */
  function syncDock() {
    const dock = $("dock");
    const big = $("big");
    const instrument = root.querySelector(".rc-instrument");
    if (!dock || !big || !instrument) return;
    const bigRect = big.getBoundingClientRect();
    const instrumentRect = instrument.getBoundingClientRect();
    const visible = bigRect.top < window.innerHeight - 56 && bigRect.bottom > 0;
    const started = instrumentRect.top < window.innerHeight * 0.6;
    dock.classList.toggle("is-on", started && !visible);
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  async function start() {
    const [optionPayload, valuePayload] = await Promise.all([
      fetch(`${baseurl}/assets/data/derived/refine-options.json`).then((response) => {
        if (!response.ok) throw new Error(`refine-options.json ${response.status}`);
        return response.json();
      }),
      fetch(`${baseurl}/assets/data/derived/refine-attribute-values.json`).then((response) => {
        if (!response.ok) throw new Error(`refine-attribute-values.json ${response.status}`);
        return response.json();
      }),
    ]);

    const groups = new Map();
    for (const row of optionPayload.rows) {
      const group = groups.get(row.poolGroup) ?? { group: row.poolGroup, labels: row.poolSubTypeLabels, rows: [] };
      group.rows.push(row);
      groups.set(row.poolGroup, group);
    }
    state.pools = [...groups.values()].sort((left, right) => left.group - right.group);
    for (const entry of valuePayload.rows) {
      state.valuesByAttr.set(`${entry.attrKey}:${entry.grade}`, entry);
    }

    const startPool = state.pools[0];
    state.poolGroup = startPool.group;
    state.grade = Math.max(...startPool.rows.map((row) => row.itemGrade));
    const defaults = ["FINAL_DMG_BONUS", "STR"];
    const available = startPool.rows[0].options.map((option) => option.attrKey);
    state.targets[0].k = defaults.find((key) => available.includes(key)) ?? available[0];
    state.targets[1].k = defaults.filter((key) => key !== state.targets[0].k).find((key) => available.includes(key)) ?? null;

    root.dataset.state = "ready";
    $("status").hidden = true;
    buildPools();
    buildGrades();
    buildTargets();
    render();
    syncDock();

    $("find").addEventListener("input", (event) => {
      state.find = event.target.value;
      render();
    });
    $("modes").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button) {
        state.mode = button.dataset.mode;
        render();
      }
    });
    $("poolRows").addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-attr]");
      if (!row) return;
      const key = row.dataset.attr;
      const index = state.active;
      state.targets.forEach((target, targetIndex) => {
        if (targetIndex !== index && target.k === key) target.k = null;
      });
      state.targets[index].k = key;
      render();
    });

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncDock();
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", syncDock, { passive: true });
    $("dock").addEventListener("click", () => {
      root.querySelector(".rc-readout").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });

    // 넓은 화면에서는 근거와 분해를 펼쳐 둔다. 폰의 첫 화면은 답이어야지 근거가 아니다.
    if (window.matchMedia("(min-width: 48rem)").matches) {
      for (const details of root.querySelectorAll(".rc-fold")) details.open = true;
    }
  }

  start().catch((error) => {
    root.dataset.state = "error";
    const status = $("status");
    status.hidden = false;
    status.className = "notice notice--danger";
    status.innerHTML = `<strong>계산기 데이터를 불러오지 못했습니다.</strong> <span>${error.message}</span> `
      + `<a href="${baseurl}/assets/data/derived/refine-options.json">원본 JSON 열기</a>`;
  });
})();
