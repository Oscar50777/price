"use strict";

(() => {
  // ============================================================
  // SLONPRESS.RU — КАЛЬКУЛЯТОР ПОЛИГРАФИИ
  //
  // Цены: window.PRINT_PRICES из prices.js.
  // HTML/CSS: совместимы с ранее выданной сборкой.
  // Хранилище: совместимо со снимками этой сборки.
  //
  // Пароль — ограничение интерфейса, не серверная авторизация.
  // ============================================================

  const PROFESSIONAL_PASSWORD = "507";
  const STORAGE_KEY = "print_studio_2026_v1";
  const DATABASE_VERSION = 1;

  const $ = id => document.getElementById(id);
  const clone = value => structuredClone(value);
  const finite = Number.isFinite;
  const positive = value => finite(value) && value > 0;
  const nonnegative = value => finite(value) && value >= 0;
  const integer = value => Number.isSafeInteger(value) && value > 0;
  const whole = value => Number.isSafeInteger(value) && value >= 0;
  const object = value =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

  const uid = () => globalThis.crypto?.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  const money = value => new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2
  }).format(value);

  const num = value => new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2
  }).format(value);

  const PRODUCTS = [
    ["flyer", "Листовки", "Печатная продукция", "▤",
      "Размер, материал, печать и все параметры обработки."],
    ["broshyura", "Брошюры", "Печатная продукция", "▥",
      "Готовый размер страницы. Полосы блока — без обложки, кратно четырём."],
    ["bloknot", "Блокноты", "Печатная продукция", "▧",
      "Общий формат обложки, внутреннего блока и подложки."],
    ["papka", "Папки", "Печатная продукция", "▱",
      "Полный габарит развёртки с карманами и клапанами."],
    ["paket", "Бумажные пакеты", "Упаковка", "▢",
      "Размеры готового пакета. Развёртку проверьте по макету."],
    ["korobka", "Коробки", "Упаковка", "◇",
      "Укажите габарит развёртки, а не собранной коробки."],
    ["quarter", "Квартальные календари", "Календари", "▦",
      "Шапка, подложки и покупной комплект календарных блоков."],
    ["threeinone", "Календарь 3 в 1", "Календари", "▦",
      "Одна печатная основа и один покупной блок на календарь."],
    ["wall", "Настенные календари", "Календари", "▦",
      "Общий формат обложки, листов и подложки."],
    ["tent", "Календари-домики", "Календари", "△",
      "А5, квадрат 205×205 мм или покупной блок Полимат."],
    ["stickers", "Наклейки", "Специальная печать", "◇",
      "Прямоугольные наклейки с обычной резкой."],
    ["stickerpack", "Стикерпаки", "Специальная печать", "▦",
      "Плоттерная резка по секциям 320×450 мм."],
    ["uvprint", "УФ-печать", "Специальная печать", "☼",
      "Продажные тарифы по площади, количеству или времени."]
  ];

  // Только для открытия старых сохранённых расчётов.
  const LEGACY_PRODUCT = [
    "diecut", "Изделия с вырубкой — архив",
    "Архивное изделие", "⌁",
    "Изделие удалено из каталога новых заказов. Открыт старый снимок."
  ];

  const product = id =>
    PRODUCTS.find(item => item[0] === id) ||
    (id === "diecut" ? LEGACY_PRODUCT : null);

  const COLORS = [
    ["none", "Без печати"],
    ["1+0", "Один цвет, одна сторона · 1+0"],
    ["4+0", "Полноцвет, одна сторона · 4+0"],
    ["1+1", "Один цвет, две стороны · 1+1"],
    ["4+4", "Полноцвет, две стороны · 4+4"]
  ];

  const SIDES = {
    none: 0,
    "1+0": 1,
    "4+0": 1,
    "1+1": 2,
    "4+4": 2
  };

  const FORMATS = {
    A6: { w: 105, h: 148 },
    A5: { w: 148, h: 210 },
    A4: { w: 210, h: 297 },
    A3: { w: 297, h: 420 },
    A2: { w: 420, h: 594 }
  };

  const TIERS = {
    mini: "Мини",
    midi: "Миди",
    maxi: "Макси"
  };

  const UV_TYPES = [
    ["adhesive", "Самоклейка"],
    ["pvc3", "ПВХ 3 мм"],
    ["designer300", "Дизайнерская бумага 300 г/м²"],
    ["pens", "Печать на ручках"],
    ["custom", "Нестандартные изделия"],
    ["timedSheet", "По времени — лист 500×700 мм"]
  ];

  const ROW_LABELS = {
    paper: "Бумага",
    printRun: "Печатный прогон",
    setup: "Приладки печати",
    cutting: "Резка",
    lamination: "Ламинация",
    score: "Биговка",
    folding: "Фальцовка",
    diecut: "Вырубка и штамп",
    uv: "УФ-лак",
    emboss: "Тиснение и клише",
    plotter: "Плоттер",
    plotterMinimum: "Доплата до минимума плоттера"
  };

  const isBook = o => ["bloknot", "broshyura"].includes(o.product);
  const isSticker = o => ["stickers", "stickerpack"].includes(o.product);
  const advancedComponents = () => pro || order.product === "flyer";

  const tierKey = (tier, suffix) =>
    "quarter" + tier[0].toUpperCase() + tier.slice(1) + suffix;

  let current;
  let cfg;
  let order;
  let derived;
  let chosen = null;
  let methods = [];

  let pro = false;
  let archived = false;
  let selectedMethod = null;

  let saved = [];
  let templates = [];
  let selectedSaved = new Set();

  let timer = 0;
  let toastTimer = 0;
  let dialogView = "";
  let ready = false;
  let storageReadable = true;

  // ============================================================
  // ОБЩИЕ ФУНКЦИИ
  // ============================================================

  function toast(text) {
    \$("toast").textContent = text;
    \$("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      \$("toast").hidden = true;
    }, 5000);
  }

  function setPath(target, path, value) {
    const keys = path.split(".");

    if (keys.some(key =>
      ["__proto__", "prototype", "constructor"].includes(key)
    )) return false;

    let node = target;

    for (const key of keys.slice(0, -1)) {
      if (!node || !Object.prototype.hasOwnProperty.call(node, key)) {
        return false;
      }
      node = node[key];
    }

    const key = keys.at(-1);

    if (!node || !Object.prototype.hasOwnProperty.call(node, key)) {
      return false;
    }

    node[key] = value;
    return true;
  }

  function roundUp(value, step) {
    const unit = step > 0 ? step : 0.01;
    const quotient = value / unit;

    return Math.ceil(
      quotient -
      Number.EPSILON * Math.max(1, Math.abs(quotient)) * 8
    ) * unit;
  }

  function fit(w, h, iw, ih) {
    if (![w, h, iw, ih].every(positive)) return 0;

    const count = Math.max(
      Math.floor(w / iw) * Math.floor(h / ih),
      Math.floor(w / ih) * Math.floor(h / iw)
    );

    return Number.isSafeInteger(count) ? count : 0;
  }

  function validCost(value) {
    return nonnegative(value) && value <= Number.MAX_SAFE_INTEGER / 100;
  }

  function requireExtra(c, keys) {
    for (const key of keys) {
      if (!nonnegative(c.extra?.[key])) {
        throw new Error(
          `Не задан тариф prices.js → extra.${key}. ` +
          "Обновите справочник или примените текущие тарифы к архиву."
        );
      }
    }
  }

  // ============================================================
  // ПРОВЕРКА СПРАВОЧНИКА
  // ============================================================

  function validateConfig(c) {
    const errors = [];

    if (!object(c)) return ["Не найден window.PRINT_PRICES."];

    if (!c.meta?.version || !c.meta?.updated) {
      errors.push("Не заданы версия и дата тарифов.");
    }

    if (!nonnegative(c.markup)) errors.push("Некорректная наценка.");

    if (!integer(c.defaultQuantity) || !integer(c.hybridLimit)) {
      errors.push("Проверьте базовый тираж и предел гибридного производства.");
    }

    if (!Array.isArray(c.quantities) || !c.quantities.every(integer)) {
      errors.push("Проверьте список популярных тиражей.");
    }

    for (const group of ["rates", "extra"]) {
      if (!object(c[group])) {
        errors.push("Нет раздела " + group + ".");
        continue;
      }

      for (const [key, value] of Object.entries(c[group])) {
        if (!nonnegative(value)) errors.push("Некорректный тариф: " + key);
      }
    }

    const requiredRates = [
      "digitalPrint", "b2Print", "offsetPrint", "offsetSetup",
      "digitalSpoil", "b2Spoil", "offsetSpoil",
      "cutting", "cuttingSetup", "lamination",
      "softDigital", "softOther", "laminationSetup",
      "score", "scoreSetup", "folding", "foldingSetup",
      "diecut", "diecutSetup", "uv", "uvSetup",
      "emboss", "embossSetup", "rounding"
    ];

    for (const key of requiredRates) {
      if (!nonnegative(c.rates?.[key])) {
        errors.push("Не задан rates." + key);
      }
    }

    for (const key of ["digitalSpoil", "b2Spoil", "offsetSpoil"]) {
      if (!whole(c.rates?.[key])) {
        errors.push("Запас должен быть целым: " + key);
      }
    }

    const requiredExtra = [
      "notebookA6", "notebookA5", "notebookA4", "notebookCustom",
      "brochureAssembly", "wallAssembly", "tentAssembly",
      "tentMountedBase", "stickerPaperM2", "stickerFilmM2",
      "plotterSheet", "plotterMargin", "quarterHardware",
      "quarterMiniAssembly", "quarterMidiAssembly", "quarterMaxiAssembly",
      "quarterMiniMagnet", "quarterMidiMagnet", "quarterMaxiMagnet",
      "threeMiniAssembly", "threeMidiAssembly",
      "b2ExtraSheets", "stampMeter", "stampBase",
      "uvAdhesive", "uvAdhesiveWhite", "uvAdhesiveSetup",
      "uvPen", "uvPenSetup", "uvMinute",
      "uvBedW", "uvBedH", "uvCycle", "uvCycleWhite",
      "uvLoadMinutes", "uvLoadGroup",
      "uvSheetMinute", "uvSheetPrint", "uvSheetPrintWhite",
      "uvSheetLoading", "uvPVC3",
      "uvDesigner40", "uvDesigner40White",
      "uvDesigner44", "uvDesigner44White", "uvDesignerSoft"
    ];

    for (const key of requiredExtra) {
      if (!nonnegative(c.extra?.[key])) {
        errors.push("Не задан extra." + key);
      }
    }

    if (!whole(c.extra?.b2ExtraSheets)) {
      errors.push("Дополнительный запас B2 должен быть целым.");
    }

    for (const key of [
      "uvBedW", "uvBedH", "uvCycle", "uvCycleWhite",
      "uvSheetPrint", "uvSheetPrintWhite"
    ]) {
      if (!positive(c.extra?.[key])) errors.push("Проверьте " + key);
    }

    if (!integer(c.extra?.uvLoadGroup)) {
      errors.push("Проверьте группу загрузки УФ.");
    }

    if (!(c.extra?.plotterMargin < 160)) {
      errors.push("Слишком большие поля плоттера.");
    }

    if (!object(c.policy)) {
      errors.push("Нет специальных приладок.");
    } else {
      for (const key of [
        "notebook10", "notebook40", "notebook11", "notebook44",
        "brochure2", "brochure3", "brochure4"
      ]) {
        if (!nonnegative(c.policy[key])) errors.push("Проверьте policy." + key);
      }
    }

    if (!Array.isArray(c.sheets) || !c.sheets.length) {
      errors.push("Нет форматов оборудования.");
    } else {
      const ids = new Set();

      for (const s of c.sheets) {
        if (
          !s.id || ids.has(s.id) ||
          ![s.w, s.h, s.pw, s.ph].every(positive) ||
          s.pw > s.w || s.ph > s.h ||
          !["digital", "b2", "offset"].includes(s.group)
        ) {
          errors.push("Некорректный формат оборудования.");
        }
        ids.add(s.id);
      }

      if (!ids.has("Z") || !ids.has("E")) {
        errors.push("Необходимы форматы Z и E.");
      }
    }

    if (!object(c.papers)) {
      errors.push("Нет справочника материалов.");
    } else {
      for (const p of Object.values(c.papers)) {
        if (
          !positive(p.density) ||
          !nonnegative(p.priceKg) ||
          !nonnegative(p.priceSheet) ||
          !["kg", "sheet"].includes(p.priceMode)
        ) errors.push("Проверьте цены и плотность материалов.");
      }
    }

    for (const tier of Object.keys(TIERS)) {
      const geometry = c.calendar?.[tier];

      if (!geometry ||
          ![geometry.w, geometry.headH, geometry.backingH].every(positive)) {
        errors.push("Проверьте размеры календарей.");
      }

      for (const choice of ["economy", "standard", "premium"]) {
        const block = c.polimat?.[tier]?.[choice];
        if (!block?.name || !nonnegative(block.price)) {
          errors.push("Проверьте каталог календарных блоков.");
        }
      }
    }

    for (const key of ["threeMini", "threeMidi"]) {
      if (!c.polimat?.[key]?.name || !nonnegative(c.polimat[key].price)) {
        errors.push("Проверьте блоки календарей 3 в 1.");
      }
    }

    if (!object(c.component) || !object(c.products)) {
      errors.push("Нет исходных настроек изделий.");
    } else {
      for (const [id] of PRODUCTS) {
        const p = c.products[id];

        if (!p || !Array.isArray(p.components)) {
          errors.push("Не задано изделие: " + id);
          continue;
        }

        for (const key of ["assembly", "assemblySetup", "accessories", "extra"]) {
          if (!nonnegative(p[key])) {
            errors.push("Некорректная стоимость: " + id + "." + key);
          }
        }
      }
    }

    return [...new Set(errors)];
  }

  // ============================================================
  // СОЗДАНИЕ И НОРМАЛИЗАЦИЯ ЗАКАЗА
  // ============================================================

  function makeComponent(c, spec = {}) {
    const paperId = spec.paper || c.component.paper;
    const material = c.papers[paperId];

    if (!material) throw new Error("Не найден материал: " + paperId);

    return {
      ...clone(c.component),
      ...clone(material),
      plotter: false,
      ...clone(spec),
      paper: paperId,
      id: uid()
    };
  }

  function normalizeOrder(o, c, isNew = false) {
    if (!Array.isArray(o.components)) {
      throw new Error("Повреждён состав заказа.");
    }

    for (const p of o.components) {
      if (typeof p.plotter !== "boolean") p.plotter = false;
      if (!p.id) p.id = uid();
    }

    if (o.product === "tent") {
      if (!object(o.tent)) o.tent = { mounted: false };
      if (!o.tent.format) o.tent.format = isNew ? "A5" : "custom";
      if (!o.tent.blockMode) o.tent.blockMode = "printed";

      if (!o.components.some(p => p.role === "cover")) {
        o.components.push(makeComponent(c, {
          name: "Верхняя обложка",
          role: "cover",
          enabled: false,
          w: c.extra.tentPolimatW ?? 205,
          h: c.extra.tentPolimatH ?? 95,
          mode: "units",
          units: 1,
          paper: "matt",
          density: 300,
          color: "4+0",
          cutting: true,
          lamination: "none",
          score: false,
          folding: false,
          diecut: false,
          setups: 1
        }));
      }
    }

    return o;
  }

  function baseOrder(id, c = current) {
    const p = c.products[id];
    if (!p) throw new Error("Нет исходных настроек изделия: " + id);

    const o = {
      product: id,
      name: product(id)[1],
      quantity: id === "uvprint" ? 1 : c.defaultQuantity,
      note: "",

      bookFormat: "A5",
      customBook: { w: 148, h: 210 },
      wall: { format: "A3", w: 297, h: 420 },

      bag: {
        a: 300,
        b: 400,
        c: 120,
        type: "half",
        extraSheets: 0,
        confirmPhysical: false,
        includeStamp: false,
        outerContour: false
      },

      calendar: {
        size: "mini",
        tier: "mini",
        blockChoice: "economy",
        magnet: false,
        customW: 297,
        customHeadH: 210,
        customBackingH: 210
      },

      three: { size: "mini" },

      tent: {
        mounted: false,
        format: "A5",
        blockMode: "printed"
      },

      uv: {
        type: "adhesive",
        w: 1000,
        h: 1000,
        white: false,
        loading: "items",
        designerColor: "4+0",
        softTouch: false
      },

      ...clone(p),
      components: p.components.map(spec => makeComponent(c, spec))
    };

    return normalizeOrder(o, c, true);
  }

  // ============================================================
  // ПАКЕТ: ГЕОМЕТРИЯ И ШТАМП
  // ============================================================

  function bagGeometry(b) {
    let rule = null;

    if (b.a === 300 && b.b === 400 && b.c === 120) {
      rule = {
        type: "half",
        allowed: ["B"],
        label: "470×620 мм"
      };
    }

    if (b.a === 250 && b.b === 350 && b.c === 100) {
      rule = {
        type: "full",
        allowed: ["E", "M"],
        label: "520×720 мм"
      };
    }

    const type = rule?.type || b.type;

    return {
      type,
      parts: type === "half" ? 2 : 1,
      width: type === "half"
        ? b.a + b.c + 14
        : 2 * b.a + 2 * b.c + 14,
      height: b.b + 40 + b.c / 2 + 20,
      rule
    };
  }

  function bagLines(b) {
    const g = bagGeometry(b);
    if (![b.a, b.b, b.c, g.width, g.height].every(positive)) return [];

    const lines = [];
    const add = (x1, y1, x2, y2) => lines.push({ x1, y1, x2, y2 });

    const x1 = b.c / 2 - 1;
    const x2 = x1 + b.a;
    const x3 = x2 + b.c / 2;
    const x4 = x3 + b.c / 2;
    const x5 = x4 + b.a;
    const x6 = x5 + b.c / 2;

    const xs = [x1, x2, x3];
    if (g.type === "full") xs.push(x4, x5, x6);
    xs.forEach(x => add(x, 0, x, g.height));

    const y1 = 40;
    const y2 = 40 + b.b;
    const y3 = y2 - b.c / 2;

    add(0, y1, g.width, y1);
    add(0, y2, g.width, y2);
    add(0, y3, x3, y3);

    const diagonal = (x, direction) => {
      const room = direction > 0 ? g.width - x : x;
      const length = Math.max(0, Math.min(room, g.height - y3));
      add(x, y3, x + direction * length, y3 + length);
    };

    diagonal(x3, 1);
    diagonal(x3, -1);
    diagonal(0, 1);

    if (g.type === "full") {
      diagonal(x6, -1);
      diagonal(x6, 1);
    }

    return lines;
  }

  function stampEstimate(b, c) {
    const g = bagGeometry(b);
    let millimeters = bagLines(b).reduce(
      (sum, line) =>
        sum + Math.hypot(line.x2 - line.x1, line.y2 - line.y1),
      0
    );

    if (b.outerContour) millimeters += 2 * (g.width + g.height);

    return {
      meters: millimeters / 1000,
      cost: Math.ceil(
        millimeters / 1000 * c.extra.stampMeter + c.extra.stampBase
      )
    };
  }

  // ============================================================
  // ПРОИЗВОДНЫЕ ПАРАМЕТРЫ
  // ============================================================

  function derive(source, c) {
    const d = clone(source);

    if (isBook(d)) {
      const f = FORMATS[d.bookFormat] || d.customBook;

      d.components.forEach(p => {
        p.w = f.w;
        p.h = f.h;
      });

      d.assembly = d.product === "broshyura"
        ? c.extra.brochureAssembly
        : c.extra[
          "notebook" +
          (["A6", "A5", "A4"].includes(d.bookFormat)
            ? d.bookFormat
            : "Custom")
        ];
    }

    if (d.product === "paket") {
      const g = bagGeometry(d.bag);
      const p = d.components.find(component => component.role === "bag");

      if (p) {
        Object.assign(p, {
          enabled: true,
          w: g.width,
          h: g.height,
          units: g.parts,
          mode: "units",
          name: g.type === "half"
            ? "Половинка развёртки пакета"
            : "Цельная развёртка пакета"
        });

        if (d.bag.includeStamp) {
          p.diecut = true;
          p.stamp = stampEstimate(d.bag, c).cost;
        }
      }
    }

    if (d.product === "quarter") {
      const q = d.calendar;
      const tier = q.size === "custom" ? q.tier : q.size;

      if (!TIERS[tier] || !c.polimat[tier]?.[q.blockChoice]) {
        throw new Error("Некорректные параметры квартального календаря.");
      }

      q.tier = tier;

      const geometry = q.size === "custom"
        ? {
          w: q.customW,
          headH: q.customHeadH,
          backingH: q.customBackingH
        }
        : c.calendar[tier];

      d.components.forEach(p => {
        p.w = geometry.w;
        p.h = p.role === "header"
          ? geometry.headH
          : geometry.backingH;
      });

      const block = c.polimat[tier][q.blockChoice];

      d.assembly = c.extra[tierKey(tier, "Assembly")];
      d.accessories = block.price + c.extra.quarterHardware +
        (q.magnet ? c.extra[tierKey(tier, "Magnet")] : 0);
      d.accessoriesNote = block.name +
        (q.magnet ? "; магнитный курсор" : "");
    }

    if (d.product === "threeinone") {
      const mini = d.three.size === "mini";
      const block = c.polimat[mini ? "threeMini" : "threeMidi"];

      d.assembly = c.extra[
        mini ? "threeMiniAssembly" : "threeMidiAssembly"
      ];
      d.accessories += block.price;
      d.accessoriesNote = block.name +
        (source.accessoriesNote ? "; " + source.accessoriesNote : "");

      if (d.components[0]) {
        Object.assign(d.components[0], {
          enabled: true,
          role: "base",
          mode: "units",
          units: 1,
          w: mini ? 297 : 360,
          h: mini ? 420 : 520,
          name: mini
            ? "Основа 3 в 1 — А3"
            : "Основа 3 в 1 — половина 520×720"
        });
      }
    }

    if (d.product === "wall") {
      const f = FORMATS[d.wall.format] || d.wall;

      d.components.forEach(p => {
        p.w = f.w;
        p.h = f.h;
      });

      d.assembly = c.extra.wallAssembly;
    }

    if (d.product === "tent") {
      d.assembly = c.extra.tentAssembly;

      if (d.tent.mounted) {
        d.accessories += c.extra.tentMountedBase;
      }

      const mode = d.tent.blockMode || "printed";
      const format = d.tent.format || "custom";
      const purchased = mode !== "printed";
      let size = null;

      if (purchased) {
        requireExtra(c, [
          "tentPolimatBlock", "tentPolimatW", "tentPolimatH"
        ]);

        if (![c.extra.tentPolimatW, c.extra.tentPolimatH].every(positive)) {
          throw new Error("Некорректный размер покупного блока домика.");
        }

        size = {
          w: c.extra.tentPolimatW,
          h: c.extra.tentPolimatH
        };

        d.accessories += c.extra.tentPolimatBlock;
        d.accessoriesNote = [
          d.accessoriesNote,
          `Покупной блок Полимат ${size.w}×${size.h} мм`
        ].filter(Boolean).join("; ");
      } else if (format === "A5") {
        size = { w: 210, h: 148 };
      } else if (format === "square") {
        size = { w: 205, h: 205 };
      }

      for (const p of d.components) {
        if (p.role === "block") {
          if (purchased) p.enabled = false;
          if (size) Object.assign(p, size);
        }

        if (p.role === "cover") {
          p.enabled = mode === "polimatCover";
          p.mode = "units";
          p.units = 1;
          if (size) Object.assign(p, size);
        }
      }
    }

    if (isSticker(d)) {
      d.components.forEach(p => {
        p.paper = p.material === "film" ? "adhesiveFilm" : "adhesive";
        p.color = "4+0";
        if (d.product === "stickerpack") p.cutting = false;
      });
    }

    if (d.product === "flyer") {
      for (const p of d.components) {
        if (!p.enabled || !p.plotter) continue;

        requireExtra(c, ["flyerPlotterSheet", "flyerPlotterMinimum"]);

        // Плоттер заменяет обычную резку компонента.
        p.cutting = false;
      }
    }

    return d;
  }

  // ============================================================
  // ПРОВЕРКА ЗАКАЗА
  // ============================================================

  function validateOrder(d, c) {
    const errors = [];

    if (!product(d.product)) errors.push("Неизвестное изделие.");
    if (!integer(d.quantity)) {
      errors.push("Тираж должен быть целым положительным числом.");
    }

    if (d.product === "uvprint") {
      const u = d.uv;

      if (!UV_TYPES.some(([key]) => key === u.type)) {
        errors.push("Неизвестный вид УФ-печати.");
      }

      if (!["pens", "timedSheet"].includes(u.type) &&
          ![u.w, u.h].every(positive)) {
        errors.push("Укажите положительные размеры отпечатка.");
      }

      if (u.type === "custom" &&
          fit(c.extra.uvBedW, c.extra.uvBedH, u.w, u.h) < 1) {
        errors.push("Изделие не помещается на стол УФ-печати.");
      }

      if (!["items", "sheet"].includes(u.loading)) {
        errors.push("Проверьте загрузку УФ.");
      }

      if (!["4+0", "4+4"].includes(u.designerColor)) {
        errors.push("Проверьте цветность УФ.");
      }

      return errors;
    }

    for (const key of ["assembly", "assemblySetup", "accessories", "extra"]) {
      if (!nonnegative(d[key])) {
        errors.push("Проверьте сборку, комплектующие и прочие расходы.");
      }
    }

    if (!Array.isArray(d.components) ||
        d.components.length > 100 ||
        !d.components.some(p => p.enabled)) {
      errors.push("Нужен активный компонент. Максимум — 100 компонентов.");
      return errors;
    }

    if (d.product === "threeinone" &&
        (d.components.length !== 1 ||
         !["mini", "midi"].includes(d.three.size))) {
      errors.push("Календарь 3 в 1: одна основа, размер мини или миди.");
    }

    if (d.product === "paket") {
      const b = d.bag;

      if (![b.a, b.b, b.c].every(positive) ||
          b.c < 2 || b.b < b.c / 2) {
        errors.push("Проверьте размеры пакета.");
      }

      if (!whole(b.extraSheets)) {
        errors.push("Запас пакета должен быть целым неотрицательным.");
      }

      if (!["half", "full"].includes(b.type)) {
        errors.push("Проверьте конструкцию пакета.");
      }

      if (!d.components.some(p => p.role === "bag")) {
        errors.push("Нет основной развёртки пакета.");
      }
    }

    if (d.product === "tent") {
      if (!["A5", "square", "custom"].includes(d.tent.format)) {
        errors.push("Проверьте формат домика.");
      }

      if (!["printed", "polimat", "polimatCover"].includes(d.tent.blockMode)) {
        errors.push("Проверьте комплектацию домика.");
      }

      if (d.tent.blockMode === "polimatCover" &&
          d.components.filter(p => p.role === "cover" && p.enabled).length !== 1) {
        errors.push("Нужна одна верхняя печатная обложка.");
      }
    }

    for (const p of d.components.filter(item => item.enabled)) {
      const prefix = p.name + ": ";

      if (![p.w, p.h, p.density].every(positive)) {
        errors.push(prefix + "проверьте размер и плотность.");
      }

      if (!c.papers[p.paper]) errors.push(prefix + "неизвестный материал.");

      if (!nonnegative(p.bleed) || !integer(p.setups)) {
        errors.push(prefix + "проверьте вылеты и комплекты форм.");
      }

      if (!Object.hasOwn(SIDES, p.color)) {
        errors.push(prefix + "неизвестная цветность.");
      }

      if (!["units", "pages"].includes(p.mode)) {
        errors.push(prefix + "неверный способ количества.");
      }

      if (p.mode === "pages") {
        if (!integer(p.pages) || p.pages % 4 || SIDES[p.color] !== 2) {
          errors.push(prefix + "полосы кратны четырём, печать двусторонняя.");
        }
      } else if (!integer(p.units)) {
        errors.push(prefix + "число элементов должно быть целым положительным.");
      }

      if (!["kg", "sheet"].includes(p.priceMode) ||
          !nonnegative(p.priceMode === "kg" ? p.priceKg : p.priceSheet)) {
        errors.push(prefix + "проверьте цену бумаги.");
      }

      if (!["none", "gloss", "soft"].includes(p.lamination) ||
          ![1, 2].includes(p.lamSides)) {
        errors.push(prefix + "проверьте ламинацию.");
      }

      if (p.score && !integer(p.scoreCount)) {
        errors.push(prefix + "проверьте число бигов.");
      }

      if (p.diecut && (!integer(p.perStamp) || !nonnegative(p.stamp))) {
        errors.push(prefix + "проверьте штамп.");
      }

      if (p.emboss && !nonnegative(p.plate)) {
        errors.push(prefix + "проверьте клише.");
      }

      if (isSticker(d) && !["paper", "film"].includes(p.material)) {
        errors.push(prefix + "проверьте материал самоклейки.");
      }

      if (d.product === "flyer" && p.plotter) {
        if (p.mode !== "units") {
          errors.push(prefix + "плоттер работает с элементами, не с полосами.");
        }
        if (p.diecut) {
          errors.push(prefix + "выберите плоттер или вырубку, не обе операции.");
        }
      }

      const units = p.mode === "pages" ? p.pages / 4 : p.units;
      if (!Number.isSafeInteger(units * d.quantity)) {
        errors.push(prefix + "слишком большой тираж.");
      }
    }

    return [...new Set(errors)];
  }

  // ============================================================
  // ПЛОТТЕРНАЯ РАСКЛАДКА
  // ============================================================

  function plotterSections(p, sheet, c) {
    const margin = c.extra.plotterMargin;
    const iw = p.w + 2 * p.bleed;
    const ih = p.h + 2 * p.bleed;

    const left = (sheet.w - sheet.pw) / 2;
    const top = (sheet.h - sheet.ph) / 2;
    const right = left + sheet.pw;
    const bottom = top + sheet.ph;

    let best = [];
    let bestCount = 0;

    for (const [sw, sh] of [[320, 450], [450, 320]]) {
      const cols = Math.floor(sheet.w / sw);
      const rows = Math.floor(sheet.h / sh);
      if (!cols || !rows) continue;

      const freeW = sheet.w - cols * sw;
      const freeH = sheet.h - rows * sh;

      for (const ox of [0, freeW / 2, freeW]) {
        for (const oy of [0, freeH / 2, freeH]) {
          const counts = [];

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const sx = ox + x * sw;
              const sy = oy + y * sh;

              const w =
                Math.min(sx + sw - margin, right) -
                Math.max(sx + margin, left);

              const h =
                Math.min(sy + sh - margin, bottom) -
                Math.max(sy + margin, top);

              const count = fit(w, h, iw, ih);
              if (count > 0) counts.push(count);
            }
          }

          const total = counts.reduce((a, b) => a + b, 0);

          if (total > bestCount ||
              (total === bestCount &&
               counts.length &&
               (!best.length || counts.length < best.length))) {
            best = counts;
            bestCount = total;
          }
        }
      }
    }

    return best.sort((a, b) => b - a);
  }

  // ============================================================
  // РАСКЛАДКА ПЕЧАТНОГО КОМПОНЕНТА
  // ============================================================

  function layout(p, sheet, d, c) {
    const units = p.mode === "pages" ? p.pages / 4 : p.units;
    const elements = units * d.quantity;

    let capacity = 0;
    let forms = p.setups;
    let baseSheets;
    let sections = null;
    let warning = "";

    if (d.product === "threeinone") {
      if (d.three.size === "mini") {
        if (sheet.id !== "Z") {
          throw new Error("Мини: один А3 на листе SRA3.");
        }

        if (!fit(
          sheet.pw, sheet.ph,
          p.w + 2 * p.bleed,
          p.h + 2 * p.bleed
        )) {
          throw new Error("А3 с вылетами не помещается в печатную зону.");
        }

        capacity = 1;
      } else {
        if (!["E", "M"].includes(sheet.id)) {
          throw new Error("Миди: B2 или офсет 520×720.");
        }

        capacity = 2;
        warning =
          "Миди 3 в 1: две основы на лист 520×720. " +
          "Размер 360×520 — половина физического листа. " +
          "Печатное поле, захват и вылеты требуют проверки.";
      }

      baseSheets = Math.ceil(d.quantity / capacity);
    } else if (d.product === "paket" && p.role === "bag") {
      const g = bagGeometry(d.bag);
      const w = p.w + 2 * p.bleed;
      const h = p.h + 2 * p.bleed;

      if (g.rule) {
        if (!g.rule.allowed.includes(sheet.id)) {
          throw new Error("Для стандарта закреплён лист " + g.rule.label + ".");
        }

        if (!fit(sheet.w, sheet.h, w, h)) {
          throw new Error("Развёртка не помещается на физическом листе.");
        }

        if (!fit(sheet.pw, sheet.ph, w, h)) {
          if (!d.bag.confirmPhysical) {
            throw new Error(
              "Нужно подтверждение технолога: выход за стандартную печатную зону."
            );
          }

          warning =
            "Размещение вне стандартной печатной зоны разрешено " +
            "по подтверждению технолога.";
        }

        capacity = 1;
      } else {
        capacity = fit(sheet.pw, sheet.ph, w, h);
      }

      baseSheets = Math.ceil(elements / capacity);
    } else if (
      d.product === "stickerpack" ||
      (d.product === "flyer" && p.plotter)
    ) {
      sections = plotterSections(p, sheet, c);
      capacity = sections.reduce((a, b) => a + b, 0);
      baseSheets = Math.ceil(elements / capacity);

      if (!capacity) {
        throw new Error(
          "Не помещается в секции плоттера 320×450 мм с учётом полей и вылетов."
        );
      }
    } else {
      const brochure = d.product === "broshyura";

      capacity = fit(
        sheet.pw,
        sheet.ph,
        p.w * (brochure ? 2 : 1) + 2 * p.bleed,
        p.h + 2 * p.bleed
      );

      if (capacity && brochure) {
        forms = Math.ceil(units / capacity);

        const last = units - (forms - 1) * capacity;
        const repeats = Math.max(1, Math.floor(capacity / last));

        baseSheets =
          (forms - 1) * d.quantity +
          Math.ceil(d.quantity / repeats);
      } else {
        baseSheets = Math.ceil(elements / capacity);
      }
    }

    if (!integer(capacity) || !integer(baseSheets)) {
      throw new Error("Не помещается в рабочую зону.");
    }

    return {
      units,
      elements,
      capacity,
      forms,
      baseSheets,
      sections,
      warning
    };
  }

  // ============================================================
  // СЕБЕСТОИМОСТЬ КОМПОНЕНТА
  // ============================================================

  function calculatePart(p, sheet, d, c) {
    const l = layout(p, sheet, d, c);
    const r = c.rates;
    const e = c.extra;

    const printed = SIDES[p.color] > 0;
    const formCount = printed ? l.forms : 0;
    const isOffset = sheet.group === "offset";

    // Цифра SRA3 и B2: отдельной платы за приладку печати НЕТ.
    let setupRate = printed && isOffset ? r.offsetSetup : 0;

    if (printed && isOffset && d.product === "bloknot") {
      const key = {
        "1+0": "notebook10",
        "4+0": "notebook40",
        "1+1": "notebook11",
        "4+4": "notebook44"
      }[p.color];

      setupRate = c.policy[key];
    }

    if (
      printed &&
      isOffset &&
      d.product === "broshyura" &&
      p.color === "4+4" &&
      formCount >= 2
    ) {
      setupRate = c.policy[
        formCount === 2
          ? "brochure2"
          : formCount === 3
            ? "brochure3"
            : "brochure4"
      ];
    }

    // Технический запас бумаги/оттисков — отдельное правило.
    let spoil = printed ? r[sheet.group + "Spoil"] * formCount : 0;

    if (d.product === "paket" && p.role === "bag") {
      spoil = d.bag.extraSheets;
    }

    if (
      sheet.id === "E" &&
      printed &&
      (["paket", "papka", "diecut"].includes(d.product) || p.diecut)
    ) {
      spoil += e.b2ExtraSheets * formCount;
    }

    const sheets = l.baseSheets + spoil;
    if (!integer(sheets)) throw new Error("Некорректное количество листов.");

    const paperPerSheet = isSticker(d)
      ? sheet.w * sheet.h / 1000000 *
        (p.material === "film" ? e.stickerFilmM2 : e.stickerPaperM2)
      : p.priceMode === "sheet"
        ? p.priceSheet
        : sheet.w * sheet.h / 1000000 *
          p.density / 1000 * p.priceKg;

    const rows = {};

    rows.paper = sheets * paperPerSheet;
    rows.printRun = printed
      ? sheets * SIDES[p.color] * r[sheet.group + "Print"]
      : 0;

    rows.setup = formCount * setupRate;

    rows.cutting = p.cutting && d.product !== "stickerpack"
      ? sheets * r.cutting + r.cuttingSetup
      : 0;

    const laminationRate = p.lamination === "soft"
      ? (sheet.id === "Z" ? r.softDigital : r.softOther)
      : r.lamination;

    rows.lamination = p.lamination !== "none"
      ? sheets * p.lamSides * laminationRate + r.laminationSetup
      : 0;

    rows.score = p.score
      ? l.elements * p.scoreCount * r.score + r.scoreSetup
      : 0;

    rows.folding = p.folding
      ? l.elements * r.folding + r.foldingSetup
      : 0;

    rows.diecut = p.diecut
      ? Math.ceil(l.elements / p.perStamp) * r.diecut +
        r.diecutSetup + p.stamp
      : 0;

    rows.uv = p.uv ? sheets * r.uv + r.uvSetup : 0;

    rows.emboss = p.emboss
      ? l.elements * r.emboss + r.embossSetup + p.plate
      : 0;

    // Плоттер только по чистому тиражу, без запаса.
    let plotterSheets = 0;

    if (l.sections) {
      plotterSheets =
        Math.floor(l.elements / l.capacity) * l.sections.length;

      let rest = l.elements % l.capacity;

      for (const sectionCapacity of l.sections) {
        if (rest <= 0) break;
        plotterSheets++;
        rest -= sectionCapacity;
      }
    }

    const flyerPlotter = d.product === "flyer" && p.plotter;
    const plotterRate = flyerPlotter
      ? e.flyerPlotterSheet
      : e.plotterSheet;

    rows.plotter = plotterSheets * plotterRate;

    const total = Object.values(rows).reduce((a, b) => a + b, 0);
    if (!validCost(total)) throw new Error("Некорректная стоимость компонента.");

    return {
      ...l,
      id: p.id,
      name: p.name,
      method: sheet.label,
      sheets,
      spoil,
      formCount,
      setupCount: isOffset ? formCount : 0,
      setupRate,
      plotterSheets,
      flyerPlotter,
      rows,
      total
    };
  }

  // ============================================================
  // СРАВНЕНИЕ ТЕХНОЛОГИЙ
  // ============================================================

  function calculateMethods(d, c) {
    const active = d.components.filter(p => p.enabled);

    const hybrid =
      d.product === "bloknot" &&
      c.hybrid &&
      d.quantity <= c.hybridLimit;

    const digitalRoles = ["cover", "backing"];
    const cache = new Map();

    if (hybrid) {
      for (const p of active.filter(item => digitalRoles.includes(item.role))) {
        const variants = c.sheets
          .filter(s => ["Z", "E"].includes(s.id))
          .flatMap(s => {
            try {
              return [calculatePart(p, s, d, c)];
            } catch {
              return [];
            }
          });

        cache.set(
          p.id,
          variants.sort((a, b) => a.total - b.total)[0]
        );
      }
    }

    const allDigital =
      hybrid && active.every(p => digitalRoles.includes(p.role));

    const sheets = allDigital
      ? [c.sheets.find(s => s.id === "Z")]
      : c.sheets;

    return sheets.map(sheet => {
      const id = allDigital ? "HYBRID" : sheet.id;

      const label = allDigital
        ? "Цифровые обложка и подложка"
        : hybrid
          ? sheet.label + " для блока + цифровые обложка/подложка"
          : sheet.label;

      try {
        const parts = active.map(p => {
          if (hybrid && digitalRoles.includes(p.role)) {
            const cached = cache.get(p.id);
            if (!cached) {
              throw new Error(p.name + ": не помещается на цифровые форматы.");
            }
            return clone(cached);
          }

          try {
            return calculatePart(p, sheet, d, c);
          } catch (error) {
            throw new Error(p.name + ": " + error.message);
          }
        });

        // Минимум плоттера листовок — один раз на весь заказ.
        const plotterParts = parts.filter(p => p.flyerPlotter);

        if (plotterParts.length) {
          const plotterCost = plotterParts.reduce(
            (sum, p) => sum + p.rows.plotter,
            0
          );

          const surcharge = Math.max(
            0,
            c.extra.flyerPlotterMinimum - plotterCost
          );

          if (surcharge > 0) {
            plotterParts[0].rows.plotterMinimum = surcharge;
            plotterParts[0].total += surcharge;
          }
        }

        const assembly = d.quantity * d.assembly + d.assemblySetup;
        const accessories = d.quantity * d.accessories;

        const cost =
          parts.reduce((sum, p) => sum + p.total, 0) +
          assembly + accessories + d.extra;

        const price = roundUp(
          cost * (1 + c.markup / 100),
          c.rates.rounding
        );

        if (!validCost(cost) || !validCost(price)) {
          throw new Error("Слишком большая стоимость.");
        }

        return {
          id,
          label,
          valid: true,
          parts,
          assembly,
          accessories,
          extra: d.extra,
          cost,
          price,
          unitPrice: price / d.quantity,
          profit: price - cost,
          hybrid,
          warnings: [
            ...new Set(parts.map(p => p.warning).filter(Boolean))
          ]
        };
      } catch (error) {
        return {
          id,
          label,
          valid: false,
          reason: error.message
        };
      }
    });
  }

  // ============================================================
  // УФ-ПЕЧАТЬ
  // ============================================================

  function calculateUV(d, c) {
    const u = d.uv;
    const e = c.extra;
    const q = d.quantity;
    const area = u.w * u.h * q / 1000000;
    const rows = [];

    let total = 0;
    let info = "";

    const label = UV_TYPES.find(([id]) => id === u.type)[1];

    if (u.type === "adhesive") {
      const rate = u.white ? e.uvAdhesiveWhite : e.uvAdhesive;
      total = area * rate + e.uvAdhesiveSetup;

      rows.push(
        ["Площадь заказа", num(area) + " м²"],
        ["Тариф", money(rate) + "/м²"],
        ["Настройка", money(e.uvAdhesiveSetup)]
      );

      info = "Включение материала в тариф подтвердите у исполнителя.";
    } else if (u.type === "pens") {
      total = q * e.uvPen + e.uvPenSetup;

      rows.push(
        ["Печать одной ручки", money(e.uvPen)],
        ["Настройка", money(e.uvPenSetup)]
      );

      info = "Стоимость самих ручек не включена.";
    } else if (u.type === "timedSheet") {
      const printMinutes = u.white
        ? e.uvSheetPrintWhite
        : e.uvSheetPrint;

      const printing = q * printMinutes;
      const loading = q * e.uvSheetLoading;

      total = (printing + loading) * e.uvSheetMinute;

      rows.push(
        ["Лист", "500×700 мм"],
        ["Печать тиража", num(printing) + " мин"],
        ["Укладка", num(loading) + " мин"],
        ["Стоимость минуты", money(e.uvSheetMinute)]
      );

      info =
        "Одна сторона. Укладка каждого листа включена. " +
        "Материал и отдельная настройка не включены.";
    } else if (u.type === "custom") {
      const capacity = u.loading === "sheet"
        ? 1
        : fit(e.uvBedW, e.uvBedH, u.w, u.h);

      const cycles = Math.ceil(q / capacity);
      const cycle = u.white ? e.uvCycleWhite : e.uvCycle;

      const full = Math.floor(q / capacity);
      const rest = q % capacity;

      const groups = u.loading === "sheet"
        ? q
        : full * Math.ceil(capacity / e.uvLoadGroup) +
          (rest ? Math.ceil(rest / e.uvLoadGroup) : 0);

      const printing = cycles * cycle;
      const loading = groups * e.uvLoadMinutes;

      total = (printing + loading) * e.uvMinute;

      rows.push(
        ["Стол", `${e.uvBedW}×${e.uvBedH} мм`],
        ["Изделий в загрузке", num(capacity)],
        ["Печатных циклов", num(cycles)],
        ["Печать", num(printing) + " мин"],
        ["Загрузка", num(loading) + " мин"],
        ["Стоимость минуты", money(e.uvMinute)]
      );

      info =
        "Неполная загрузка — полный цикл. " +
        "Материал, изделия и оснастка не включены.";
    } else {
      const designer = u.type === "designer300";

      const rate = designer
        ? e[
          "uvDesigner" +
          (u.designerColor === "4+4" ? "44" : "40") +
          (u.white ? "White" : "")
        ]
        : e.uvPVC3;

      const soft = designer && u.softTouch
        ? area * e.uvDesignerSoft
        : 0;

      total = area * rate + soft;

      rows.push(
        ["Площадь", num(area) + " м²"],
        ["Тариф", money(rate) + "/м²"],
        ["Софт-тач", money(soft)]
      );

      info =
        "Продажный тариф по площади. " +
        "Отдельная стоимость материала и настройка не добавляются. " +
        "Тариф 4+4 уже включает обе стороны.";
    }

    const price = roundUp(total, 0);
    if (!validCost(price)) throw new Error("Некорректная стоимость УФ-печати.");

    return {
      id: "UV",
      label,
      valid: true,
      uv: true,
      parts: [],
      rows,
      info,
      price,
      unitPrice: price / q,
      cost: null,
      profit: null,
      warnings: []
    };
  }

  // ============================================================
  // HTML-ЭЛЕМЕНТЫ ФОРМ
  // ============================================================

  function input(label, path, value, options = {}) {
    const displayed = options.text
      ? value
      : finite(value) ? value : "";

    return `
      <label class="field \${options.full ? "full" : ""}">
        <span>\${esc(label)}</span>
        <input
          data-path="\${esc(path)}"
          type="\${options.text ? "text" : "number"}"
          value="\${esc(displayed)}"
          \${options.text ? "" :
            `min="${options.min ?? 0}" step="${options.step ?? "any"}"`}
          \${options.disabled ? "disabled" : ""}
        >
      </label>
    `;
  }

  function select(label, path, value, choices, options = {}) {
    return `
      <label class="field \${options.full ? "full" : ""}">
        <span>\${esc(label)}</span>
        <select
          data-path="\${esc(path)}"
          \${options.numeric ? 'data-numeric="true"' : ""}
          \${options.disabled ? "disabled" : ""}
        >
          \${choices.map(([id, title]) => `
            <option
              value="\${esc(id)}"
              \${String(value) === String(id) ? "selected" : ""}
            >\${esc(title)}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  function check(label, path, value, disabled = false) {
    return `
      <label class="check">
        <input
          type="checkbox"
          data-path="\${esc(path)}"
          \${value ? "checked" : ""}
          \${disabled ? "disabled" : ""}
        >
        \${esc(label)}
      </label>
    `;
  }

  function quickFormat(scope, selected, choices) {
    return `
      <div class="quick">
        \${choices.map(([id, title]) => `
          <button
            type="button"
            data-action="format"
            data-scope="\${esc(scope)}"
            data-value="\${esc(id)}"
            class="\${selected === id ? "active" : ""}"
          >\${esc(title)}</button>
        `).join("")}
      </div>
    `;
  }

  // ============================================================
  // НАВИГАЦИЯ
  // ============================================================

  function renderNav() {
    const groups = [...new Set(PRODUCTS.map(p => p[2]))];

    \$("productNav").innerHTML = groups.map(group => `
      <div class="nav-group">
        <div class="nav-title">\${esc(group)}</div>

        \${PRODUCTS.filter(p => p[2] === group).map(p => `
          <button
            class="nav-item \${order.product === p[0] ? "active" : ""}"
            data-action="product"
            data-id="\${p[0]}"
            \${order.product === p[0] ? 'aria-current="page"' : ""}
          >
            <span class="nav-symbol" aria-hidden="true">\${p[3]}</span>
            \${esc(p[1])}
          </button>
        `).join("")}
      </div>
    `).join("");

    \$("mobileProduct").innerHTML = groups.map(group => `
      <optgroup label="\${esc(group)}">
        \${PRODUCTS.filter(p => p[2] === group).map(p => `
          <option
            value="\${p[0]}"
            \${order.product === p[0] ? "selected" : ""}
          >\${esc(p[1])}</option>
        `).join("")}
      </optgroup>
    `).join("");

    if (order.product === "diecut") {
      \$("mobileProduct").insertAdjacentHTML("afterbegin", `
        <option value="diecut" selected disabled>
          Архивное изделие с вырубкой
        </option>
      `);
    }
  }

  // ============================================================
  // ОСНОВНАЯ ФОРМА
  // ============================================================

  function renderOrderForm() {
    const o = order;

    let html = `
      <div class="fields">
        \${input("Название заказа", "name", o.name, {
          text: true, full: true
        })}

        \${input(
          o.product === "uvprint"
            ? "Количество изделий / листов"
            : "Тираж готовых изделий",
          "quantity",
          o.quantity,
          { min: 1, step: 1, full: true }
        )}
      </div>

      <div class="quick">
        \${(o.product === "uvprint"
          ? [1, 10, 50, 100, 500]
          : cfg.quantities
        ).map(q => `
          <button
            data-action="quantity"
            data-value="\${q}"
            class="\${o.quantity === q ? "active" : ""}"
          >\${num(q)}</button>
        `).join("")}
      </div>
    `;

    if (isBook(o)) {
      html += `
        <h3>Единый готовый формат</h3>

        \${quickFormat("book", o.bookFormat, [
          ["A6", "А6"],
          ["A5", "А5"],
          ["A4", "А4"],
          ["CUSTOM", "Свой размер"]
        ])}

        \${o.bookFormat === "CUSTOM" ? `
          <div class="fields">
            \${input("Ширина, мм", "customBook.w", o.customBook.w, { min: 1 })}
            \${input("Высота, мм", "customBook.h", o.customBook.h, { min: 1 })}
          </div>
        ` : ""}
      `;
    }

    if (o.product === "wall") {
      html += quickFormat("wall", o.wall.format, [
        ["A3", "А3"],
        ["A2", "А2"],
        ["custom", "Свой размер"]
      ]);

      if (o.wall.format === "custom") {
        html += `
          <div class="fields">
            \${input("Ширина, мм", "wall.w", o.wall.w, { min: 1 })}
            \${input("Высота, мм", "wall.h", o.wall.h, { min: 1 })}
          </div>
        `;
      }
    }

    if (o.product === "paket") {
      const b = o.bag;
      const rule = bagGeometry(b).rule;

      html += `
        <h3>Готовый пакет</h3>

        <div class="quick">
          <button data-action="bag-preset" data-value="large">
            30×40×12 см
          </button>
          <button data-action="bag-preset" data-value="small">
            25×35×10 см
          </button>
        </div>

        <div class="fields">
          \${input("Ширина A, мм", "bag.a", b.a, { min: 1 })}
          \${input("Высота B, мм", "bag.b", b.b, { min: 1 })}
          \${input("Глубина C, мм", "bag.c", b.c, { min: 2 })}

          \${select(
            "Конструкция",
            "bag.type",
            rule?.type || b.type,
            [["half", "Две половинки"], ["full", "Цельная развёртка"]],
            { disabled: !!rule }
          )}

          \${pro ? input(
            "Техзапас на заказ, листов",
            "bag.extraSheets",
            b.extraSheets,
            { step: 1, full: true }
          ) : ""}
        </div>

        \${pro ? `
          <div class="checks">
            \${check(
              "Размещение на физическом листе подтверждено технологом",
              "bag.confirmPhysical",
              b.confirmPhysical
            )}
            \${check("Включить новый штамп", "bag.includeStamp", b.includeStamp)}
            \${check(
              "Внешний контур в оценке штампа",
              "bag.outerContour",
              b.outerContour
            )}
          </div>
        ` : ""}

        <div id="bagPreview"></div>
      `;
    }

    if (o.product === "quarter") {
      const q = o.calendar;
      const tier = q.size === "custom" ? q.tier : q.size;

      html += quickFormat("quarter", q.size, [
        ["mini", "Мини"],
        ["midi", "Миди"],
        ["maxi", "Макси"],
        ["custom", "Свой размер"]
      ]);

      html += `
        <div class="fields">
          \${q.size === "custom" ? `
            \${select("Класс блоков", "calendar.tier", q.tier, Object.entries(TIERS))}
            \${input("Ширина, мм", "calendar.customW", q.customW, { min: 1 })}
            \${input("Высота шапки, мм", "calendar.customHeadH", q.customHeadH, { min: 1 })}
            \${input("Высота подложки, мм", "calendar.customBackingH", q.customBackingH, { min: 1 })}
          ` : ""}

          \${select(
            "Покупной комплект блоков",
            "calendar.blockChoice",
            q.blockChoice,
            ["economy", "standard", "premium"].map(key => {
              const b = cfg.polimat[tier][key];
              return [key, b.name + (pro ? " — " + money(b.price) : "")];
            }),
            { full: true }
          )}
        </div>

        <div class="checks">
          \${check("Магнитный курсор", "calendar.magnet", q.magnet)}
        </div>
      `;
    }

    if (o.product === "threeinone") {
      html += `
        <div class="fields">
          \${select(
            "Размер календаря",
            "three.size",
            o.three.size,
            [
              ["mini", "Мини — основа А3"],
              ["midi", "Миди — две основы на B2"]
            ],
            { full: true }
          )}
        </div>

        <p class="small section-gap">
          Покупной блок и сборка добавляются на каждый календарь.
          Для миди печатное поле необходимо проверить.
        </p>
      `;
    }

    if (o.product === "tent") {
      const purchased = o.tent.blockMode !== "printed";
      const e = cfg.extra;

      const blockConfigured =
        positive(e.tentPolimatW) &&
        positive(e.tentPolimatH) &&
        nonnegative(e.tentPolimatBlock);

      html += `
        <h3>Комплектация домика</h3>

        <div class="fields section-gap">
          \${select(
            "Блок календаря",
            "tent.blockMode",
            o.tent.blockMode,
            [
              ["printed", "Собственные перекидные листы"],
              ["polimat", "Стандартный блок Полимат"],
              ["polimatCover", "Блок Полимат + верхняя обложка"]
            ],
            { full: true }
          )}

          \${!purchased ? select(
            "Формат перекидных листов",
            "tent.format",
            o.tent.format,
            [
              ["A5", "А5 альбомный — 210×148 мм"],
              ["square", "Квадрат — 205×205 мм"],
              ["custom", "Свой размер"]
            ],
            { full: true }
          ) : ""}
        </div>

        <div class="checks">
          \${check("Кашированное основание", "tent.mounted", o.tent.mounted)}
        </div>

        \${purchased ? `
          <div class="notice section-gap">
            \${blockConfigured
              ? `
                Один покупной блок:
                <strong>\${num(e.tentPolimatW)}×${num(e.tentPolimatH)} мм</strong>,
                <strong>\${money(e.tentPolimatBlock)} за календарь</strong>.
              `
              : `
                В тарифах не задан покупной блок домика.
                Обновите prices.js или примените текущие тарифы.
              `}
          </div>

          <p class="small">
            Печать покупного блока повторно не начисляется.
            \${o.tent.blockMode === "polimatCover"
              ? "Верхняя обложка печатается отдельно в размере блока."
              : "Печатная верхняя обложка не включена."}
          </p>
        ` : ""}

        <p class="small section-gap">
          Формат относится к перекидным листам.
          Основание задаётся отдельно в развёртке.
          Совместимость основания, блока и крепления проверьте по макету.
        </p>
      `;
    }

    if (o.product === "uvprint") {
      const u = o.uv;

      html += `
        <div class="fields">
          \${select("Вид УФ-печати", "uv.type", u.type, UV_TYPES, { full: true })}

          \${!["pens", "timedSheet"].includes(u.type) ? `
            \${input("Ширина отпечатка / изделия, мм", "uv.w", u.w, { min: 1 })}
            \${input("Высота отпечатка / изделия, мм", "uv.h", u.h, { min: 1 })}
          ` : ""}

          \${u.type === "custom" ? select(
            "Загрузка",
            "uv.loading",
            u.loading,
            [["items", "Отдельные изделия"], ["sheet", "Один лист за цикл"]],
            { full: true }
          ) : ""}

          \${u.type === "designer300" ? select(
            "Цветность",
            "uv.designerColor",
            u.designerColor,
            [["4+0", "4+0 — одна сторона"], ["4+4", "4+4 — две стороны"]],
            { full: true }
          ) : ""}
        </div>

        <div class="checks">
          \${!["pens", "pvc3"].includes(u.type)
            ? check("С белилами", "uv.white", u.white)
            : ""}

          \${u.type === "designer300"
            ? check("Софт-тач", "uv.softTouch", u.softTouch)
            : ""}
        </div>

        \${u.type === "timedSheet" ? `
          <p class="small section-gap">
            Фиксированный лист 500×700 мм, одна сторона.
            В тираже укажите количество листов.
          </p>
        ` : ""}
      `;
    }

    \$("orderForm").innerHTML = html;
    \$("orderNote").value = o.note;
  }

  // ============================================================
  // КОМПОНЕНТЫ
  // ============================================================

  function lockedSize(o, p) {
    if (o.product === "tent" && ["block", "cover"].includes(p.role)) {
      return o.tent.blockMode !== "printed" || o.tent.format !== "custom";
    }

    return isBook(o) ||
      ["quarter", "wall", "threeinone"].includes(o.product) ||
      (o.product === "paket" && p.role === "bag");
  }

  function managedTentComponent(o, p) {
    return o.product === "tent" && (
      p.role === "cover" ||
      (p.role === "block" && o.tent.blockMode !== "printed")
    );
  }

  function renderComponents() {
    const advanced = advancedComponents();

    \$("componentsCard").hidden = order.product === "uvprint";
    \$("addComponent").hidden =
      !advanced || order.product === "threeinone";

    if (order.product === "uvprint") return;

    let d;

    try {
      d = derive(order, cfg);
    } catch {
      d = clone(order);
    }

    let html = order.product === "papka" ? `
      <div class="notice">
        Печать 4+4 доступна в поле «Цветность».
        Для ламинации 1+1 выберите две стороны.
        Софт-тач, тиснение и УФ-лак доступны ниже.
      </div>
    ` : "";

    html += d.components.map((p, i) => {
      const original = order.components[i];
      const path = key => `components.${i}.${key}`;

      const core = d.product === "threeinone" ||
        (d.product === "paket" && p.role === "bag");

      const managed = managedTentComponent(order, p);
      const locked = lockedSize(order, p);

      if (order.product === "tent") {
        if (p.role === "block" && order.tent.blockMode !== "printed") return "";
        if (p.role === "cover" && order.tent.blockMode !== "polimatCover") return "";
      }

      const paperChoices = Object.entries(cfg.papers).map(
        ([key, value]) => [key, value.label]
      );

      const flyerPlotter = order.product === "flyer" && original.plotter;

      return `
        <article class="component">
          <div class="component-top">
            \${advanced ? `
              <label>
                <input
                  type="checkbox"
                  data-path="\${path("enabled")}"
                  \${p.enabled ? "checked" : ""}
                  \${core || managed ? "disabled" : ""}
                >
                <h3>\${esc(p.name)}</h3>
              </label>
            ` : `
              <h3>\${esc(p.name)}${p.enabled ? "" : " · отключён"}</h3>
            `}

            \${advanced && !core && !managed ? `
              <button
                class="text-button danger"
                data-action="component-remove"
                data-index="\${i}"
              >Удалить</button>
            ` : ""}
          </div>

          \${p.enabled ? `
            <div class="fields">
              \${!locked ? `
                \${input("Ширина по макету, мм", path("w"), p.w, { min: 1 })}
                \${input("Высота по макету, мм", path("h"), p.h, { min: 1 })}
              ` : `
                <p class="small full">
                  Размер: \${num(p.w)}×${num(p.h)} мм
                </p>
              `}

              \${p.mode === "pages"
                ? input("Полос без обложки", path("pages"), p.pages, {
                  min: 4, step: 4
                })
                : !core
                  ? input("Элементов на изделие", path("units"), p.units, {
                    min: 1,
                    step: 1,
                    disabled: order.product === "tent" && p.role === "cover"
                  })
                  : ""}

              \${isSticker(d)
                ? select("Материал", path("material"), p.material, [
                  ["paper", "Бумажная самоклейка"],
                  ["film", "Самоклеящаяся плёнка"]
                ])
                : select("Бумага", path("paper"), p.paper, paperChoices)}

              \${!isSticker(d)
                ? input("Плотность, г/м²", path("density"), p.density, { min: 1 })
                : ""}

              \${!isSticker(d)
                ? select(
                  "Цветность",
                  path("color"),
                  p.color,
                  p.mode === "pages"
                    ? COLORS.filter(([id]) => ["1+1", "4+4"].includes(id))
                    : COLORS
                )
                : ""}

              \${select("Ламинация", path("lamination"), p.lamination, [
                ["none", "Без ламинации"],
                ["gloss", "Глянцевая / матовая"],
                ["soft", "Софт-тач"]
              ])}

              \${p.lamination !== "none"
                ? select(
                  "Сторон ламинации",
                  path("lamSides"),
                  p.lamSides,
                  [[1, "Одна сторона"], [2, "Две стороны · 1+1"]],
                  { numeric: true }
                )
                : ""}
            </div>

            <div class="checks">
              \${check("Биговка", path("score"), p.score)}
              \${check("Фальцовка", path("folding"), p.folding)}
              \${check("УФ-лак", path("uv"), p.uv)}
              \${check("Тиснение", path("emboss"), p.emboss)}

              \${advanced
                ? check(
                  "Резка",
                  path("cutting"),
                  flyerPlotter ? false : p.cutting,
                  d.product === "stickerpack" || flyerPlotter
                )
                : ""}

              \${advanced
                ? check(
                  "Вырубка",
                  path("diecut"),
                  p.diecut,
                  d.product === "paket" &&
                    order.bag.includeStamp &&
                    p.role === "bag"
                )
                : ""}

              \${d.product === "flyer"
                ? check("Плоттерная резка", path("plotter"), original.plotter)
                : ""}
            </div>

            \${flyerPlotter ? `
              <p class="small section-gap">
                \${nonnegative(cfg.extra.flyerPlotterSheet)
                  ? money(cfg.extra.flyerPlotterSheet)
                  : "Тариф не задан"}
                за секцию 320×450 мм.

                Минимум:
                \${nonnegative(cfg.extra.flyerPlotterMinimum)
                  ? money(cfg.extra.flyerPlotterMinimum)
                  : "не задан"}
                на весь заказ до общей наценки.

                Запас не отправляется на плоттер.
                Обычная резка этого компонента не начисляется.
              </p>
            ` : ""}

            \${p.score ? `
              <div class="fields section-gap">
                \${input("Бигов на элемент", path("scoreCount"), p.scoreCount, {
                  min: 1, step: 1
                })}
              </div>
            ` : ""}

            \${advanced ? `
              <details id="component-tech-\${i}">
                <summary>Технология и параметры компонента</summary>

                <div class="fields">
                  \${input("Название", path("name"), original.name, {
                    text: true, full: true, disabled: core
                  })}

                  \${select("Назначение", path("role"), p.role, [
                    ["other", "Другой компонент"],
                    ["cover", "Обложка"],
                    ["block", "Блок / листы"],
                    ["backing", "Подложка"],
                    ["header", "Шапка"],
                    ["base", "Основание"],
                    ...(p.role === "bag" ? [["bag", "Развёртка пакета"]] : [])
                  ], { disabled: core || managed })}

                  \${select("Способ количества", path("mode"), p.mode, [
                    ["units", "Элементы"],
                    ["pages", "Полосы"]
                  ], { disabled: core || managed })}

                  \${!isSticker(d) ? `
                    \${select("Цена бумаги", path("priceMode"), p.priceMode, [
                      ["kg", "За килограмм"],
                      ["sheet", "За печатный лист"]
                    ])}

                    \${p.priceMode === "kg"
                      ? input("Бумага, ₽/кг", path("priceKg"), p.priceKg)
                      : input("Бумага, ₽/лист", path("priceSheet"), p.priceSheet)}
                  ` : ""}

                  \${input("Вылет с каждой стороны, мм", path("bleed"), p.bleed)}

                  \${input("Комплектов форм / макетов", path("setups"), p.setups, {
                    min: 1,
                    step: 1,
                    disabled: d.product === "broshyura"
                  })}

                  \${p.diecut ? `
                    \${input("Изделий на штампе", path("perStamp"), p.perStamp, {
                      min: 1, step: 1
                    })}

                    \${input("Стоимость штампа, ₽", path("stamp"), p.stamp, {
                      disabled: d.product === "paket" &&
                        order.bag.includeStamp && p.role === "bag"
                    })}
                  ` : ""}

                  \${p.emboss
                    ? input("Стоимость клише, ₽", path("plate"), p.plate)
                    : ""}
                </div>

                <p class="small section-gap">
                  Цифра SRA3 и B2: приладка печати не оплачивается.
                  Число форм влияет на заданный технологический запас.
                  Правки стоимости действуют только в текущем заказе.
                </p>
              </details>
            ` : ""}
          ` : ""}
        </article>
      `;
    }).join("");

    \$("components").innerHTML = html;
  }

  function renderAssembly() {
    const accessible = pro || order.product === "flyer";

    \$("assemblyCard").hidden =
      !accessible || order.product === "uvprint";

    if (!accessible || order.product === "uvprint") return;

    let d;

    try {
      d = derive(order, cfg);
    } catch {
      d = order;
    }

    const automatic = [
      "bloknot", "broshyura", "quarter",
      "threeinone", "tent", "wall"
    ].includes(order.product);

    \$("assembly").innerHTML = `
      <div class="fields">
        \${input("Сборка, ₽/изделие", "assembly", d.assembly, {
          disabled: automatic
        })}

        \${input("Настройка сборки, ₽/заказ", "assemblySetup", order.assemblySetup)}

        \${input(
          "Базовые комплектующие, ₽/изделие",
          "accessories",
          order.product === "quarter" ? d.accessories : order.accessories,
          { disabled: order.product === "quarter" }
        )}

        \${input("Прочие расходы, ₽/заказ", "extra", order.extra)}

        \${input(
          "Примечание к комплектующим",
          "accessoriesNote",
          order.accessoriesNote,
          {
            text: true,
            full: true,
            disabled: order.product === "quarter"
          }
        )}
      </div>

      <p class="small section-gap">
        Автоматическая сборка берётся из prices.js.
        Покупные блоки 3 в 1 и домика добавляются отдельно.
        Каширование основания домика — отдельно.
      </p>
    `;
  }

  // ============================================================
  // СХЕМА ПАКЕТА
  // ============================================================

  function bagSVG(b, physical = false) {
    const g = bagGeometry(b);
    const lines = bagLines(b);
    if (!lines.length) return "";

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 \${g.width} ${g.height}"
        \${physical
          ? `width="${g.width}mm" height="${g.height}mm"`
          : 'role="img" aria-label="Предварительная развёртка пакета"'}
      >
        <rect
          x="0" y="0"
          width="\${g.width}" height="${g.height}"
          fill="none" stroke="#b3bacb" stroke-width=".7"
        />
        \${lines.map(line => `
          <line
            x1="\${line.x1}" y1="${line.y1}"
            x2="\${line.x2}" y2="${line.y2}"
            stroke="#635bff" stroke-width="1" fill="none"
          />
        `).join("")}
      </svg>
    `;
  }

  function renderBag() {
    const root = \$("bagPreview");
    if (!root) return;

    const svg = bagSVG(order.bag);

    if (!svg) {
      root.textContent = "Укажите размеры пакета.";
      return;
    }

    const g = bagGeometry(order.bag);
    const estimate = stampEstimate(order.bag, cfg);

    root.innerHTML = `
      <div class="actions">
        <strong>
          \${num(g.width)}×${num(g.height)} мм · ${g.parts} ч.
        </strong>
        <button class="button compact" data-action="bag-svg">
          Скачать SVG
        </button>
      </div>

      \${svg}

      <p class="small">
        Предварительная схема, не производственный чертёж штампа.
      </p>

      \${pro ? `
        <p class="small">
          Линии: \${num(estimate.meters)} пог. м.
          Оценка штампа: \${money(estimate.cost)}.
          \${order.bag.includeStamp
            ? "Включён."
            : "Не включён автоматически."}
        </p>
      ` : ""}
    `;
  }

  // ============================================================
  // ОПИСАНИЕ ЗАКАЗА
  // ============================================================

  function describe(d, result, c = cfg) {
    if (d.product === "uvprint") {
      const u = d.uv;

      return [
        UV_TYPES.find(([id]) => id === u.type)?.[1] || "УФ-печать",
        u.type === "timedSheet"
          ? "Лист 500×700 мм, одна сторона."
          : u.type !== "pens"
            ? `${num(u.w)}×${num(u.h)} мм.`
            : "",
        !["pens", "pvc3"].includes(u.type)
          ? (u.white ? "С белилами." : "Без белил.")
          : "",
        u.type === "designer300" ? `Цветность ${u.designerColor}.` : "",
        u.type === "designer300" && u.softTouch ? "Софт-тач включён." : "",
        result?.info || ""
      ].filter(Boolean).join("\n");
    }

    const lines = [];

    if (d.product === "paket") {
      lines.push(
        `Готовый пакет: ${d.bag.a}×${d.bag.b}×${d.bag.c} мм.`
      );
      if (d.bag.includeStamp) lines.push("Новый штамп включён.");
    }

    for (const p of d.components.filter(item => item.enabled)) {
      const operations = [];

      if (p.cutting) operations.push("резка");

      if (p.lamination !== "none") {
        operations.push(
          (p.lamination === "soft" ? "софт-тач" : "ламинация") +
          `, сторон: ${p.lamSides}`
        );
      }

      if (p.score) operations.push("биговка");
      if (p.folding) operations.push("фальцовка");
      if (p.diecut) operations.push("вырубка");
      if (p.uv) operations.push("УФ-лак");
      if (p.emboss) operations.push("тиснение");

      if (d.product === "stickerpack" ||
          (d.product === "flyer" && p.plotter)) {
        operations.push("плоттерная резка");
      }

      lines.push(
        `${p.name}: ${num(p.w)}×${num(p.h)} мм; ` +
        (p.mode === "pages"
          ? `${p.pages} полос`
          : `${p.units} эл./изд.`) +
        `; ${c.papers[p.paper]?.label || p.paper}, ${p.density} г/м²; ` +
        (p.color === "none" ? "без печати" : p.color) +
        (operations.length ? "; " + operations.join(", ") : "") +
        "."
      );
    }

    if (d.accessoriesNote) {
      lines.push("Комплектующие: " + d.accessoriesNote + ".");
    }

    if (d.product === "tent" && d.tent.blockMode !== "printed") {
      lines.push("На календарь включён один готовый покупной блок Полимат.");

      if (d.tent.blockMode === "polimatCover") {
        lines.push("Печать отдельной верхней обложки включена.");
      }
    }

    if (d.product === "flyer") {
      const plotterParts = (result?.parts || []).filter(p => p.flyerPlotter);

      if (plotterParts.length) {
        const count = plotterParts.reduce(
          (sum, p) => sum + p.plotterSheets,
          0
        );
        lines.push("Плоттер: " + num(count) + " секций 320×450 мм.");
      }
    }

    if (result?.hybrid) {
      lines.push("Комбинированное производство:");
      result.parts.forEach(p => {
        lines.push(p.name + " — " + p.method + ".");
      });
    }

    (result?.warnings || []).forEach(warning => {
      lines.push("Важно: " + warning);
    });

    return lines.join("\n");
  }

  // ============================================================
  // РЕЗУЛЬТАТ
  // ============================================================

  function renderResult(result, best) {
    const opened = new Set([
      ...document.querySelectorAll(
        "#results details[open][id], #professionalResults details[open][id]"
      )
    ].map(node => node.id));

    \$("results").innerHTML = `
      <div class="result-main">
        <div class="result-top">
          <h2>Ваш расчёт</h2>
          <span class="badge">
            \${archived ? "Архивные тарифы" : "Предварительно"}
          </span>
        </div>

        <div class="price-label">Стоимость заказа</div>
        <div class="price">\${money(result.price)}</div>

        <div class="unit-price">
          \${money(result.unitPrice)} за единицу ·
          \${num(order.quantity)} шт.
        </div>

        <div class="divider"></div>
        <h3>\${esc(order.name)}</h3>

        <dl class="spec-list">
          <div class="spec-row">
            <dt>Изделие</dt>
            <dd>\${esc(product(order.product)[1])}</dd>
          </div>
          <div class="spec-row">
            <dt>Тираж</dt>
            <dd>\${num(order.quantity)} шт.</dd>
          </div>
          <div class="spec-row">
            <dt>Тарифы</dt>
            <dd>\${esc(cfg.meta.version)}</dd>
          </div>
        </dl>

        <details class="section-gap" id="result-spec">
          <summary class="small">Полный состав заказа</summary>
          <div class="result-description section-gap">
            \${esc(describe(derived, result))}
          </div>
        </details>

        \${order.note ? `
          <p class="result-description section-gap">\${esc(order.note)}</p>
        ` : ""}

        <div class="technology">
          <strong>\${esc(result.label)}</strong>
          <small>
            \${result.uv
              ? "Продажный тариф без общей наценки"
              : result.id === best.id
                ? "Минимальная учтённая себестоимость"
                : "Выбран вручную"}
          </small>
        </div>

        \${result.warnings.map(warning => `
          <div class="notice warning section-gap">\${esc(warning)}</div>
        `).join("")}

        \${result.uv ? `
          <div class="table-scroll section-gap">
            <table>
              <tbody>
                \${result.rows.map(([label, value]) => `
                  <tr><td>\${esc(label)}</td><td>${esc(value)}</td></tr>
                `).join("")}
              </tbody>
            </table>
            <p class="small section-gap">\${esc(result.info)}</p>
          </div>
        ` : ""}

        <div class="result-actions">
          <button class="button primary" data-action="save">
            Сохранить расчёт
          </button>
          <div class="secondary-actions">
            <button class="button" data-action="copy">Копировать</button>
            <button class="button" data-action="print">Печать</button>
          </div>
        </div>
      </div>

      <div class="result-footnote">
        SlonPress.ru. Итог подтверждается после проверки макета
        и производственных ограничений.
        \${cfg.meta.demo ? "Используются демонстрационные тарифы." : ""}
      </div>
    `;

    if (!pro) {
      \$("professionalResults").innerHTML = "";
    } else if (result.uv) {
      \$("professionalResults").innerHTML = `
        <div class="notice">
          УФ использует продажные тарифы.
          Отдельная себестоимость и прибыль не определяются.
        </div>
      `;
    } else {
      \$("professionalResults").innerHTML = `
        <details class="foldout" id="economics" open>
          <summary>Экономика заказа</summary>
          <div class="foldout-body">
            <div class="cost-row">
              <span>Себестоимость</span>
              <strong>\${money(result.cost)}</strong>
            </div>
            <div class="cost-row profit">
              <span>Прибыль</span>
              <strong>\${money(result.profit)}</strong>
            </div>
            <p class="small">До налогов и неучтённых накладных расходов.</p>
          </div>
        </details>

        <details class="foldout section-gap" id="methods">
          <summary>Сравнить технологии</summary>

          <div class="foldout-body">
            <button class="button compact" data-action="method-auto">
              Автоматический выбор
            </button>

            <div class="table-scroll section-gap">
              <table>
                <thead>
                  <tr><th>Вариант</th><th>Цена</th><th></th></tr>
                </thead>
                <tbody>
                  \${methods.map(m => m.valid ? `
                    <tr class="
                      \${m.id === best.id ? "best" : ""}
                      \${m.id === result.id ? "selected" : ""}
                    ">
                      <td>
                        \${m.id === best.id ? "★ " : ""}${esc(m.label)}
                        <div class="small">Затраты: \${money(m.cost)}</div>
                      </td>
                      <td>\${money(m.price)}</td>
                      <td>
                        <button
                          class="text-button"
                          data-action="method"
                          data-id="\${esc(m.id)}"
                        >Выбрать</button>
                      </td>
                    </tr>
                  ` : `
                    <tr>
                      <td>\${esc(m.label)}</td>
                      <td colspan="2" class="small">\${esc(m.reason)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <details class="foldout section-gap" id="cost-details">
          <summary>Бумага, печать и операции</summary>

          <div class="foldout-body">
            \${result.parts.map(p => `
              <div class="detail-block">
                <h3>\${esc(p.name)}</h3>

                <p class="small">
                  \${esc(p.method)}.
                  Вместимость: \${num(p.capacity)}.
                  Листов: \${num(p.baseSheets)} + ${num(p.spoil)} запас.
                  Форм: \${num(p.formCount)}.
                  \${p.setupCount
                    ? `Приладки: ${num(p.setupCount)} по ${money(p.setupRate)}.`
                    : "Приладка печати не начисляется."}
                  \${p.plotterSheets
                    ? "Секций плоттера: " + num(p.plotterSheets) + "."
                    : ""}
                </p>

                \${Object.entries(p.rows)
                  .filter(([, value]) => value !== 0)
                  .map(([key, value]) => `
                    <div class="cost-row">
                      <span>\${esc(ROW_LABELS[key] || key)}</span>
                      <strong>\${money(value)}</strong>
                    </div>
                  `).join("")}
              </div>
            `).join("")}

            <div class="detail-block">
              <div class="cost-row">
                <span>Сборка</span><strong>\${money(result.assembly)}</strong>
              </div>
              <div class="cost-row">
                <span>Комплектующие</span><strong>\${money(result.accessories)}</strong>
              </div>
              <div class="cost-row">
                <span>Прочее</span><strong>\${money(result.extra)}</strong>
              </div>
            </div>
          </div>
        </details>
      `;
    }

    for (const id of opened) {
      const node = \$(id);
      if (node instanceof HTMLDetailsElement) node.open = true;
    }

    \$("mobilePrice").textContent = money(result.price);
    \$("mobileUnit").textContent = money(result.unitPrice) + " за единицу";
  }

  function recalculate() {
    clearTimeout(timer);

    chosen = null;
    methods = [];

    try {
      derived = derive(order, cfg);

      const errors = validateOrder(derived, cfg);
      if (errors.length) throw new Error(errors.join("\n"));

      methods = order.product === "uvprint"
        ? [calculateUV(derived, cfg)]
        : calculateMethods(derived, cfg);

      const valid = methods.filter(m => m.valid);

      if (!valid.length) {
        throw new Error(
          "Подходящий вариант не найден.\n" +
          methods.map(m => m.label + ": " + m.reason).join("\n")
        );
      }

      const best = valid.reduce((a, b) =>
        (a.cost ?? a.price) <= (b.cost ?? b.price) ? a : b
      );

      chosen = valid.find(m => m.id === selectedMethod) || best;

      if (selectedMethod && !valid.some(m => m.id === selectedMethod)) {
        selectedMethod = null;
      }

      renderResult(chosen, best);
    } catch (error) {
      console.warn(error);

      \$("results").innerHTML = `
        <div class="error">
          <h3>Уточните параметры</h3>
          \${String(error.message).split("\n").map(text => `
            <div>\${esc(text)}</div>
          `).join("")}
        </div>
      `;

      \$("professionalResults").innerHTML = "";
      \$("mobilePrice").textContent = "—";
      \$("mobileUnit").textContent = "Расчёт недоступен";
    }

    renderBag();
  }

  function renderAll() {
    clearTimeout(timer);

    const opened = new Set([
      ...document.querySelectorAll("details[open][id]")
    ].map(node => node.id));

    const p = product(order.product);

    \$("productTitle").textContent = p[1];
    \$("productGroup").textContent = p[2];
    \$("productHint").textContent = p[4];

    \$("proButton").classList.toggle("active", pro);
    \$("proButton").setAttribute("aria-pressed", String(pro));
    \$("proButton").textContent = pro
      ? "Закрыть проф. режим"
      : "Проф. режим";

    \$("sidebarVersion").textContent = "Тарифы " + current.meta.version;
    \$("footerVersion").textContent = "Тарифы расчёта: " + cfg.meta.version;

    \$("demoBanner").hidden = !cfg.meta.demo;
    \$("archiveBanner").hidden = !archived;

    if (archived) {
      \$("archiveBanner").innerHTML = `
        Открыты архивные тарифы \${esc(cfg.meta.version)}.
        Сохранённый документ остаётся неизменным.
        Рабочий пересчёт использует текущую версию формул:
        приладки цифровой печати исключены.

        <div class="actions">
          <button class="button compact" data-action="use-current">
            Пересчитать по текущим тарифам
          </button>
        </div>
      `;
    }

    renderNav();
    renderOrderForm();
    renderComponents();
    renderAssembly();
    updateCounts();
    recalculate();

    for (const id of opened) {
      const node = \$(id);
      if (node instanceof HTMLDetailsElement) node.open = true;
    }
  }

  function chooseProduct(id, reset = false) {
    if (!PRODUCTS.some(p => p[0] === id)) {
      toast("Изделие недоступно для новых расчётов.");
      return;
    }

    if (reset &&
        !confirm("Сбросить параметры к текущему справочнику тарифов?")) {
      return;
    }

    const previousQuantity = order?.quantity;

    cfg = clone(current);
    archived = false;
    order = baseOrder(id, cfg);

    if (!reset && id !== "uvprint" && integer(previousQuantity)) {
      order.quantity = previousQuantity;
    }

    selectedMethod = null;
    renderAll();
  }

  // ============================================================
  // ПРИМЕНЕНИЕ ТЕКУЩИХ ТАРИФОВ
  // ============================================================

  function repriceOrder(source) {
    const o = normalizeOrder(clone(source), current, false);

    const sourceDefaults = current.products[o.product] ||
      (o.product === "diecut" ? current.products.flyer : null);

    if (!sourceDefaults) throw new Error("Нет текущих настроек изделия.");

    for (const key of [
      "assembly", "assemblySetup", "accessories", "extra", "accessoriesNote"
    ]) {
      o[key] = sourceDefaults[key];
    }

    o.components = o.components.map((p, index) => {
      const specs = sourceDefaults.components;

      let base = specs[index];

      if (!base || (base.role || "other") !== p.role) {
        const sameRole = specs.filter(
          s => (s.role || "other") === p.role
        );
        base = sameRole.length === 1 ? sameRole[0] : null;
      }

      const paper = current.papers[p.paper];
      if (!paper) {
        throw new Error("В текущих тарифах отсутствует материал " + p.paper);
      }

      const samePaper = base &&
        (base.paper || current.component.paper) === p.paper;

      return {
        ...p,
        priceMode: samePaper
          ? base.priceMode || paper.priceMode
          : paper.priceMode,
        priceKg: samePaper
          ? base.priceKg ?? paper.priceKg
          : paper.priceKg,
        priceSheet: samePaper
          ? base.priceSheet ?? paper.priceSheet
          : paper.priceSheet,
        stamp: base?.stamp ?? current.component.stamp,
        plate: base?.plate ?? current.component.plate
      };
    });

    return o;
  }

  // ============================================================
  // ХРАНЕНИЕ И СНИМКИ
  // ============================================================

  function database() {
    return {
      app: "print-studio",
      version: DATABASE_VERSION,
      exported: new Date().toISOString(),
      saved,
      templates
    };
  }

  function persist() {
    if (!storageReadable) {
      toast(
        "Старое хранилище не удалось прочитать. " +
        "Автозапись заблокирована, чтобы не затереть данные. Экспортируйте текущие."
      );
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(database()));
      updateCounts();
      return true;
    } catch (error) {
      console.error(error);
      updateCounts();
      toast("Не удалось сохранить в браузере. Экспортируйте данные.");
      return false;
    }
  }

  function updateCounts() {
    \$("savedCount").textContent = String(saved.length);
    \$("savedCountTop").textContent = String(saved.length);
  }

  function snapshot() {
    return {
      order: clone(order),
      config: clone(cfg),
      method: chosen?.id || selectedMethod
    };
  }

  function quote(result = chosen) {
    return [
      "SlonPress.ru",
      order.name,
      "Тираж: " + num(order.quantity) + " шт.",
      describe(derived, result),
      "Технология: " + result.label,
      "Стоимость: " + money(result.price),
      "За единицу: " + money(result.unitPrice),
      order.note ? "Комментарий: " + order.note : "",
      "Тарифы: " + cfg.meta.version,
      "Предварительный расчёт. Итог подтверждается после проверки макета."
    ].filter(Boolean).join("\n");
  }

  function checkSnapshot(s) {
    if (!object(s) || !object(s.order) || !product(s.order.product)) {
      throw new Error("Повреждён снимок заказа.");
    }

    const configErrors = validateConfig(s.config);
    if (configErrors.length) throw new Error(configErrors[0]);

    const o = normalizeOrder(clone(s.order), s.config, false);

    if (!Array.isArray(o.components) || o.components.length > 100) {
      throw new Error("Повреждён состав заказа.");
    }

    for (const key of [
      "bag", "wall", "uv", "calendar", "three", "tent", "customBook"
    ]) {
      if (!object(o[key])) {
        throw new Error("Повреждён раздел заказа: " + key);
      }
    }

    if (typeof o.name !== "string" || typeof o.note !== "string") {
      throw new Error("Повреждено название или примечание.");
    }

    const errors = validateOrder(derive(o, s.config), s.config);
    if (errors.length) throw new Error(errors[0]);

    return {
      order: o,
      config: clone(s.config),
      method: typeof s.method === "string" ? s.method : null
    };
  }

  function readDatabase(raw) {
    if (raw?.app !== "print-studio" ||
        raw.version !== DATABASE_VERSION) {
      throw new Error(
        "Неверный формат резервной копии. Старый формат версии 6 не поддерживается."
      );
    }

    if (
      !Array.isArray(raw.saved) ||
      !Array.isArray(raw.templates) ||
      raw.saved.length > 2000 ||
      raw.templates.length > 1000
    ) {
      throw new Error("Неверный состав резервной копии.");
    }

    const used = new Set();

    const restoreId = value => {
      let id = typeof value === "string" && value ? value : uid();
      if (used.has(id)) id = uid();
      used.add(id);
      return id;
    };

    const restoredSaved = raw.saved.map(item => {
      if (
        !object(item) ||
        typeof item.name !== "string" ||
        !validCost(item.price) ||
        !integer(item.quantity) ||
        !(item.cost === null || validCost(item.cost)) ||
        typeof item.quote !== "string"
      ) {
        throw new Error("Повреждён сохранённый расчёт.");
      }

      return {
        id: restoreId(item.id),
        name: item.name,
        created: String(item.created || ""),
        price: item.price,
        cost: item.cost,
        quantity: item.quantity,
        quote: item.quote,
        description: String(item.description || ""),
        method: String(item.method || ""),
        snapshot: checkSnapshot(item.snapshot)
      };
    });

    const restoredTemplates = raw.templates.map(item => {
      if (!object(item) || typeof item.name !== "string") {
        throw new Error("Повреждён шаблон.");
      }

      return {
        id: restoreId(item.id),
        name: item.name,
        snapshot: checkSnapshot(item.snapshot)
      };
    });

    return {
      saved: restoredSaved,
      templates: restoredTemplates
    };
  }

  function loadStorage() {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return;

      const db = readDatabase(JSON.parse(text));
      saved = db.saved;
      templates = db.templates;
    } catch (error) {
      storageReadable = false;
      console.error(error);
      toast("Сохранённые данные не прочитаны: " + error.message);
    }
  }

  function saveResult() {
    recalculate();

    if (!chosen) return toast("Сначала исправьте параметры.");
    if (saved.length >= 2000) return toast("Предел: 2000 расчётов.");

    saved.push({
      id: uid(),
      name: order.name || product(order.product)[1],
      created: new Date().toISOString(),
      quantity: order.quantity,
      price: chosen.price,
      cost: chosen.cost,
      method: chosen.label,
      description: describe(derived, chosen),
      quote: quote(),
      snapshot: snapshot()
    });

    updateCounts();
    if (persist()) toast("Расчёт сохранён.");
  }

  function saveTemplate() {
    recalculate();

    if (!chosen) return toast("Сначала исправьте параметры.");

    if (order.product === "diecut") {
      return toast("Архивное изделие удалено из каталога новых шаблонов.");
    }

    const entered = prompt("Название шаблона:", order.name);
    if (entered === null || !entered.trim()) return;

    const name = entered.trim();
    const existing = templates.find(t => t.name === name);

    if (existing) {
      if (!confirm("Перезаписать шаблон?")) return;
      existing.snapshot = snapshot();
    } else {
      if (templates.length >= 1000) return toast("Предел: 1000 шаблонов.");
      templates.push({
        id: uid(),
        name,
        snapshot: snapshot()
      });
    }

    if (persist()) {
      toast("Шаблон сохранён. При открытии применяются текущие цены.");
    }
  }

  function loadSaved(id) {
    const item = saved.find(x => x.id === id);
    if (!item) return;

    const s = checkSnapshot(item.snapshot);

    order = s.order;
    cfg = s.config;
    selectedMethod = s.method;
    archived = true;

    closeDialog();
    renderAll();

    window.scrollTo({ top: 0, behavior: "smooth" });

    toast(
      "Открыта рабочая копия. Сохранённый документ не изменён; " +
      "пересчёт использует обновлённые формулы."
    );
  }

  function loadTemplate(id) {
    const item = templates.find(x => x.id === id);
    if (!item) return;

    if (item.snapshot.order.product === "diecut") {
      return toast("Этот вид изделия удалён из каталога.");
    }

    order = repriceOrder(checkSnapshot(item.snapshot).order);
    cfg = clone(current);
    archived = false;
    selectedMethod = null;

    closeDialog();
    renderAll();

    toast("Шаблон открыт с текущими ценами. Проверьте нестандартные расходы.");
  }

  // ============================================================
  // ДИАЛОГИ И ПАРОЛЬ
  // ============================================================

  function openDialog(title, html, view) {
    dialogView = view;
    \$("dialogTitle").textContent = title;
    \$("dialogBody").innerHTML = html;

    if (!\$("managerDialog").open) $("managerDialog").showModal();
  }

  function closeDialog() {
    \$("managerDialog").close();
    dialogView = "";
  }

  function openProfessionalLogin() {
    openDialog(
      "Профессиональный режим",
      `
        <form id="professionalLoginForm">
          <label class="field">
            <span>Пароль</span>
            <input
              id="professionalPassword"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              required
            >
          </label>

          <p class="small section-gap">
            Доступ к экономике заказа и служебным параметрам.
            Это ограничение интерфейса, не серверная авторизация.
          </p>

          <p
            id="professionalLoginError"
            class="danger section-gap"
            role="alert"
          ></p>

          <div class="actions section-gap">
            <button class="button primary" type="submit">Открыть</button>

            <button
              class="button"
              type="button"
              data-action="dialog-close"
            >Отмена</button>
          </div>
        </form>
      `,
      "professional-login"
    );

    requestAnimationFrame(() => \$("professionalPassword")?.focus());
  }

  function savedDialog() {
    openDialog(
      "Сохранённые расчёты",
      `
        <div class="actions">
          <button class="button compact" data-action="saved-copy">
            Копировать выбранные / все
          </button>
          <button class="button compact" data-action="export">Экспорт</button>
          <button class="button compact" data-action="import">Импорт</button>
          <button class="button compact danger" data-action="saved-clear">
            Удалить все
          </button>
        </div>

        <p class="small section-gap">
          Здесь показаны цены сохранённых документов.
          Открытие создаёт рабочую копию с текущими формулами
          и архивными тарифами.
        </p>

        \${saved.length ? saved.map(item => {
          const date = new Date(item.created);
          const dateLabel = Number.isNaN(date.getTime())
            ? item.created
            : date.toLocaleString("ru-RU");

          return `
            <article class="saved-item">
              <div class="saved-top">
                <label>
                  <input
                    type="checkbox"
                    data-saved="\${esc(item.id)}"
                    \${selectedSaved.has(item.id) ? "checked" : ""}
                  >
                  <strong>\${esc(item.name)}</strong>
                </label>
                <span class="saved-price">\${money(item.price)}</span>
              </div>

              <p class="small">
                \${esc(dateLabel)} ·
                \${num(item.quantity)} шт. ·
                тарифы \${esc(item.snapshot.config.meta.version)}
              </p>

              <details class="section-gap">
                <summary class="small">Состав заказа</summary>
                <div class="saved-description">\${esc(item.description)}</div>
              </details>

              \${pro && item.cost !== null ? `
                <p class="small section-gap">
                  Себестоимость: \${money(item.cost)}.
                  Прибыль: \${money(item.price - item.cost)}.
                </p>
              ` : ""}

              <div class="actions">
                <button
                  class="button compact"
                  data-action="saved-load"
                  data-id="\${esc(item.id)}"
                >Открыть копию</button>

                <button
                  class="button compact"
                  data-action="saved-item-copy"
                  data-id="\${esc(item.id)}"
                >Копировать документ</button>

                <button
                  class="button compact danger"
                  data-action="saved-delete"
                  data-id="\${esc(item.id)}"
                >Удалить</button>
              </div>
            </article>
          `;
        }).join("") : `
          <div class="empty">Пока нет сохранённых расчётов.</div>
        `}

        <div id="savedSum" class="sticky-sum" hidden></div>
      `,
      "saved"
    );

    renderSavedSum();
  }

  function renderSavedSum() {
    const root = \$("savedSum");
    if (!root) return;

    const items = saved.filter(x => selectedSaved.has(x.id));
    root.hidden = !items.length;
    if (!items.length) return;

    const sum = items.reduce((a, x) => a + x.price, 0);
    const known = items.every(x => x.cost !== null);
    const cost = items.reduce((a, x) => a + (x.cost || 0), 0);

    root.textContent =
      `Выбрано: ${items.length}. Цена: ${money(sum)}.` +
      (pro && known
        ? ` Себестоимость: ${money(cost)}. Прибыль: ${money(sum - cost)}.`
        : pro
          ? " Общая себестоимость не определена: есть УФ-тарифы."
          : "");
  }

  function templatesDialog() {
    openDialog(
      "Шаблоны",
      `
        <p class="muted">
          Сохраняют состав и параметры изделия.
          При открытии стоимостные поля заменяются текущими базовыми ценами.
        </p>

        <div class="actions section-gap">
          <button class="button compact" data-action="template-save">
            Сохранить текущий заказ
          </button>
        </div>

        \${templates.length ? templates.map(t => `
          <div class="saved-item">
            <strong>\${esc(t.name)}</strong>
            <div class="actions">
              <button
                class="button compact"
                data-action="template-load"
                data-id="\${esc(t.id)}"
                \${t.snapshot.order.product === "diecut" ? "disabled" : ""}
              >Применить</button>

              <button
                class="button compact danger"
                data-action="template-delete"
                data-id="\${esc(t.id)}"
              >Удалить</button>
            </div>
          </div>
        `).join("") : `
          <div class="empty">Шаблонов пока нет.</div>
        `}
      `,
      "templates"
    );
  }

  const RATE_NAMES = {
    digitalPrint: "SRA3, ₽/лист/сторона",
    b2Print: "B2, ₽/лист/сторона",
    offsetPrint: "Офсет, ₽/лист/сторона",
    digitalSetup: "Приладка SRA3 — не применяется",
    b2Setup: "Приладка B2 — не применяется",
    offsetSetup: "Приладка офсета, ₽",
    digitalSpoil: "Запас SRA3, листов/форму",
    b2Spoil: "Запас B2, листов/форму",
    offsetSpoil: "Запас офсета, листов/форму",
    cutting: "Резка, ₽/лист",
    cuttingSetup: "Настройка резки, ₽",
    lamination: "Ламинация, ₽/лист/сторона",
    softDigital: "Софт-тач SRA3, ₽/лист/сторона",
    softOther: "Софт-тач прочие, ₽/лист/сторона",
    laminationSetup: "Настройка ламинации, ₽",
    score: "Биговка, ₽/биг",
    scoreSetup: "Настройка биговки, ₽",
    folding: "Фальцовка, ₽/элемент",
    foldingSetup: "Настройка фальцовки, ₽",
    diecut: "Вырубка, ₽/удар",
    diecutSetup: "Настройка вырубки, ₽",
    uv: "УФ-лак, ₽/лист",
    uvSetup: "Настройка УФ-лака, ₽",
    emboss: "Тиснение, ₽/элемент",
    embossSetup: "Настройка тиснения, ₽",
    rounding: "Округление вверх, ₽",
    flyerPlotterSheet: "Плоттер листовок, ₽/секция 320×450",
    flyerPlotterMinimum: "Минимум плоттера листовок, ₽/заказ",
    tentPolimatBlock: "Покупной блок домика, ₽/шт.",
    tentPolimatW: "Ширина покупного блока, мм",
    tentPolimatH: "Высота покупного блока, мм"
  };

  function objectTable(obj) {
    return `
      <div class="table-scroll">
        <table><tbody>
          \${Object.entries(obj).map(([key, value]) => `
            <tr>
              <td>\${esc(RATE_NAMES[key] || key)}</td>
              <td>\${esc(typeof value === "number" ? num(value) : String(value))}</td>
            </tr>
          `).join("")}
        </tbody></table>
      </div>
    `;
  }

  function ratesDialog() {
    const effectiveRates = {
      ...current.rates,
      digitalSetup: 0,
      b2Setup: 0
    };

    openDialog(
      "Тарифы и данные",
      `
        <div class="notice">
          Источник новых тарифов — <strong>prices.js</strong>.
          Версия: \${esc(current.meta.version)}.
          Дата: \${esc(current.meta.updated)}.
          \${archived ? "<br>Текущий заказ использует архивный справочник." : ""}
        </div>

        \${pro ? `
          <p class="muted">
            Приладки печати SRA3 и B2 принудительно отключены в формулах.
            Специальные приладки действуют только на офсете.
          </p>

          <details class="foldout section-gap">
            <summary>Общие правила</summary>
            <div class="foldout-body">
              \${objectTable({
                "Наценка, %": current.markup,
                "Гибридный блокнот": current.hybrid ? "Да" : "Нет",
                "Предел гибридного тиража": current.hybridLimit
              })}
            </div>
          </details>

          <details class="foldout section-gap">
            <summary>Печать и отделка</summary>
            <div class="foldout-body">\${objectTable(effectiveRates)}</div>
          </details>

          <details class="foldout section-gap">
            <summary>Дополнительные тарифы</summary>
            <div class="foldout-body">\${objectTable(current.extra)}</div>
          </details>

          <details class="foldout section-gap">
            <summary>Специальные приладки офсета</summary>
            <div class="foldout-body">
              \${objectTable({ ...current.policy, scope: "offset" })}
            </div>
          </details>

          <details class="foldout section-gap">
            <summary>Бумага и материалы</summary>
            <div class="foldout-body">
              \${Object.values(current.papers).map(p => `
                <div class="detail-block">
                  <h3>\${esc(p.label)}</h3>
                  <p class="small">
                    \${money(p.priceKg)}/кг ·
                    \${money(p.priceSheet)}/лист.
                  </p>
                </div>
              `).join("")}
            </div>
          </details>

          <details class="foldout section-gap">
            <summary>Календарные блоки</summary>
            <div class="foldout-body">
              \${Object.keys(TIERS).map(tier => `
                <div class="detail-block">
                  <h3>\${TIERS[tier]}</h3>
                  \${Object.values(current.polimat[tier]).map(b => `
                    <p class="small">\${esc(b.name)} — ${money(b.price)}</p>
                  `).join("")}
                </div>
              `).join("")}

              \${["threeMini", "threeMidi"].map(key => `
                <p class="small section-gap">
                  \${esc(current.polimat[key].name)} —
                  \${money(current.polimat[key].price)}
                </p>
              `).join("")}
            </div>
          </details>
        ` : `
          <p class="muted">
            Просмотр полного справочника и экономики доступен
            в профессиональном режиме.
            Параметры компонентов листовок доступны без пароля.
          </p>

          <div class="actions section-gap">
            <button class="button" data-action="pro-login">
              Войти в проф. режим
            </button>
          </div>
        `}

        <div class="actions section-gap">
          <button class="button" data-action="export">
            Экспорт расчётов и шаблонов
          </button>
          <button class="button" data-action="import">
            Импорт резервной копии
          </button>
          <button class="button" data-action="templates-open">
            Шаблоны
          </button>
        </div>

        <p class="small section-gap">
          Резервная копия содержит тарифы внутри снимков.
          Не передавайте её клиентам, если себестоимость служебная.
          Текущий prices.js при импорте не заменяется.
          Пароль интерфейса не защищает файл тарифов.
        </p>
      `,
      "rates"
    );
  }

  // ============================================================
  // ФАЙЛЫ И КОПИРОВАНИЕ
  // ============================================================

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Скопировано.");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";

      const parent = \$("managerDialog").open
        ? \$("managerDialog")
        : document.body;

      parent.appendChild(area);
      area.select();

      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        // Ниже ручной вариант.
      }

      area.remove();

      if (ok) toast("Скопировано.");
      else prompt("Скопируйте текст:", text);
    }
  }

  async function importFile(file) {
    if (!file) return;

    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error("Максимальный размер файла — 20 МБ.");
      }

      const db = readDatabase(JSON.parse(await file.text()));

      if (!confirm(
        "Заменить сохранённые расчёты и шаблоны? " +
        "Текущий prices.js не изменится."
      )) return;

      saved = db.saved;
      templates = db.templates;
      selectedSaved.clear();
      storageReadable = true;

      const ok = persist();
      savedDialog();

      if (ok) toast("Резервная копия импортирована.");
    } catch (error) {
      console.error(error);
      toast("Импорт не выполнен: " + error.message);
    } finally {
      \$("importFile").value = "";
    }
  }

  // ============================================================
  // ИЗМЕНЕНИЯ ПОЛЕЙ
  // ============================================================

  function fieldEditable(path) {
    if (pro) return true;

    if ([
      "bag.extraSheets",
      "bag.confirmPhysical",
      "bag.includeStamp",
      "bag.outerContour"
    ].includes(path)) return false;

    if ([
      "assembly", "assemblySetup", "accessories",
      "extra", "accessoriesNote"
    ].includes(path)) {
      return order.product === "flyer";
    }

    const match = path.match(/^components\.\d+\.(\w+)$/);

    if (match && order.product !== "flyer") {
      const advancedKeys = [
        "enabled", "name", "role", "mode",
        "priceMode", "priceKg", "priceSheet",
        "bleed", "setups", "cutting", "diecut",
        "perStamp", "stamp", "plate", "plotter"
      ];

      if (advancedKeys.includes(match[1])) return false;
    }

    return true;
  }

  function updateField(target, structural) {
    const path = target.dataset.path;
    if (!path || target.disabled || !fieldEditable(path)) return;

    let value;

    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number" || target.dataset.numeric) {
      value = target.value === "" ? NaN : Number(target.value);
    } else {
      value = target.value;
    }

    if (!setPath(order, path, value)) return;

    if (!["name", "note"].includes(path)) selectedMethod = null;

    if (["bag.a", "bag.b", "bag.c"].includes(path)) {
      order.bag.confirmPhysical = false;
      const rule = bagGeometry(order.bag).rule;
      if (rule) order.bag.type = rule.type;
    }

    if (path === "uv.type") {
      order.uv.white = false;
      order.uv.softTouch = false;

      if (value === "adhesive") {
        Object.assign(order.uv, { w: 1000, h: 1000 });
        order.quantity = 1;
      } else if (value === "pens") {
        order.quantity = 100;
      } else if (value === "timedSheet") {
        order.quantity = 1;
      } else {
        Object.assign(order.uv, { w: 100, h: 100 });
        order.quantity = 10;
      }
    }

    const match = path.match(/^components\.(\d+)\.(\w+)$/);

    if (match) {
      const p = order.components[Number(match[1])];
      const key = match[2];

      if (key === "paper") {
        const material = cfg.papers[value];

        if (material) {
          Object.assign(p, {
            density: material.density,
            priceMode: material.priceMode,
            priceKg: material.priceKg,
            priceSheet: material.priceSheet
          });
        }
      }

      if (key === "mode" && value === "pages" && SIDES[p.color] !== 2) {
        p.color = "4+4";
      }

      if (order.product === "flyer") {
        if (key === "plotter" && value) p.diecut = false;
        if (key === "diecut" && value) p.plotter = false;
      }
    }

    if (structural) {
      renderAll();
    } else {
      document.querySelectorAll('[data-action="quantity"]').forEach(button => {
        button.classList.toggle(
          "active",
          Number(button.dataset.value) === order.quantity
        );
      });

      clearTimeout(timer);
      timer = setTimeout(recalculate, 180);
    }
  }

  function setFormat(scope, value) {
    if (scope === "book") {
      if (value === "CUSTOM") {
        const format = FORMATS[order.bookFormat];
        if (format) order.customBook = clone(format);
      }
      order.bookFormat = value;
    }

    if (scope === "wall") {
      if (value === "custom") {
        const format = FORMATS[order.wall.format];
        if (format) Object.assign(order.wall, format);
      }
      order.wall.format = value;
    }

    if (scope === "quarter") {
      const q = order.calendar;

      if (value === "custom" && q.size !== "custom") {
        const geometry = cfg.calendar[q.size];

        Object.assign(q, {
          tier: q.size,
          customW: geometry.w,
          customHeadH: geometry.headH,
          customBackingH: geometry.backingH
        });
      } else if (value !== "custom") {
        q.tier = value;
      }

      q.size = value;
    }

    selectedMethod = null;
    renderAll();
  }

  // ============================================================
  // СОБЫТИЯ
  // ============================================================

  document.addEventListener("input", event => {
    if (!ready) return;

    const target = event.target;

    if (target.matches(
      'input[data-path]:not([type="checkbox"]), textarea[data-path]'
    )) {
      updateField(target, false);
    }
  });

  document.addEventListener("change", event => {
    if (!ready) return;

    const target = event.target;

    try {
      if (target.id === "mobileProduct") {
        chooseProduct(target.value);
        return;
      }

      if (target.matches(
        'select[data-path], input[type="checkbox"][data-path]'
      )) {
        updateField(target, true);
        return;
      }

      if (target.matches("input[data-saved]")) {
        if (target.checked) selectedSaved.add(target.dataset.saved);
        else selectedSaved.delete(target.dataset.saved);

        renderSavedSum();
        return;
      }

      if (target.matches("input[data-path], textarea[data-path]")) {
        recalculate();
      }
    } catch (error) {
      console.error(error);
      toast(error.message);
    }
  });

  document.addEventListener("submit", event => {
    if (event.target.id !== "professionalLoginForm") return;
    event.preventDefault();

    const password = \$("professionalPassword");
    const error = \$("professionalLoginError");

    if (password.value !== PROFESSIONAL_PASSWORD) {
      error.textContent = "Неверный пароль.";
      password.select();
      return;
    }

    password.value = "";
    pro = true;

    closeDialog();
    renderAll();

    toast("Профессиональный режим открыт.");
  });

  document.addEventListener("click", event => {
    if (!ready) return;

    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    try {
      switch (action) {
        case "product":
          chooseProduct(id);
          break;

        case "reset":
          chooseProduct(order.product, true);
          break;

        case "pro-toggle":
          if (pro) {
            pro = false;

            if (\$("managerDialog").open) closeDialog();

            renderAll();
            toast("Профессиональный режим закрыт.");
          } else {
            openProfessionalLogin();
          }
          break;

        case "pro-login":
          if (!pro) openProfessionalLogin();
          else ratesDialog();
          break;

        case "quantity":
          order.quantity = Number(button.dataset.value);
          selectedMethod = null;
          renderAll();
          break;

        case "format":
          setFormat(button.dataset.scope, button.dataset.value);
          break;

        case "bag-preset":
          Object.assign(
            order.bag,
            button.dataset.value === "large"
              ? { a: 300, b: 400, c: 120, type: "half" }
              : {stream error: stream disconnected before completion: stream closed before response.completed
