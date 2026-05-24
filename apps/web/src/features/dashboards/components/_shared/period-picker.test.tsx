import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodPicker } from "./period-picker";

describe("PeriodPicker", () => {
  it("renders the label of the current period collapsed", () => {
    render(<PeriodPicker value="mtd" onChange={() => {}} />);
    expect(screen.getByText("Mes en curso")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens the listbox on click and shows all options", () => {
    render(<PeriodPicker value="mtd" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /seleccionar período/i }));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeTruthy();
    expect(screen.getByRole("option", { name: /último mes/i })).toBeTruthy();
    expect(screen.getByRole("option", { name: /trimestre/i })).toBeTruthy();
    expect(screen.getByRole("option", { name: /año en curso/i })).toBeTruthy();
  });

  it("calls onChange with the selected value and closes the listbox", () => {
    const onChange = vi.fn();
    render(<PeriodPicker value="mtd" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /seleccionar período/i }));
    fireEvent.click(screen.getByRole("option", { name: /último mes/i }));
    expect(onChange).toHaveBeenCalledWith("last-month");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("ignores clicks on the disabled custom option", () => {
    const onChange = vi.fn();
    render(<PeriodPicker value="mtd" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /seleccionar período/i }));
    const customOption = screen.getByRole("option", { name: /rango personalizado/i });
    expect(customOption.hasAttribute("disabled")).toBe(true);
    fireEvent.click(customOption);
    expect(onChange).not.toHaveBeenCalled();
  });
});
