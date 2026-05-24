import { describe, expect, it } from "vitest";
import type { Interaction, InteractionId, InteractionKind } from "@/types/interaction";
import type { ClientId } from "@/types/client";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { User, UserId } from "@/types/user";
import { computeAdoptionData } from "./adoption-tracker";

const ST_POL = "st-pol" as unknown as StoreId;
const ST_SF = "st-sf" as unknown as StoreId;

const user = (overrides: Partial<User>): User => ({
  id: "u" as unknown as UserId,
  name: "User",
  role: "BA",
  ...overrides,
});

const interaction = (baId: string): Interaction => ({
  id: ("i-" + baId) as unknown as InteractionId,
  clientId: "c-1" as unknown as ClientId,
  baId: baId as unknown as StaffId,
  storeId: ST_POL,
  brand: "Lancôme" as BrandId,
  kind: "consultation" as InteractionKind,
  at: new Date().toISOString(),
});

describe("computeAdoptionData", () => {
  it("computes byRole percentages from active user ids in interactions", () => {
    const users: User[] = [
      user({ id: "u-1" as unknown as UserId, role: "BA", storeId: ST_POL }),
      user({ id: "u-2" as unknown as UserId, role: "BA", storeId: ST_POL }),
      user({ id: "u-3" as unknown as UserId, role: "Gerente", storeId: ST_POL }),
    ];
    const recents = [interaction("u-1"), interaction("u-3")];
    const out = computeAdoptionData(
      users,
      recents,
      new Map([[ST_POL, "Polanco"]]),
    );

    const ba = out.byRole.find((r) => r.role === "BA");
    expect(ba?.activeCount).toBe(1);
    expect(ba?.totalCount).toBe(2);
    expect(ba?.percent).toBe(50);

    const gte = out.byRole.find((r) => r.role === "Gerente");
    expect(gte?.percent).toBe(100);
  });

  it("groups by store and resolves store names from the lookup", () => {
    const users: User[] = [
      user({ id: "u-1" as unknown as UserId, role: "BA", storeId: ST_POL }),
      user({ id: "u-2" as unknown as UserId, role: "BA", storeId: ST_POL }),
      user({ id: "u-3" as unknown as UserId, role: "BA", storeId: ST_SF }),
    ];
    const recents = [interaction("u-1")];
    const out = computeAdoptionData(
      users,
      recents,
      new Map([
        [ST_POL, "Polanco"],
        [ST_SF, "Santa Fe"],
      ]),
    );
    const pol = out.byStore.find((s) => s.storeId === ST_POL);
    expect(pol?.storeName).toBe("Polanco");
    expect(pol?.activeCount).toBe(1);
    expect(pol?.totalCount).toBe(2);
    expect(pol?.percent).toBe(50);
  });

  it("returns empty arrays when there are no users", () => {
    const out = computeAdoptionData([], [], new Map());
    expect(out.byRole).toEqual([]);
    expect(out.byStore).toEqual([]);
  });
});
