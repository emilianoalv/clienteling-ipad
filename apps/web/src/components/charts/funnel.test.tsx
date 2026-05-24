import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Funnel } from "./funnel";

describe("Funnel", () => {
  it("renders stage labels and counts", () => {
    render(
      <Funnel
        stages={[
          { label: "Interacciones", count: 500 },
          { label: "Recomendaciones", count: 200 },
          { label: "Compras", count: 80 },
        ]}
      />,
    );
    expect(screen.getByText("Interacciones")).toBeTruthy();
    expect(screen.getByText("500")).toBeTruthy();
    expect(screen.getByText("Compras")).toBeTruthy();
    expect(screen.getByText("80")).toBeTruthy();
  });

  it("computes inter-stage conversion percentages", () => {
    render(
      <Funnel
        stages={[
          { label: "A", count: 200 },
          { label: "B", count: 50 },
        ]}
      />,
    );
    expect(screen.getByText(/25% pasan a la siguiente etapa/)).toBeTruthy();
  });

  it("hides conversion text when showConversion is false", () => {
    render(
      <Funnel
        showConversion={false}
        stages={[
          { label: "A", count: 100 },
          { label: "B", count: 50 },
        ]}
      />,
    );
    expect(screen.queryByText(/pasan a la siguiente/)).toBeNull();
  });

  it("returns null for empty stages array", () => {
    const { container } = render(<Funnel stages={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
