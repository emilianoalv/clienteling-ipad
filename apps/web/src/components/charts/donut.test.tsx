import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Donut } from "./donut";

describe("Donut", () => {
  it("renders the legend with one row per segment + computed %", () => {
    render(
      <Donut
        segments={[
          { label: "Skincare", value: 45, color: "#000" },
          { label: "Makeup", value: 30, color: "#111" },
          { label: "Fragrance", value: 25, color: "#222" },
        ]}
      />,
    );
    expect(screen.getByText("Skincare")).toBeTruthy();
    expect(screen.getByText("Makeup")).toBeTruthy();
    expect(screen.getByText("Fragrance")).toBeTruthy();
    expect(screen.getByText("45%")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
  });

  it("renders the center label when provided", () => {
    render(
      <Donut
        segments={[{ label: "A", value: 1, color: "#000" }]}
        centerLabel="$486K"
        centerSub="período"
      />,
    );
    expect(screen.getByText("$486K")).toBeTruthy();
    expect(screen.getByText("período")).toBeTruthy();
  });

  it("falls back to 0% labels when total is 0", () => {
    render(<Donut segments={[{ label: "Nada", value: 0, color: "#000" }]} />);
    expect(screen.getByText("0%")).toBeTruthy();
  });
});
