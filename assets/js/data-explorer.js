(() => {
  "use strict";

  const locale = "ko-KR";
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const imagePathPattern = /^\/assets\/images\/game\/(?:skills|items)\/[0-9]+\.png$/;

  /* 검증용 식별자로 보는 열 이름. 낱장에서는 숨기고 원장에만 남깁니다. */
  const ledgerOnlyPattern = /(^id$|Id$|Ids$|^key$|Key$|Keys$|Raw$|RawValues$|^prefab$|Sfx$|Vfx$|^tint$|^tmx$|^pos[XY]$|Source$|^evidence$|^interpretation$|^sortOrder$|Divisor$|^statKey$)/;
  const numericLike = (value) => typeof value === "number" && Number.isFinite(value);

  const normalize = (value) => String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase(locale)
    .trim();

  const asSearchText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  };

  const parseJsonAttribute = (element, name, fallback) => {
    try {
      const parsed = JSON.parse(element.dataset[name] || "null");
      return parsed === null ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  const compareValues = (left, right) => {
    const leftEmpty = left === null || left === undefined || left === "";
    const rightEmpty = right === null || right === undefined || right === "";
    if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? 0 : leftEmpty ? 1 : -1;
    if (typeof left === "number" && typeof right === "number") return left - right;
    if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);
    return collator.compare(asSearchText(left), asSearchText(right));
  };

  const isImageField = (field) => field === "image" || /Image$/i.test(field);

  const imageSource = (value) => {
    const path = String(value ?? "").trim();
    if (!imagePathPattern.test(path)) return "";
    const baseurl = String(document.body.dataset.baseurl || "").replace(/\/+$/, "");
    return `${baseurl}${path}`;
  };

  const imageAlt = (row, field) => {
    const relatedNameField = field === "image" ? "" : field.replace(/Image$/i, "Name");
    const label = row?.name || row?.itemName || (relatedNameField ? row?.[relatedNameField] : "");
    return label ? `${String(label)} 그림` : "";
  };

  const makeImageContent = (value, row, field, size = 56) => {
    const source = imageSource(value);
    if (!source) return null;

    const wrapper = document.createElement("span");
    wrapper.className = "data-image-cell";
    const image = document.createElement("img");
    image.className = "data-image";
    image.src = source;
    image.alt = imageAlt(row, field);
    image.loading = "lazy";
    image.decoding = "async";
    image.width = size;
    image.height = size;

    const fallback = document.createElement("span");
    fallback.className = "data-image-fallback";
    fallback.textContent = "그림 없음";
    fallback.hidden = true;
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });

    wrapper.append(image, fallback);
    return wrapper;
  };

  /* ---- 값을 사람이 읽는 글로 ---- */

  const formatNumber = (value) => value.toLocaleString(locale, { maximumFractionDigits: 2 });

  /* 코드로 적힌 값(Beast, Legendary …)을 게임 안 낱말로 바꿉니다. 사전에 없으면 그대로 둡니다. */
  let valueDictionary = {};
  let labelOf = (field) => field;
  const readValue = (value) => valueDictionary[value] ?? value;

  const formatScalar = (value, field) => {
    if (typeof value === "boolean") return value ? "예" : "아니요";
    if (numericLike(value)) {
      if (/Percent$|^percent$|^probability$/.test(field)) return `${formatNumber(value)}%`;
      if (/Seconds$/.test(field)) return `${formatNumber(value)}초`;
      return formatNumber(value);
    }
    return readValue(String(value));
  };

  /* 객체·배열을 JSON 덩어리 대신 짧은 낱말로 풉니다. */
  const summarizeValue = (value, field, limit = 3) => {
    if (value === null || value === undefined || value === "") return "";
    if (Array.isArray(value)) {
      if (!value.length) return "";
      const parts = value.map((entry) => {
        if (entry === null || entry === undefined) return "";
        if (typeof entry === "object") {
          /* 배포본이 label을 주지 않는 묶음은 key를 사전으로 옮겨 씁니다. */
          const name = entry.name ?? entry.label ?? entry.itemName ?? entry.monsterName ?? entry.zoneName
            ?? (entry.key === undefined ? undefined : readValue(String(entry.key)));
          if (field === "monsterExperience" && name !== undefined) {
            const level = numericLike(entry.level) ? `${formatNumber(entry.level)}레벨` : "";
            const experience = numericLike(entry.experience)
              ? `경험치 ${formatNumber(entry.experience)}`
              : "경험치 기록 없음";
            const details = [level, experience].filter(Boolean).join(" · ");
            return details ? `${readValue(String(name))} (${details})` : readValue(String(name));
          }
          const amount = entry.value ?? entry.amount ?? entry.percent ?? entry.count;
          if (name !== undefined && amount !== undefined) return `${name} ${formatScalar(amount, field)}`;
          if (name !== undefined) return readValue(String(name));
          return "";
        }
        return formatScalar(entry, field);
      }).filter(Boolean);
      if (!parts.length) return `${value.length.toLocaleString(locale)}개`;
      const head = parts.slice(0, limit).join(" · ");
      return parts.length > limit ? `${head} 외 ${parts.length - limit}` : head;
    }
    if (typeof value === "object") {
      const parts = Object.entries(value)
        .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
        .map(([entryKey, entryValue]) => `${labelOf(entryKey)} ${formatScalar(entryValue, entryKey)}`);
      if (!parts.length) return "";
      const head = parts.slice(0, limit).join(" · ");
      return parts.length > limit ? `${head} 외 ${parts.length - limit}` : head;
    }
    return formatScalar(value, field);
  };

  const makeCellContent = (value, row, field) => {
    if (isImageField(field)) {
      const image = makeImageContent(value, row, field);
      if (image) return image;
    }
    if (value === null || value === undefined || value === "") {
      const span = document.createElement("span");
      span.className = "cell-empty";
      span.textContent = "—";
      span.setAttribute("aria-label", "값 없음");
      return span;
    }
    if (typeof value === "boolean") {
      const span = document.createElement("span");
      span.className = `cell-boolean cell-boolean--${value}`;
      span.textContent = value ? "● 예" : "○ 아니요";
      return span;
    }
    if (typeof value === "object") {
      const span = document.createElement("span");
      span.className = "cell-summary";
      span.textContent = summarizeValue(value, field, 4) || "—";
      return span;
    }
    return document.createTextNode(formatScalar(value, field));
  };

  const debounce = (callback, delay = 170) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const initialize = async (explorer, explorerIndex) => {
    const source = explorer.dataset.source;
    const toolbar = explorer.querySelector("[data-toolbar]");
    const loading = explorer.querySelector("[data-loading]");
    const deck = explorer.querySelector("[data-deck]");
    const region = explorer.querySelector("[data-table-region]");
    const head = explorer.querySelector("[data-table-head]");
    const body = explorer.querySelector("[data-table-body]");
    const queryInput = explorer.querySelector("[data-filter-query]");
    const fieldSelect = explorer.querySelector("[data-filter-field]");
    const pageSizeSelect = explorer.querySelector("[data-page-size]");
    const resetButton = explorer.querySelector("[data-reset]");
    const summary = explorer.querySelector("[data-summary]");
    const pagination = explorer.querySelector("[data-pagination]");
    const firstButton = explorer.querySelector("[data-page-first]");
    const previousButton = explorer.querySelector("[data-page-prev]");
    const nextButton = explorer.querySelector("[data-page-next]");
    const lastButton = explorer.querySelector("[data-page-last]");
    const pageStatus = explorer.querySelector("[data-page-status]");
    const error = explorer.querySelector("[data-error]");
    const errorMessage = explorer.querySelector("[data-error-message]");
    const viewButtons = [...explorer.querySelectorAll("[data-view-mode]")];

    if (!source || !toolbar || !loading || !region || !head || !body || !deck) return;

    const labels = parseJsonAttribute(explorer, "labels", {}) || {};
    const suffixes = parseJsonAttribute(explorer, "suffixes", {}) || {};
    const values = parseJsonAttribute(explorer, "values", {}) || {};
    valueDictionary = values;
    const unit = explorer.dataset.unit || "개";

    /* 사전에 없는 열 이름은 접미사 규칙과 낱말 쪼개기로 옮깁니다. */
    const labelFor = (field) => {
      if (labels[field]) return labels[field];
      for (const [suffix, replacement] of Object.entries(suffixes)) {
        if (field.length > suffix.length && field.endsWith(suffix)) {
          const stem = field.slice(0, -suffix.length);
          const stemLabel = labels[stem] || humanize(stem);
          return `${stemLabel}${replacement}`;
        }
      }
      return humanize(field);
    };

    const humanize = (field) => field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (character) => character.toUpperCase());

    labelOf = labelFor;

    const state = {
      allRows: [],
      filteredRows: [],
      fields: parseJsonAttribute(explorer, "fields", []) || [],
      view: parseJsonAttribute(explorer, "view", null),
      query: "",
      field: "*",
      sortKey: "",
      sortDirection: "asc",
      mode: "leaf",
      page: 1,
      pageSize: 24,
      meta: {}
    };

    const parameterName = (name) => explorerIndex === 0 ? name : `table${explorerIndex + 1}-${name}`;

    const hydrateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      state.query = params.get(parameterName("q")) || "";
      state.field = params.get(parameterName("field")) || "*";
      state.sortKey = params.get(parameterName("sort")) || "";
      state.sortDirection = params.get(parameterName("dir")) === "desc" ? "desc" : "asc";
      state.mode = params.get(parameterName("view")) === "ledger" ? "ledger" : "leaf";
      const page = Number.parseInt(params.get(parameterName("page")), 10);
      const size = Number.parseInt(params.get(parameterName("size")), 10);
      state.page = Number.isFinite(page) && page > 0 ? page : 1;
      state.pageSize = [24, 48, 96].includes(size) ? size : 24;
    };

    const syncUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const setOrDelete = (key, value, defaultValue = "") => {
        const name = parameterName(key);
        if (String(value) === String(defaultValue) || value === "") params.delete(name);
        else params.set(name, value);
      };
      setOrDelete("q", state.query);
      setOrDelete("field", state.field, "*");
      setOrDelete("sort", state.sortKey);
      setOrDelete("dir", state.sortDirection, "asc");
      setOrDelete("view", state.mode, "leaf");
      setOrDelete("page", state.page, 1);
      setOrDelete("size", state.pageSize, 24);
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    };

    const inferFields = () => {
      if (state.fields.length) return;
      const ordered = new Set();
      state.allRows.slice(0, 100).forEach((row) => Object.keys(row || {}).forEach((key) => ordered.add(key)));
      state.fields = [...ordered];
    };

    /* 설정이 없는 데이터는 열 이름과 값 모양을 보고 표제·요점을 고릅니다. */
    const inferView = () => {
      const sample = state.allRows.slice(0, 40);
      const has = (field) => state.fields.includes(field);
      const valueOf = (field) => sample.map((row) => row?.[field]).find((value) => value !== null && value !== undefined && value !== "");

      const configured = state.view || {};
      const view = {
        seal: configured.seal ?? ["level", "grade", "step", "stage", "tier"].find(has) ?? "",
        title: configured.title ?? ["name", "label", "title", "itemName", "monsterName", "rewardName", "targetName", "stageName"].find(has) ?? "",
        icon: configured.icon ?? ["image", "icon"].find(has) ?? "",
        primary: configured.primary ?? "",
        points: configured.points ? [...configured.points] : null
      };

      const playerFields = state.fields.filter((field) => !ledgerOnlyPattern.test(field) && !isImageField(field));

      if (!view.primary) {
        view.primary = playerFields.find((field) => field !== view.seal && field !== view.title && numericLike(valueOf(field))) ?? "";
      }
      if (!view.points) {
        view.points = playerFields
          .filter((field) => field !== view.seal && field !== view.title && field !== view.primary)
          .slice(0, 4);
      }
      view.points = view.points.filter((field) => state.fields.includes(field));
      view.ledger = state.fields.filter((field) => field !== view.title && field !== view.icon && field !== view.primary && !view.points.includes(field));
      state.view = view;
    };

    const populateFieldSelect = () => {
      const fragment = document.createDocumentFragment();
      state.fields.filter((field) => !isImageField(field)).forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = labelFor(field);
        fragment.append(option);
      });
      fieldSelect.append(fragment);
      if (!state.fields.includes(state.field)) state.field = "*";
      fieldSelect.value = state.field;
    };

    /* ---- 낱장 보기 ---- */

    /* 견줌 자의 눈금: 지금 걸러 낸 목록에서의 최댓값과 순위표를 함께 만듭니다.
       값이 한쪽으로 크게 쏠린 데이터에서는 막대만으로는 읽히지 않으므로,
       낱장 쪽에서 이미 쓰는 "N개 중 M위" 표현을 함께 답니다. */
    const primaryScale = () => {
      const field = state.view.primary;
      if (!field) return { max: 0, ranks: null, counted: 0 };
      const numbers = [];
      state.filteredRows.forEach((row) => {
        const value = row?.[field];
        if (numericLike(value)) numbers.push(value);
      });
      if (!numbers.length) return { max: 0, ranks: null, counted: 0 };
      const descending = [...numbers].sort((a, b) => b - a);
      const ranks = new Map();
      const ties = new Map();
      descending.forEach((value, index) => {
        if (!ranks.has(value)) ranks.set(value, index + 1);
        ties.set(value, (ties.get(value) ?? 0) + 1);
      });
      return { max: descending[0], ranks, ties, counted: numbers.length };
    };

    const makePoint = (row, field) => {
      const text = summarizeValue(row?.[field], field, 3);
      if (!text) return null;
      const item = document.createElement("div");
      item.className = "row-leaf__point";
      const term = document.createElement("dt");
      term.textContent = labelFor(field);
      const value = document.createElement("dd");
      value.textContent = text;
      item.append(term, value);
      return item;
    };

    const makeLeaf = (row, scale) => {
      const view = state.view;
      const card = document.createElement("article");
      card.className = "row-leaf";

      const header = document.createElement("header");
      header.className = "row-leaf__head";

      if (view.icon) {
        const image = makeImageContent(row?.[view.icon], row, view.icon, 44);
        if (image) {
          image.classList.add("row-leaf__icon");
          header.append(image);
        }
      }
      /* '없음'만 적힌 인장은 아무것도 알려 주지 않으므로 달지 않습니다. */
      const sealValue = view.seal ? row?.[view.seal] : null;
      const sealText = sealValue === null || sealValue === undefined || sealValue === ""
        ? ""
        : formatScalar(sealValue, view.seal);
      if (sealText && sealText !== "없음" && sealText !== "0") {
        const seal = document.createElement("span");
        seal.className = "row-leaf__seal";
        seal.textContent = sealText;
        seal.title = `${labelFor(view.seal)} ${sealText}`;
        header.append(seal);
      }

      const heading = document.createElement("h3");
      heading.className = "row-leaf__title";
      const titleValue = view.title ? summarizeValue(row?.[view.title], view.title, 2) : "";
      heading.textContent = titleValue
        || (view.seal ? `${labelFor(view.seal)} ${formatScalar(row?.[view.seal] ?? "", view.seal)}` : "이름 없음");
      header.append(heading);
      card.append(header);

      /* 견줌 자: 지금 걸러 낸 목록 안에서의 크기를 잽니다. */
      if (view.primary) {
        const value = row?.[view.primary];
        const metric = document.createElement("div");
        metric.className = "row-leaf__metric";

        const label = document.createElement("span");
        label.className = "row-leaf__metric-label";
        label.textContent = labelFor(view.primary);

        const amount = document.createElement("strong");
        amount.className = "row-leaf__metric-value";
        const primaryText = summarizeValue(value, view.primary, 3);
        const hasValue = Boolean(primaryText);
        amount.textContent = hasValue ? primaryText : "기록 없음";
        if (!hasValue) amount.classList.add("is-missing");

        metric.append(label, amount);

        /* 값이 0이면 견줄 것이 없고, 같은 값이 목록의 3분의 1을 넘으면
           순위가 뜻을 잃습니다. 둘 다 자를 그리지 않고 숫자만 남깁니다. */
        const tied = scale.ties?.get(value) ?? 0;
        const worthComparing = tied > 0 && tied <= Math.max(1, scale.counted / 3);
        if (numericLike(value) && value > 0 && scale.max > 0 && worthComparing) {
          const share = value / scale.max;
          const rank = scale.ranks?.get(value);
          const note = rank ? `보이는 ${scale.counted.toLocaleString(locale)}${unit} 중 ${rank.toLocaleString(locale)}위` : "";

          const rule = document.createElement("span");
          rule.className = "rule";
          rule.setAttribute("role", "img");
          rule.setAttribute("aria-label", note || `가장 큰 값의 ${Math.round(share * 100)}%`);
          const fill = document.createElement("span");
          fill.className = "rule__fill";
          fill.style.width = `${Math.max(1.5, share * 100)}%`;
          rule.append(fill);
          metric.append(rule);

          if (note) {
            const rankNote = document.createElement("span");
            rankNote.className = "row-leaf__rank";
            rankNote.textContent = note;
            rankNote.setAttribute("aria-hidden", "true");
            metric.append(rankNote);
          }
        }
        card.append(metric);
      }

      /* 참/거짓은 '참일 때만' 딱지로 답니다. "우두머리: 아니요" 같은 줄은
         읽는 사람에게 아무것도 알려 주지 않으면서 자리만 차지합니다.
         낱장 페이지의 leaf-badges와 같은 말투입니다. */
      const flagFields = view.points.filter((field) => typeof row?.[field] === "boolean");
      const factFields = view.points.filter((field) => typeof row?.[field] !== "boolean");

      const raisedFlags = flagFields.filter((field) => row[field] === true);
      if (raisedFlags.length) {
        const badges = document.createElement("p");
        badges.className = "row-leaf__badges";
        raisedFlags.forEach((field) => {
          const badge = document.createElement("span");
          badge.textContent = labelFor(field);
          badges.append(badge);
        });
        card.append(badges);
      }

      const points = document.createElement("dl");
      points.className = "row-leaf__points";
      factFields.forEach((field) => {
        const point = makePoint(row, field);
        if (point) points.append(point);
      });
      if (points.childElementCount) card.append(points);

      const loweredFlags = flagFields.filter((field) => row[field] !== true);
      const ledgerFields = [...view.ledger, ...loweredFlags].filter((field) => {
        const value = row?.[field];
        return value !== null && value !== undefined && value !== "";
      });
      if (ledgerFields.length) {
        const details = document.createElement("details");
        details.className = "row-leaf__ledger";
        const openLedger = document.createElement("summary");
        openLedger.textContent = `원장 펼치기 · ${ledgerFields.length}개 항목`;
        details.append(openLedger);
        const list = document.createElement("dl");
        ledgerFields.forEach((field) => {
          const item = document.createElement("div");
          const term = document.createElement("dt");
          term.textContent = labelFor(field);
          const value = document.createElement("dd");
          value.textContent = summarizeValue(row[field], field, 8) || "—";
          item.append(term, value);
          list.append(item);
        });
        details.append(list);
        card.append(details);
      }

      return card;
    };

    /* ---- 장부 보기 ---- */

    const buildHead = () => {
      const row = document.createElement("tr");
      state.fields.forEach((field) => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.setAttribute("aria-sort", state.sortKey === field
          ? state.sortDirection === "asc" ? "ascending" : "descending"
          : "none");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sort-button";
        button.dataset.sortKey = field;
        if (state.sortKey === field) button.dataset.direction = state.sortDirection;
        button.textContent = labelFor(field);
        button.setAttribute("aria-label", `${labelFor(field)} 기준 정렬`);
        cell.append(button);
        row.append(cell);
      });
      head.replaceChildren(row);
    };

    const renderRows = () => {
      const totalPages = Math.max(1, Math.ceil(state.filteredRows.length / state.pageSize));
      state.page = Math.min(Math.max(1, state.page), totalPages);
      const start = (state.page - 1) * state.pageSize;
      const visibleRows = state.filteredRows.slice(start, start + state.pageSize);

      const emptyText = "찾는 것이 없습니다. 검색어를 줄이거나 처음으로 되돌려 보세요.";

      if (state.mode === "leaf") {
        const scale = primaryScale();
        const fragment = document.createDocumentFragment();
        if (!visibleRows.length) {
          const empty = document.createElement("p");
          empty.className = "leaf-deck__empty";
          empty.textContent = emptyText;
          fragment.append(empty);
        } else {
          visibleRows.forEach((row) => fragment.append(makeLeaf(row, scale)));
        }
        deck.replaceChildren(fragment);
      } else {
        const fragment = document.createDocumentFragment();
        if (!visibleRows.length) {
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.colSpan = Math.max(1, state.fields.length);
          cell.className = "empty-row";
          cell.textContent = emptyText;
          row.append(cell);
          fragment.append(row);
        } else {
          visibleRows.forEach((dataRow) => {
            const row = document.createElement("tr");
            state.fields.forEach((field) => {
              const cell = document.createElement("td");
              if (isImageField(field)) cell.classList.add("data-table__image-cell");
              cell.append(makeCellContent(dataRow?.[field], dataRow, field));
              row.append(cell);
            });
            fragment.append(row);
          });
        }
        body.replaceChildren(fragment);
      }

      const from = visibleRows.length ? start + 1 : 0;
      const to = start + visibleRows.length;
      const total = state.filteredRows.length;
      const isFiltered = total !== state.allRows.length;
      summary.textContent = total
        ? `${isFiltered ? `${state.allRows.length.toLocaleString(locale)}${unit} 가운데 ${total.toLocaleString(locale)}${unit}` : `모두 ${total.toLocaleString(locale)}${unit}`} · ${from.toLocaleString(locale)}–${to.toLocaleString(locale)}번째 보는 중`
        : "찾는 것이 없습니다.";
      pageStatus.textContent = `${state.page.toLocaleString(locale)} / ${totalPages.toLocaleString(locale)} 쪽`;
      firstButton.disabled = state.page <= 1;
      previousButton.disabled = state.page <= 1;
      nextButton.disabled = state.page >= totalPages;
      lastButton.disabled = state.page >= totalPages;
      pagination.hidden = totalPages <= 1;
    };

    const applyMode = () => {
      const isLeaf = state.mode === "leaf";
      deck.hidden = !isLeaf;
      region.hidden = isLeaf;
      viewButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.viewMode === state.mode));
      });
    };

    const apply = ({ resetPage = true, updateUrl = true } = {}) => {
      if (resetPage) state.page = 1;
      const tokens = normalize(state.query).split(/\s+/).filter(Boolean);
      state.filteredRows = tokens.length
        ? state.allRows.filter((row) => {
            const values = state.field === "*" ? state.fields.map((field) => row?.[field]) : [row?.[state.field]];
            const haystack = normalize(values.map(asSearchText).join(" "));
            return tokens.every((token) => haystack.includes(token));
          })
        : [...state.allRows];

      if (state.sortKey) {
        const direction = state.sortDirection === "asc" ? 1 : -1;
        state.filteredRows = state.filteredRows
          .map((row, index) => ({ row, index }))
          .sort((a, b) => compareValues(a.row?.[state.sortKey], b.row?.[state.sortKey]) * direction || a.index - b.index)
          .map(({ row }) => row);
      }
      buildHead();
      renderRows();
      if (updateUrl) syncUrl();
    };

    const setPage = (nextPage) => {
      state.page = nextPage;
      renderRows();
      syncUrl();
      (state.mode === "leaf" ? deck : region).scrollIntoView({ block: "start", behavior: "auto" });
    };

    try {
      hydrateFromUrl();
      const response = await fetch(source, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.rows)) throw new Error("데이터 모양이 예상과 다릅니다.");
      state.allRows = payload.rows;
      state.meta = payload.meta || {};
      inferFields();
      inferView();
      populateFieldSelect();
      queryInput.value = state.query;
      pageSizeSelect.value = String(state.pageSize);
      applyMode();
      apply({ resetPage: false, updateUrl: false });

      toolbar.hidden = false;
      loading.hidden = true;
      applyMode();
      explorer.setAttribute("aria-busy", "false");

      queryInput.addEventListener("input", debounce(() => {
        state.query = queryInput.value;
        apply();
      }));
      fieldSelect.addEventListener("change", () => {
        state.field = fieldSelect.value;
        apply();
      });
      pageSizeSelect.addEventListener("change", () => {
        state.pageSize = Number(pageSizeSelect.value);
        apply();
      });
      viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
          state.mode = button.dataset.viewMode === "ledger" ? "ledger" : "leaf";
          applyMode();
          renderRows();
          syncUrl();
        });
      });
      resetButton.addEventListener("click", () => {
        state.query = "";
        state.field = "*";
        state.sortKey = "";
        state.sortDirection = "asc";
        state.page = 1;
        queryInput.value = "";
        fieldSelect.value = "*";
        apply();
        queryInput.focus();
      });
      head.addEventListener("click", (event) => {
        const button = event.target.closest("[data-sort-key]");
        if (!button) return;
        const key = button.dataset.sortKey;
        if (state.sortKey === key) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDirection = "asc";
        }
        apply();
      });
      firstButton.addEventListener("click", () => setPage(1));
      previousButton.addEventListener("click", () => setPage(state.page - 1));
      nextButton.addEventListener("click", () => setPage(state.page + 1));
      lastButton.addEventListener("click", () => setPage(Math.ceil(state.filteredRows.length / state.pageSize)));
    } catch (caught) {
      loading.hidden = true;
      deck.hidden = true;
      region.hidden = true;
      pagination.hidden = true;
      error.hidden = false;
      errorMessage.textContent = caught?.message ? ` ${caught.message}` : "";
      summary.textContent = "데이터를 불러오지 못했습니다.";
      explorer.setAttribute("aria-busy", "false");
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-explorer]").forEach((explorer, index) => initialize(explorer, index));
  });
})();
