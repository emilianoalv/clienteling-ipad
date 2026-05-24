import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertBadge } from "./alert-badge";

describe("AlertBadge", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<AlertBadge count={0} severity="warning" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders count + plural copy for >1", () => {
    render(<AlertBadge count={3} severity="critical" />);
    expect(screen.getByText(/3 alertas/i)).toBeTruthy();
  });

  it("uses singular copy for count=1", () => {
    render(<AlertBadge count={1} severity="warning" />);
    expect(screen.getByText(/1 alerta$/i)).toBeTruthy();
  });

  it("applies the severity dot color", () => {
    const { container } = render(<AlertBadge count={2} severity="critical" />);
    const dot = container.querySelector("span > span[aria-hidden]");
    expect(dot?.className).toContain("bg-err");
  });
});
