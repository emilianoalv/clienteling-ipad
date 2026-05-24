import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertBanner } from "./alert-banner";

const SAMPLE = [
  { severity: "critical" as const, title: "Diego al 58% objetivo" },
  { severity: "critical" as const, title: "Consent VIP expira" },
  { severity: "warning" as const, title: "Conv baja LCM" },
  { severity: "info" as const, title: "iPad sin sync" },
];

describe("AlertBanner", () => {
  it("renders nothing when there are no alerts", () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("starts collapsed, showing severity counts only", () => {
    render(<AlertBanner alerts={SAMPLE} />);
    expect(screen.getByText("2")).toBeTruthy(); // 2 críticas
    expect(screen.getByText(/críticas/i)).toBeTruthy();
    expect(screen.queryByText("Diego al 58% objetivo")).toBeNull();
  });

  it("expands the list when the toggle is clicked", () => {
    render(<AlertBanner alerts={SAMPLE} />);
    fireEvent.click(screen.getByRole("button", { name: /ver todo/i }));
    expect(screen.getByText("Diego al 58% objetivo")).toBeTruthy();
    expect(screen.getByText("Conv baja LCM")).toBeTruthy();
    expect(screen.getByText("iPad sin sync")).toBeTruthy();
  });

  it("respects initialExpanded=true", () => {
    render(<AlertBanner alerts={SAMPLE} initialExpanded />);
    expect(screen.getByText("Diego al 58% objetivo")).toBeTruthy();
  });
});
