"use strict";

/*
 * СПРАВОЧНИК ТАРИФОВ
 *
 * 1. Денежные значения — в рублях.
 * 2. Дробные числа записываются через точку: 53.80.
 * 3. Не удаляйте запятые, кавычки и названия полей.
 * 4. После обновления измените version и updated.
 * 5. Стартовые значения необходимо проверить перед использованием.
 *
 * Для новых расчётов используется именно этот файл.
 * Сохранённые расчёты содержат собственный снимок тарифов.
 */

window.PRINT_PRICES = {
  meta: {
    version: "2026-09-18.1",
    updated: "2026-09-18",
    currency: "RUB",
    source: "Внутренний справочник типографии",
    demo: true
  },

  // Наценка обычной полиграфии, процентов.
  markup: 20,

  // Цифровые обложка и подложка блокнота при небольшом тираже.
  hybrid: true,
  hybridLimit: 500,

  // Популярные тиражи.
  quantities: [100, 300, 500, 1000, 3000, 5000],
  defaultQuantity: 500,

  // Форматы оборудования, мм.
  sheets: [
    {
      id: "Z", label: "Цифра SRA3",
      w: 320, h: 450, pw: 310, ph: 430, group: "digital"
    },
    {
      id: "E", label: "Цифра B2",
      w: 520, h: 720, pw: 500, ph: 710, group: "b2"
    },
    {
      id: "A", label: "Офсет 50×70",
      w: 500, h: 700, pw: 480, ph: 690, group: "offset"
    },
    {
      id: "B", label: "Офсет 47×62",
      w: 470, h: 620, pw: 450, ph: 610, group: "offset"
    },
    {
      id: "R", label: "Офсет 47×65",
      w: 470, h: 650, pw: 450, ph: 640, group: "offset"
    },
    {
      id: "M", label: "Офсет 52×72",
      w: 520, h: 720, pw: 500, ph: 710, group: "offset"
    }
  ],

  // Базовые цены материалов.
  // priceSheet — цена одного полного выбранного печатного листа.
  papers: {
    matt: {
      label: "Мелованная",
      density: 300,
      priceMode: "kg",
      priceKg: 155,
      priceSheet: 25
    },
    offset: {
      label: "Офсетная",
      density: 80,
      priceMode: "kg",
      priceKg: 125,
      priceSheet: 25
    },
    cardboard: {
      label: "Картон",
      density: 300,
      priceMode: "kg",
      priceKg: 160,
      priceSheet: 25
    },
    designer: {
      label: "Дизайнерская",
      density: 300,
      priceMode: "sheet",
      priceKg: 155,
      priceSheet: 25
    },
    adhesive: {
      label: "Самоклейка — бумага",
      density: 80,
      priceMode: "sheet",
      priceKg: 155,
      priceSheet: 25
    },
    adhesiveFilm: {
      label: "Самоклейка — плёнка",
      density: 80,
      priceMode: "sheet",
      priceKg: 155,
      priceSheet: 25
    }
  },

  rates: {
    // Печать: руб./лист/сторона.
    digitalPrint: 15,
    b2Print: 50,
    offsetPrint: 2,

    // Приладка: руб./комплект.
    digitalSetup: 300,
    b2Setup: 500,
    offsetSetup: 10000,

    // Технологический запас: листов/комплект приладки.
    digitalSpoil: 3,
    b2Spoil: 3,
    offsetSpoil: 250,

    // Резка: руб./печатный лист и настройка на компонент.
    cutting: 1,
    cuttingSetup: 300,

    // Ламинация: руб./лист/сторона.
    lamination: 12,
    softDigital: 30,
    softOther: 50,
    laminationSetup: 300,

    // Биговка: руб./биг.
    score: 2,
    scoreSetup: 300,

    // Фальцовка: руб./элемент.
    folding: 1,
    foldingSetup: 300,

    // Вырубка: руб./удар.
    diecut: 5,
    diecutSetup: 5000,

    // УФ-лак: руб./печатный лист.
    uv: 10,
    uvSetup: 5000,

    // Тиснение: руб./элемент.
    emboss: 10,
    embossSetup: 4500,

    // Округление продажной цены вверх.
    // 0 — до копеек.
    rounding: 100
  },

  extra: {
    // Сборка блокнотов, руб./изделие.
    notebookA6: 30,
    notebookA5: 35,
    notebookA4: 40,
    notebookCustom: 40,

    brochureAssembly: 15,
    wallAssembly: 100,
    tentAssembly: 35,
    tentMountedBase: 200,

    // Наклейки: материал, руб./м².
    stickerPaperM2: 175,
    stickerFilmM2: 250,

    // Плоттер: руб./секция 320×450 мм.
    plotterSheet: 50,
    plotterMargin: 5,

    // Квартальные календари, руб./изделие.
    quarterMiniAssembly: 50,
    quarterMidiAssembly: 60,
    quarterMaxiAssembly: 70,

    quarterMiniMagnet: 140,
    quarterMidiMagnet: 150,
    quarterMaxiMagnet: 160,

    // Дополнительные комплектующие без блоков и магнитного курсора.
    quarterHardware: 0,

    // Календарь 3 в 1: сборка.
    threeMiniAssembly: 40,
    threeMidiAssembly: 50,

    // Дополнительный запас B2, листов/приладку.
    b2ExtraSheets: 15,

    // Оценка штампа пакета.
    stampMeter: 1800, // руб./пог. м
    stampBase: 1500,

    // УФ: продажные тарифы без общей наценки.
    uvAdhesive: 800,
    uvAdhesiveWhite: 1000,
    uvAdhesiveSetup: 1000,

    uvPen: 15,
    uvPenSetup: 1000,

    uvMinute: 35,
    uvBedW: 500,
    uvBedH: 600,
    uvCycle: 15,
    uvCycleWhite: 20,
    uvLoadMinutes: 2,
    uvLoadGroup: 5,

    // УФ по времени: фиксированный лист 500×700 мм.
    uvSheetMinute: 35,
    uvSheetPrint: 7,
    uvSheetPrintWhite: 10,
    uvSheetLoading: 2,

    // УФ по площади материала, руб./м².
    uvPVC3: 1500,
    uvDesigner40: 1500,
    uvDesigner40White: 2000,
    uvDesigner44: 2500,
    uvDesigner44White: 3500,
    uvDesignerSoft: 200
  },

  // Специальные приладки.
  policy: {
    scope: "offset",

    notebook10: 3000,
    notebook40: 5000,
    notebook11: 6000,
    notebook44: 10000,

    brochure2: 16000,
    brochure3: 14000,
    brochure4: 12000
  },

  calendar: {
    mini: { w: 297, headH: 210, backingH: 210 },
    midi: { w: 335, headH: 230, backingH: 230 },
    maxi: { w: 370, headH: 250, backingH: 250 }
  },

  /*
   * Календарные блоки.
   * Цены перенесены из исходного калькулятора.
   * Актуальность прайса и наличие здесь не подтверждаются.
   * Цена комплекта НЕ умножается на три.
   */
  polimat: {
    mini: {
      economy: {
        name: "ЕВРОПА офсет арктик мини голубовато-белый 3-сп",
        price: 53.80
      },
      standard: {
        name: "ПРОИЗВОДСТВЕННЫЕ-80 мини серебристо-белый 3-сп",
        price: 66.80
      },
      premium: {
        name: "ЕВРОПА s-металлик мини серебро супер-металлик 3-сп",
        price: 86.80
      }
    },
    midi: {
      economy: {
        name: "ВЕРДАНА офсетные миди серый 3-сп",
        price: 73.80
      },
      standard: {
        name: "ЕВРОПА арктик миди серебристо-белый 3-сп",
        price: 86.80
      },
      premium: {
        name: "ЕВРОПА-100 s-металлик миди серебро супер-металлик 3-сп",
        price: 98.80
      }
    },
    maxi: {
      economy: {
        name: "ПРОИЗВОДСТВЕННЫЕ макси серебристо-белый 3-сп",
        price: 132.80
      },
      standard: {
        name: "ЕВРОПА металлик макси серебристо-белый 3-сп",
        price: 132.80
      },
      premium: {
        name: "ЕВРОПА s-металлик макси серебро супер-металлик 3-сп",
        price: 143.80
      }
    },
    threeMini: {
      name: "3 в одном мини серебристо-белый 1-сп",
      price: 40.80
    },
    threeMidi: {
      name: "3 в одном миди серебристо-белый 1-сп",
      price: 45.80
    }
  },

  // Базовые параметры нового компонента.
  component: {
    name: "Дополнительный компонент",
    enabled: true,
    role: "other",
    w: 210,
    h: 297,
    mode: "units",
    units: 1,
    pages: 32,
    color: "4+0",
    paper: "matt",
    density: 300,
    material: "paper",
    bleed: 2,
    setups: 1,
    cutting: true,
    lamination: "none",
    lamSides: 1,
    score: false,
    scoreCount: 2,
    folding: false,
    diecut: false,
    perStamp: 1,
    stamp: 5500,
    uv: false,
    emboss: false,
    plate: 2000
  },

  /*
   * БАЗОВЫЕ НАСТРОЙКИ ИЗДЕЛИЙ
   *
   * assembly — сборка одного изделия.
   * assemblySetup — настройка сборки на заказ.
   * accessories — комплектующие на одно изделие.
   * extra — прочие расходы на весь заказ.
   *
   * priceKg/priceSheet внутри компонента необязательны:
   * если их нет, используется цена из papers.
   */
  products: {
    flyer: {
      assembly: 0, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Листовка", w: 148, h: 210,
          color: "4+4", density: 130, priceKg: 135
        }
      ]
    },

    paket: {
      assembly: 40, assemblySetup: 300, accessories: 10, extra: 0,
      accessoriesNote: "Ручки и усилители",
      components: [
        {
          name: "Развёртка пакета", role: "bag",
          w: 434, h: 520, density: 200, priceKg: 135,
          lamination: "gloss", diecut: true,
          cutting: false, stamp: 0
        }
      ]
    },

    bloknot: {
      assembly: 35, assemblySetup: 0, accessories: 10, extra: 0,
      accessoriesNote: "Пружина / крепёж",
      components: [
        {
          name: "Обложка", role: "cover",
          w: 148, h: 210, lamination: "gloss"
        },
        {
          name: "Внутренний блок", role: "block",
          w: 148, h: 210, units: 50,
          paper: "offset", density: 80
        },
        {
          name: "Подложка", role: "backing",
          w: 148, h: 210, color: "none",
          paper: "cardboard", density: 350
        }
      ]
    },

    broshyura: {
      assembly: 15, assemblySetup: 300, accessories: 1, extra: 0,
      accessoriesNote: "Скобы",
      components: [
        {
          name: "Обложка", role: "cover",
          w: 148, h: 210, color: "4+4",
          lamination: "gloss", folding: true,
          score: true, scoreCount: 1
        },
        {
          name: "Внутренний блок", role: "block",
          w: 148, h: 210, mode: "pages", pages: 32,
          color: "4+4", density: 130, priceKg: 135,
          folding: true
        }
      ]
    },

    papka: {
      assembly: 8, assemblySetup: 300, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Развёртка папки", w: 450, h: 380,
          paper: "cardboard", diecut: true,
          lamination: "gloss", stamp: 0
        }
      ]
    },

    korobka: {
      assembly: 12, assemblySetup: 300, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Развёртка коробки", w: 450, h: 350,
          paper: "cardboard", diecut: true, cutting: false
        }
      ]
    },

    quarter: {
  assembly: 50,
  assemblySetup: 300,
  accessories: 0,
  extra: 0,
  accessoriesNote: "",

  components: [
    {
      name: "Топпер + нижнее рекламное поле",
      role: "header",
      w: 297,
      h: 210,
      units: 2,
      paper: "cardboard",
      density: 300,
      color: "4+0",
      lamination: "gloss",
      lamSides: 1
    },
    {
      name: "Подложки",
      role: "backing",
      w: 297,
      h: 210,
      units: 2,
      paper: "cardboard",
      density: 300,
      color: "4+0",
      lamination: "gloss",
      lamSides: 1
    }
  ]
},

    threeinone: {
      assembly: 40, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Основа календаря 3 в 1", role: "base",
          w: 297, h: 420
        }
      ]
    },

    wall: {
      assembly: 100, assemblySetup: 300, accessories: 20, extra: 0,
      accessoriesNote: "Пружина и ригель",
      components: [
        {
          name: "Обложка", role: "cover",
          w: 297, h: 420, lamination: "gloss"
        },
        {
          name: "Листы календаря", role: "block",
          w: 297, h: 420, units: 12,
          density: 200, priceKg: 135, setups: 12
        },
        {
          name: "Подложка", role: "backing",
          w: 297, h: 420, color: "none",
          paper: "cardboard", density: 350
        }
      ]
    },

    tent: {
      assembly: 35, assemblySetup: 300, accessories: 8, extra: 0,
      accessoriesNote: "Пружина",
      components: [
        {
          name: "Основание", role: "base",
          w: 210, h: 350, paper: "cardboard",
          score: true, scoreCount: 3, folding: true
        },
        {
          name: "Перекидные листы", role: "block",
          w: 210, h: 100, units: 12,
          density: 200, priceKg: 135, setups: 12
        }
      ]
    },

    diecut: {
      assembly: 0, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Вырубное изделие", w: 100, h: 100,
          diecut: true, cutting: false
        }
      ]
    },

    stickers: {
      assembly: 0, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Наклейка", w: 90, h: 50,
          paper: "adhesive", density: 80
        }
      ]
    },

    stickerpack: {
      assembly: 0, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: [
        {
          name: "Стикерпак", w: 148, h: 210,
          paper: "adhesive", density: 80, cutting: false
        }
      ]
    },

    uvprint: {
      assembly: 0, assemblySetup: 0, accessories: 0, extra: 0,
      accessoriesNote: "",
      components: []
    }
  }
};
/*
 * ОБНОВЛЕНИЕ SLONPRESS
 * Все новые изменяемые цены находятся здесь.
 */

// После изменения цен обновляйте версию и дату.
window.PRINT_PRICES.meta.version = "2026-09-19.2";
window.PRINT_PRICES.meta.updated = "2026-09-19";
window.PRINT_PRICES.meta.source = "Тарифы SlonPress.ru";

// На цифровой печати нет отдельной платы за приладку печати.
window.PRINT_PRICES.rates.digitalSetup = 0;
window.PRINT_PRICES.rates.b2Setup = 0;

// Специальные приладки брошюр и блокнотов — только для офсета.
window.PRINT_PRICES.policy.scope = "offset";

Object.assign(window.PRINT_PRICES.extra, {
  /*
   * Плоттер для листовок.
   * Оплата по физическим секциям 320×450 мм.
   * Минимальная сумма применяется один раз на весь заказ.
   */
  flyerPlotterSheet: 150,
  flyerPlotterMinimum: 1500,

  /*
   * Покупной календарный блок Полимат.
   * Цена одного готового покупного блока на один календарь.
   * Не умножается на количество страниц внутри блока.
   */
  tentPolimatBlock: 25,

  // Размер покупного блока, мм.
  tentPolimatW: 205,
  tentPolimatH: 95
});

// Возможность плоттерной резки у компонента листовок.
window.PRINT_PRICES.component.plotter = false;

// Отдельная верхняя обложка для домика с покупным блоком.
if (
  !window.PRINT_PRICES.products.tent.components.some(
    component => component.role === "cover"
  )
) {
  window.PRINT_PRICES.products.tent.components.push({
    name: "Верхняя обложка",
    role: "cover",
    enabled: false,

    w: 205,
    h: 95,

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
  });
}

/*
 * Тарифы материалов и ограничения оборудования.
 * Идентификаторы листов:
 * Z — SRA3 320×450;
 * B — офсет 470×620;
 * A — офсет 500×700.
 */

window.PRINT_PRICES.meta.version = "2026-09-21.1";
window.PRINT_PRICES.meta.updated = "2026-09-21";

Object.assign(window.PRINT_PRICES.papers.offset, {
  density: 80,
  densities: [80, 100, 120, 160, 190],
  priceMode: "kg",
  priceKg: 125
});

Object.assign(window.PRINT_PRICES.papers.cardboard, {
  density: 300,
  densities: [215, 230, 250, 270, 300, 325],
  priceMode: "kg",
  priceKg: 140
});

Object.assign(window.PRINT_PRICES.papers.designer, {
  density: 300,
  densities: [300],
  priceMode: "sheet",
  priceSheet: 75,
  allowedSheets: ["Z"],
  sheetPrices: {
    Z: 75
  }
});

// Пока одинаковый тариф для бумажной самоклейки и плёнки.
for (const paperId of ["adhesive", "adhesiveFilm"]) {
  Object.assign(window.PRINT_PRICES.papers[paperId], {
    density: 80,
    densities: [80],
    priceMode: "sheet",
    priceSheet: 20,
    allowedSheets: ["Z", "B", "A"],
    sheetPrices: {
      Z: 20,
      B: 22,
      A: 25
    }
  });
}

/*
 * Приводим стартовые настройки изделий к новому справочнику.
 * В частности, прежняя подложка из картона 350 г/м²
 * заменяется на 300 г/м².
 * Сохранённые в браузере документы не изменяются.
 */
for (const productSettings of Object.values(
  window.PRINT_PRICES.products
)) {
  for (const spec of productSettings.components) {
    const paperId =
      spec.paper || window.PRINT_PRICES.component.paper;

    const paper = window.PRINT_PRICES.papers[paperId];

    if (!paper?.densities) continue;

    if (
      spec.density !== undefined &&
      !paper.densities.includes(spec.density)
    ) {
      spec.density = paper.density;
    }

    spec.priceMode = paper.priceMode;

    if (paper.priceMode === "kg") {
      spec.priceKg = paper.priceKg;
    } else {
      spec.priceSheet = paper.priceSheet;
    }
  }
}

/*
 * ПЛАВНАЯ ШКАЛА НАЦЕНКИ
 *
 * cost — себестоимость всего заказа, руб.
 * percent — наценка на себестоимость в этой точке, %.
 *
 * Между точками линейно изменяется сумма прибыли.
 * До первой точки применяется процент первой точки.
 * После последней точки применяется процент последней точки.
 *
 * УФ-печать использует готовые продажные тарифы:
 * эта шкала к ней не применяется.
 */

window.PRINT_PRICES.markupScale = [
  { cost: 1000,  percent: 80 },
  { cost: 2000,  percent: 45 },
  { cost: 3000,  percent: 40 },
  { cost: 4000,  percent: 37 },
  { cost: 5000,  percent: 35 },
  { cost: 6000,  percent: 33 },
  { cost: 7000,  percent: 31 },
  { cost: 8000,  percent: 30 },
  { cost: 9000,  percent: 28 },
  { cost: 10000, percent: 27 },
  { cost: 11000, percent: 26 },
  { cost: 15000, percent: 24 },
  { cost: 21000, percent: 22 },
  { cost: 30000, percent: 20 },
  { cost: 40000, percent: 18 },
  { cost: 50000, percent: 17 },
  { cost: 60000, percent: 16 },
  { cost: 70000, percent: 15 }
];

// Округление продажной цены вверх до одного рубля.
window.PRINT_PRICES.rates.rounding = 1;

// Версия справочника с новой шкалой.
window.PRINT_PRICES.meta.version = "2026-09-22.1";
window.PRINT_PRICES.meta.updated = "2026-09-22";
