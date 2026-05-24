import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertCard } from "./alert-card";

describe("AlertCard", () => {
  it("renders title and description with role=alert", () => {
    render(
      <AlertCard
        severity="critical"
        title="Consent expira en 3 días"
        description="Andrea Constanza López"
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Consent expira en 3 días")).toBeTruthy();
    expect(screen.getByText("Andrea Constanza López")).toBeTruthy();
  });

  it("renders an action link with the provided href", () => {
    render(
      <AlertCard
        severity="warning"
        title="Diego F. al 58% de objetivo"
        action={{ label: "Ver BA", href: "/gerente?baId=diego" }}
      />,
    );
    const link = screen.getByRole("link", { name: /ver ba/i });
    expect(link.getAttribute("href")).toBe("/gerente?baId=diego");
  });

  it("uses the warning border color for severity=warning", () => {
    const { container } = render(
      <AlertCard severity="warning" title="Atención" />,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("border-l-warn");
  });

  it("uses the critical border color for severity=critical", () => {
    const { container } = render(
      <AlertCard severity="critical" title="Urgente" />,
    );
    expect(container.querySelector("article")?.className).toContain("border-l-err");
  });

  it("includes an accessible severity prefix in the title", () => {
    render(<AlertCard severity="info" title="Recordatorio" />);
    expect(screen.getByText(/informativa:/i)).toBeTruthy();
  });
});
