/**
 * Overview component tests
 *
 * Test stack:
 * - Jest as the test runner/assertion framework
 * - React Testing Library (@testing-library/react) for rendering and queries
 * - @testing-library/jest-dom for extended matchers (loaded conditionally)
 *
 * Focus: Validate the public render interface of the Overview component per the PR diff:
 * - Renders SectionHeader with title "Conference Overview"
 * - Renders three specific descriptive paragraphs
 * - Ensures Tailwind utility classes on key wrappers
 * - Confirms unused CHAIRS constant does not leak UI (no chair names/images rendered)
 * - Provides a snapshot for structural regressions
 */

/* eslint-disable import/no-dynamic-require, global-require */
try {
  // Optional: enhance Jest with DOM matchers if available; do not hard-require
  require("@testing-library/jest-dom");
} catch (_) {
  // silently continue if the repo doesn't include jest-dom
}

const React = require("react");
const { render, screen } = require("@testing-library/react");

/**
 * Attempt to load the Overview component from several common locations.
 * Adjust here if your repository uses a different path/alias.
 */
let Overview;
function loadOverview() {
  if (Overview) return Overview;
  const attempts = [
    () => require("src/components/home/Overview").default,
    () => require("components/home/Overview").default,
    () => require("../../../../components/home/Overview").default,
    () => require("../../../../src/components/home/Overview").default,
  ];
  let lastErr;
  for (const attempt of attempts) {
    try {
      Overview = attempt();
      return Overview;
    } catch (e) {
      lastErr = e;
    }
  }
  // If we get here, we couldn't resolve the component path; surface a helpful error.
  // Update the attempts above to match your repo's structure.
  throw lastErr || new Error("Unable to resolve components/home/Overview. Adjust import path in test.");
}

describe("Overview component", () => {
  beforeAll(() => {
    loadOverview();
  });

  const renderOverview = () => render(React.createElement(Overview));

  test("renders without crashing", () => {
    expect(() => renderOverview()).not.toThrow();
  });

  test("renders top-level section with expected Tailwind classes", () => {
    const { container } = renderOverview();
    const sectionEl = container.querySelector("section");
    expect(sectionEl).toBeTruthy();
    // key classes from the diff
    expect(sectionEl).toHaveClass("bg-white");
    expect(sectionEl).toHaveClass("py-12");
  });

  test('renders the "Conference Overview" heading via SectionHeader', () => {
    renderOverview();
    // We assert on visible text, agnostic of the exact heading element/tag
    expect(screen.getByText("Conference Overview")).toBeInTheDocument();
  });

  test("renders exactly three descriptive paragraphs with expected content highlights", () => {
    const { container } = renderOverview();
    const textWrapper = container.querySelector("div.text-black.text-lg.text-justify.space-y-4");
    expect(textWrapper).toBeTruthy();

    const paragraphs = textWrapper.querySelectorAll("p");
    expect(paragraphs.length).toBe(3);

    // Paragraph presence checks (distinctive phrases from the diff)
    expect(
      screen.getByText(/International Conference on Technological Advances in AI and it's Applications/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/platform for the exchange of knowledge.*innovative ideas/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/spark intellectual curiosity.*sustainable progress/i)
    ).toBeInTheDocument();
  });

  test("does not render unused chair names or images from the CHAIRS constant", () => {
    const { container } = renderOverview();
    // Names defined in CHAIRS should not appear since they aren't rendered
    expect(screen.queryByText(/DR HAITHAM ALQAHTANI/i)).toBeNull();
    expect(screen.queryByText(/DR SHABANA FAIZAL/i)).toBeNull();

    // No <img> tags should be present in the Overview as per the diff
    expect(container.querySelectorAll("img").length).toBe(0);
  });

  test("content container structure is present (container and nested text wrapper)", () => {
    const { container } = renderOverview();
    const sectionEl = container.querySelector("section");
    const containerDiv = sectionEl && sectionEl.querySelector("div.container.mx-auto.px-4");
    expect(containerDiv).toBeTruthy();

    const textDiv = containerDiv && containerDiv.querySelector("div.text-black.text-lg.text-justify.space-y-4");
    expect(textDiv).toBeTruthy();
  });

  test("matches snapshot", () => {
    const { container } = renderOverview();
    expect(container.firstChild).toMatchSnapshot();
  });
});