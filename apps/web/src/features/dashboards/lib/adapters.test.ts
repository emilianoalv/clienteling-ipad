import { describe, expect, it } from "vitest";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { BaRankingEntry } from "../server/queries/get-ba-ranking";
import type { SalesByBrandResult } from "../server/queries/get-sales-by-brand";
import type { SparklineBucket } from "../server/queries/get-sparkline-data";
import type { StoreRankingEntry } from "../server/queries/get-store-ranking";
import {
  toBaRankCards,
  toBaRankingBarData,
  toMultiSeriesLineData,
  toSparklinePoints,
  toSplitBarData,
  toStoreRankCards,
} from "./adapters";

const storeId = (s: string): StoreId => s as unknown as StoreId;
const staffId = (s: string): StaffId => s as unknown as StaffId;

describe("toSparklinePoints", () => {
  it("extracts values in order, dropping the date axis", () => {
    const data: SparklineBucket[] = [
      { date: new Date(2026, 3, 1), value: 100 },
      { date: new Date(2026, 3, 2), value: 250 },
      { date: new Date(2026, 3, 3), value: 0 },
    ];
    expect(toSparklinePoints(data)).toEqual([100, 250, 0]);
  });

  it("returns [] for empty input", () => {
    expect(toSparklinePoints([])).toEqual([]);
  });
});

describe("toStoreRankCards", () => {
  const POLANCO = storeId("st-001");
  const SANTAFE = storeId("st-002");
  const baseEntry = (overrides: Partial<StoreRankingEntry>): StoreRankingEntry => ({
    storeId: POLANCO,
    storeName: "Liverpool Polanco",
    franchiseName: "Liverpool",
    salesAmount: 1_900_000,
    transactionsCount: 0,
    activeBas: 0,
    activeClients: 0,
    rank: 1,
    ...overrides,
  });

  it("maps to RankItem with name lookup + compact currency", () => {
    const stores = new Map<StoreId, string>([
      [POLANCO, "Polanco"],
      [SANTAFE, "Santa Fe"],
    ]);
    const items = toStoreRankCards(
      [
        baseEntry({ storeId: POLANCO, salesAmount: 1_900_000, rank: 1 }),
        baseEntry({
          storeId: SANTAFE,
          storeName: "Palacio Santa Fe",
          franchiseName: "Palacio",
          salesAmount: 1_300_000,
          rank: 2,
        }),
      ],
      stores,
    );
    expect(items).toEqual([
      { label: "Polanco", value: "$1.9M" },
      { label: "Santa Fe", value: "$1.3M" },
    ]);
  });

  it("falls back to entry storeName if not in map", () => {
    const items = toStoreRankCards(
      [baseEntry({ storeId: POLANCO, salesAmount: 4567 })],
      new Map(),
    );
    expect(items[0]).toEqual({ label: "Liverpool Polanco", value: "$5K" });
  });

  it("returns [] for empty input", () => {
    expect(toStoreRankCards([], new Map())).toEqual([]);
  });
});

describe("toSplitBarData", () => {
  it("flattens brand stats into LCM / YSL / total", () => {
    const data: SalesByBrandResult = {
      Lancome: {
        salesAmount: 990_000,
        transactionsCount: 0,
        averageTicket: 0,
        reco2PurchaseRate: 0,
        activeClients: 0,
        topProducts: [],
      },
      YSL: {
        salesAmount: 810_000,
        transactionsCount: 0,
        averageTicket: 0,
        reco2PurchaseRate: 0,
        activeClients: 0,
        topProducts: [],
      },
    };
    expect(toSplitBarData(data)).toEqual({
      lancome: 990_000,
      ysl: 810_000,
      total: 1_800_000,
    });
  });

  it("handles zero-zero", () => {
    const zero = {
      salesAmount: 0,
      transactionsCount: 0,
      averageTicket: 0,
      reco2PurchaseRate: 0,
      activeClients: 0,
      topProducts: [],
    };
    expect(toSplitBarData({ Lancome: zero, YSL: zero })).toEqual({
      lancome: 0,
      ysl: 0,
      total: 0,
    });
  });
});

describe("toBaRankingBarData", () => {
  const ME = staffId("u-me");
  const PEER_A = staffId("u-vale");
  const PEER_B = staffId("u-sofi");

  const baseBa = (overrides: Partial<BaRankingEntry>): BaRankingEntry => ({
    baId: ME,
    name: "Yo",
    storeId: storeId("st-001"),
    storeName: "Polanco",
    brand: "Lancôme",
    salesAmount: 0,
    transactionsCount: 0,
    conversionRate: 0,
    rank: 1,
    ...overrides,
  });

  it('labels the current BA as "Tú" and reports highlightIndex', () => {
    const names = new Map<StaffId, string>([
      [PEER_A, "Valentina R."],
      [PEER_B, "Sofía C."],
      [ME, "Diego F."],
    ]);
    const result = toBaRankingBarData(
      [
        baseBa({ baId: PEER_A, name: "Valentina R.", salesAmount: 486_000 }),
        baseBa({ baId: ME, name: "Diego F.", salesAmount: 412_000 }),
        baseBa({ baId: PEER_B, name: "Sofía C.", salesAmount: 312_000 }),
      ],
      ME,
      names,
    );
    expect(result.labels).toEqual(["Valentina R.", "Tú", "Sofía C."]);
    expect(result.values).toEqual([486_000, 412_000, 312_000]);
    expect(result.highlightIndex).toBe(1);
  });

  it("returns highlightIndex = -1 when current BA absent (e.g. Gerente view)", () => {
    const names = new Map<StaffId, string>([[PEER_A, "Valentina R."]]);
    const result = toBaRankingBarData(
      [baseBa({ baId: PEER_A, name: "Valentina R.", salesAmount: 486_000 })],
      ME,
      names,
    );
    expect(result.highlightIndex).toBe(-1);
    expect(result.labels).toEqual(["Valentina R."]);
  });

  it("handles empty input", () => {
    const result = toBaRankingBarData([], ME, new Map());
    expect(result).toEqual({ labels: [], values: [], highlightIndex: -1 });
  });
});

describe("toBaRankCards", () => {
  const ME = staffId("u-me");
  const PEER = staffId("u-vale");

  const baseBa = (overrides: Partial<BaRankingEntry>): BaRankingEntry => ({
    baId: ME,
    name: "Yo",
    storeId: storeId("st-001"),
    storeName: "Polanco",
    brand: "Lancôme",
    salesAmount: 0,
    transactionsCount: 0,
    conversionRate: 0,
    rank: 1,
    ...overrides,
  });

  it('marks current BA with isMe=true and label "Tú"', () => {
    const names = new Map<StaffId, string>([
      [PEER, "Valentina R."],
      [ME, "Diego F."],
    ]);
    const items = toBaRankCards(
      [
        baseBa({ baId: PEER, name: "Valentina R.", salesAmount: 486_000 }),
        baseBa({ baId: ME, name: "Diego F.", salesAmount: 412_000 }),
      ],
      ME,
      names,
    );
    expect(items).toEqual([
      { label: "Valentina R.", value: "$486K", isMe: false },
      { label: "Tú", value: "$412K", isMe: true },
    ]);
  });

  it("returns [] for empty input", () => {
    expect(toBaRankCards([], ME, new Map())).toEqual([]);
  });
});

describe("toMultiSeriesLineData", () => {
  it("preserves labels from first series and flattens values per series", () => {
    const dateA = new Date(2026, 3, 1);
    const dateB = new Date(2026, 3, 8);
    const result = toMultiSeriesLineData([
      {
        label: "Zona",
        data: [
          { date: dateA, value: 200 },
          { date: dateB, value: 250 },
        ],
      },
      {
        label: "Polanco",
        data: [
          { date: dateA, value: 120 },
          { date: dateB, value: 160 },
        ],
      },
    ]);
    expect(result.labels).toEqual([dateA.toISOString(), dateB.toISOString()]);
    expect(result.series).toEqual([
      { label: "Zona", values: [200, 250] },
      { label: "Polanco", values: [120, 160] },
    ]);
  });

  it("returns empty labels/series for empty input", () => {
    expect(toMultiSeriesLineData([])).toEqual({ labels: [], series: [] });
  });
});
