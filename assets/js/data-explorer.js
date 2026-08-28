(() => {
  "use strict";

  const locale = "ko-KR";
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const imagePathPattern = /^\/assets\/images\/game\/(?:skills|items)\/[0-9]+\.png$/;

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

  const parseFields = (explorer) => {
    try {
      const fields = JSON.parse(explorer.dataset.fields || "[]");
      return Array.isArray(fields) ? fields : [];
    } catch {
      return [];
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
    return label ? `${String(label)} 아이콘` : "";
  };

  const makeImageContent = (value, row, field) => {
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
    image.width = 56;
    image.height = 56;

    const fallback = document.createElement("span");
    fallback.className = "data-image-fallback";
    fallback.textContent = "이미지 없음";
    fallback.hidden = true;
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });

    wrapper.append(image, fallback);
    return wrapper;
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
      const code = document.createElement("code");
      code.textContent = JSON.stringify(value, null, Array.isArray(value) ? 0 : 2);
      return code;
    }
    return document.createTextNode(String(value));
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

    if (!source || !toolbar || !loading || !region || !head || !body) return;

    const state = {
      allRows: [],
      filteredRows: [],
      fields: parseFields(explorer),
      query: "",
      field: "*",
      sortKey: "",
      sortDirection: "asc",
      page: 1,
      pageSize: 25,
      meta: {}
    };

    const parameterName = (name) => explorerIndex === 0 ? name : `table${explorerIndex + 1}-${name}`;

    const hydrateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      state.query = params.get(parameterName("q")) || "";
      state.field = params.get(parameterName("field")) || "*";
      state.sortKey = params.get(parameterName("sort")) || "";
      state.sortDirection = params.get(parameterName("dir")) === "desc" ? "desc" : "asc";
      const page = Number.parseInt(params.get(parameterName("page")), 10);
      const size = Number.parseInt(params.get(parameterName("size")), 10);
      state.page = Number.isFinite(page) && page > 0 ? page : 1;
      state.pageSize = [25, 50, 100].includes(size) ? size : 25;
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
      setOrDelete("page", state.page, 1);
      setOrDelete("size", state.pageSize, 25);
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    };

    const inferFields = () => {
      if (state.fields.length) return;
      const ordered = new Set();
      state.allRows.slice(0, 100).forEach((row) => Object.keys(row || {}).forEach((key) => ordered.add(key)));
      state.fields = [...ordered];
    };

    const populateFieldSelect = () => {
      const fragment = document.createDocumentFragment();
      state.fields.forEach((field) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = field;
        fragment.append(option);
      });
      fieldSelect.append(fragment);
      if (!state.fields.includes(state.field)) state.field = "*";
      fieldSelect.value = state.field;
    };

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
        button.textContent = field;
        button.setAttribute("aria-label", `${field} 열 정렬`);
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
      const fragment = document.createDocumentFragment();

      if (!visibleRows.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = Math.max(1, state.fields.length);
        cell.className = "empty-row";
        cell.textContent = "조건에 맞는 행이 없습니다. 검색어나 검색 열을 바꿔 보세요.";
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

      const from = visibleRows.length ? start + 1 : 0;
      const to = start + visibleRows.length;
      summary.textContent = `${state.filteredRows.length.toLocaleString(locale)}행 중 ${from.toLocaleString(locale)}–${to.toLocaleString(locale)}행`;
      pageStatus.textContent = `${state.page.toLocaleString(locale)} / ${totalPages.toLocaleString(locale)} 페이지`;
      firstButton.disabled = state.page <= 1;
      previousButton.disabled = state.page <= 1;
      nextButton.disabled = state.page >= totalPages;
      lastButton.disabled = state.page >= totalPages;
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
      region.focus({ preventScroll: true });
    };

    try {
      hydrateFromUrl();
      const response = await fetch(source, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.rows)) throw new Error("예상한 rows 배열이 없습니다.");
      state.allRows = payload.rows;
      state.meta = payload.meta || {};
      inferFields();
      populateFieldSelect();
      queryInput.value = state.query;
      pageSizeSelect.value = String(state.pageSize);
      apply({ resetPage: false, updateUrl: false });

      toolbar.hidden = false;
      loading.hidden = true;
      region.hidden = false;
      pagination.hidden = false;
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
      resetButton.addEventListener("click", () => {
        state.query = "";
        state.field = "*";
        state.sortKey = "";
        state.sortDirection = "asc";
        state.page = 1;
        state.pageSize = 25;
        queryInput.value = "";
        fieldSelect.value = "*";
        pageSizeSelect.value = "25";
        apply({ resetPage: false });
        queryInput.focus();
      });
      head.addEventListener("click", (event) => {
        const button = event.target.closest("[data-sort-key]");
        if (!button) return;
        const key = button.dataset.sortKey;
        if (state.sortKey === key) state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        else {
          state.sortKey = key;
          state.sortDirection = "asc";
        }
        apply({ resetPage: false });
      });
      firstButton.addEventListener("click", () => setPage(1));
      previousButton.addEventListener("click", () => setPage(state.page - 1));
      nextButton.addEventListener("click", () => setPage(state.page + 1));
      lastButton.addEventListener("click", () => setPage(Math.max(1, Math.ceil(state.filteredRows.length / state.pageSize))));
    } catch (reason) {
      loading.hidden = true;
      error.hidden = false;
      errorMessage.textContent = reason instanceof Error ? reason.message : String(reason);
      summary.textContent = "데이터 로드 실패";
      explorer.setAttribute("aria-busy", "false");
    }
  };

  document.querySelectorAll("[data-explorer]").forEach((explorer, index) => initialize(explorer, index));
})();
