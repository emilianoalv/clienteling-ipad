import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { FilterBar } from "./filter-bar";

const push = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/gerente",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

describe("FilterBar", () => {
  beforeEach(() => {
    push.mockReset();
    currentSearch = "";
  });
  afterEach(() => {
    currentSearch = "";
  });

  it("renders only the controls enabled in roleConfig (BA case)", () => {
    render(
      <FilterBar
        roleConfig={{ period: true, store: false, brand: false, baId: false }}
      />,
    );
    expect(screen.getByRole("button", { name: /seleccionar período/i })).toBeTruthy();
    expect(screen.queryByLabelText(/^tienda$/i)).toBeNull();
    expect(screen.queryByLabelText(/^marca$/i)).toBeNull();
    expect(screen.queryByLabelText(/^ba$/i)).toBeNull();
  });

  it("renders brand + BA controls for Gerente roleConfig", () => {
    render(
      <FilterBar
        roleConfig={{ period: true, store: false, brand: true, baId: true }}
        scopeOptions={{
          bas: [
            { id: "u-vale" as unknown as StaffId, label: "Valentina R." },
          ],
        }}
      />,
    );
    expect(screen.getByLabelText("Marca")).toBeTruthy();
    expect(screen.getByLabelText("BA")).toBeTruthy();
  });

  it("pushes the updated searchParams when a brand is picked", () => {
    render(
      <FilterBar
        roleConfig={{ period: false, store: false, brand: true, baId: false }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Marca"), {
      target: { value: "Lancôme" },
    });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0]?.[0]).toContain("brand=Lanc");
  });

  it("strips the param from the URL when value is reset to empty", () => {
    currentSearch = "brand=YSL";
    render(
      <FilterBar
        roleConfig={{ period: false, store: false, brand: true, baId: false }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Marca"), {
      target: { value: "" },
    });
    expect(push).toHaveBeenCalledTimes(1);
    // Empty value should remove `brand` from the URL entirely.
    expect(push.mock.calls[0]?.[0]).not.toContain("brand=");
  });

  it("renders the store select with provided scope options", () => {
    render(
      <FilterBar
        roleConfig={{ period: false, store: true, brand: false, baId: false }}
        scopeOptions={{
          stores: [
            { id: "st-001" as unknown as StoreId, label: "Polanco" },
            { id: "st-002" as unknown as StoreId, label: "Santa Fe" },
          ],
        }}
      />,
    );
    const select = screen.getByLabelText("Tienda") as HTMLSelectElement;
    expect(select.options.length).toBe(3); // "todas" + 2 stores
    expect(select.options[1]?.textContent).toBe("Polanco");
  });
});
