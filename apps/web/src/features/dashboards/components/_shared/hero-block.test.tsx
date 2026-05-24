import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroBlock } from "./hero-block";

describe("HeroBlock", () => {
  it("renders the main slot and all three side cards", () => {
    render(
      <HeroBlock
        main={<div>main-card</div>}
        side={[
          <div key="a">side-a</div>,
          <div key="b">side-b</div>,
          <div key="c">side-c</div>,
        ]}
      />,
    );
    expect(screen.getByText("main-card")).toBeTruthy();
    expect(screen.getByText("side-a")).toBeTruthy();
    expect(screen.getByText("side-b")).toBeTruthy();
    expect(screen.getByText("side-c")).toBeTruthy();
  });

  it("uses a 60/40 grid on desktop (md breakpoint)", () => {
    const { container } = render(
      <HeroBlock
        main={<div>m</div>}
        side={[<div key="a">a</div>, <div key="b">b</div>, <div key="c">c</div>]}
      />,
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("md:grid-cols-[3fr_2fr]");
  });
});
