import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversionBar } from "./conversion-bar";

describe("ConversionBar", () => {
  it("renders the label, value % and counter % with positive delta tone", () => {
    render(<ConversionBar label="Reco → compra" value={32} counterValue={24} />);
    expect(screen.getByText("Reco → compra")).toBeTruthy();
    expect(screen.getByText("32%")).toBeTruthy();
    expect(screen.getByText(/vs counter 24% \(\+8pp\)/)).toBeTruthy();
  });

  it("flags negative deltas with the danger tone class", () => {
    const { container } = render(
      <ConversionBar label="Sample → compra" value={18} counterValue={22} />,
    );
    const deltaText = container.querySelector("span.text-err");
    expect(deltaText).toBeTruthy();
  });

  it("clamps the visual bar width when value > 100", () => {
    const { container } = render(
      <ConversionBar label="X" value={150} counterValue={50} />,
    );
    const bar = container.querySelector("div.bg-ink") as HTMLDivElement | null;
    expect(bar?.style.width).toBe("100%");
  });
});
