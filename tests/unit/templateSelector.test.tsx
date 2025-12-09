import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TemplateSelector } from "@/components/TemplateSelector";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: undefined,
    isLoading: false,
    error: new Error("Boom"),
  }),
}));

describe("TemplateSelector", () => {
  test("displays error state when query fails", () => {
    render(<TemplateSelector onSelect={() => {}} />);

    expect(screen.getByText(/Error loading templates/i)).toBeInTheDocument();
    expect(screen.getByText(/Boom/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});

