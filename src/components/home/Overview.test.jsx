/* @jest-environment jsdom */
/**
 * Unit tests for Overview component.
 * Framework: Jest + React Testing Library
 */
import React from "react";
jest.mock("../common/SectionHeader", () => {
  const React = require("react");
  const mock = jest.fn(({ title }) => <h2 data-testid="section-header">{title}</h2>);
  return { __esModule: true, default: mock };
});

import { render, screen } from "@testing-library/react";
import Overview from "./Overview";
import SectionHeaderMock from "../common/SectionHeader";

describe("Overview component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders SectionHeader with the correct title", () => {
    render(<Overview />);
    const header = screen.getByTestId("section-header");
    expect(header).toBeTruthy();
    expect(header.textContent).toBe("Conference Overview");
    expect(SectionHeaderMock).toHaveBeenCalledTimes(1);
    // First arg to the mock is props object
    expect(SectionHeaderMock.mock.calls[0][0].title).toBe("Conference Overview");
  });

  it("renders three descriptive paragraphs with expected key phrases", () => {
    render(<Overview />);
    const paras = document.querySelectorAll("p");
    expect(paras.length).toBe(3);

    // Key phrases from each paragraph (use partials for robustness)
    expect(screen.getByText(/International Conference on Technological Advances in AI/i)).toBeTruthy();
    expect(screen.getByText(/scholars, practitioners, and industry leaders/i)).toBeTruthy();
    expect(screen.getByText(/spark intellectual curiosity/i)).toBeTruthy();
  });

  it("does not render chair names from the unused CHAIRS constant", () => {
    render(<Overview />);
    expect(screen.queryByText(/DR HAITHAM ALQAHTANI/i)).toBeNull();
    expect(screen.queryByText(/DR SHABANA FAIZAL/i)).toBeNull();
  });

  it("applies expected Tailwind classes to layout containers", () => {
    const { container } = render(<Overview />);
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    if (section) {
      const s = section.className || "";
      expect(s.includes("bg-white")).toBe(true);
      expect(s.includes("py-12")).toBe(true);
    }

    const firstDiv = section ? section.querySelector("div") : null;
    expect(firstDiv).not.toBeNull();
    if (firstDiv) {
      const c = firstDiv.className || "";
      expect(c.includes("container")).toBe(true);
      expect(c.includes("mx-auto")).toBe(true);
      expect(c.includes("px-4")).toBe(true);
    }

    // Text wrapper exact class combo (as authored)
    const textWrapper = container.querySelector("div.text-black.text-lg.text-justify.space-y-4");
    expect(textWrapper).not.toBeNull();
  });
});