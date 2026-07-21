import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Open</Badge>);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("applies the outline variant's classes", () => {
    render(<Badge variant="outline">Draft</Badge>);
    expect(screen.getByText("Draft")).toHaveClass("border-border");
  });

  it("applies the success variant's classes", () => {
    render(<Badge variant="success">Paid</Badge>);
    expect(screen.getByText("Paid")).toHaveClass("text-success");
  });
});
