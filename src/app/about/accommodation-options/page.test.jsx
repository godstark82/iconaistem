import React from "react";
import { render, screen, within } from "@testing-library/react";

/**
 * NOTE ON FRAMEWORK:
 * These tests assume Jest + React Testing Library.
 * If your project uses Vitest, replace 'jest.mock' with 'vi.mock' and ensure test setup imports '@testing-library/jest-dom'.
 */

// Mock AboutHeader to avoid coupling to its implementation.
jest.mock("../../../components/common/AboutHeader", () => {
  // eslint-disable-next-line react/display-name
  return (props) => (
    <div data-testid="about-header-mock">
      <span data-testid="about-header-title">{props?.title}</span>
      <span data-testid="about-header-date">{props?.date}</span>
      <span data-testid="about-header-image">{props?.image}</span>
      <span data-testid="about-header-overlay">{props?.overlayColor}</span>
      <span data-testid="about-header-bg">{props?.bgImage}</span>
      <span data-testid="about-header-divider">{props?.dividerColor}</span>
    </div>
  );
});

// Try to import the page regardless of .jsx/.tsx/.js extension.
let AccommodationOptionsPage;
try {
  // eslint-disable-next-line global-require
  AccommodationOptionsPage = require("./page.jsx").default;
} catch (e1) {
  try {
    AccommodationOptionsPage = require("./page.tsx").default;
  } catch (e2) {
    try {
      AccommodationOptionsPage = require("./page.js").default;
    } catch (e3) {
      // Fallback: attempt to import from provided snippet path (in case of mismatch)
      AccommodationOptionsPage = require("./page").default;
    }
  }
}

describe("AccommodationOptionsPage", () => {
  it("renders AboutHeader with expected props", () => {
    render(<AccommodationOptionsPage />);
    const header = screen.getByTestId("about-header-mock");
    expect(header).toBeInTheDocument();

    expect(screen.getByTestId("about-header-title")).toHaveTextContent("Accommodation Options");
    expect(screen.getByTestId("about-header-date")).toHaveTextContent("September 5-7, 2025");
    expect(screen.getByTestId("about-header-image")).toHaveTextContent("/images/simdte-white-lg.png");
    expect(screen.getByTestId("about-header-overlay")).toHaveTextContent("#1a1a2e");
    expect(screen.getByTestId("about-header-bg")).toHaveTextContent("/images/utb-images/gallery/gallery-2.jpg");
    expect(screen.getByTestId("about-header-divider")).toHaveTextContent("primary");
  });

  it("includes introductory copy and bullet list describing hotel options", () => {
    render(<AccommodationOptionsPage />);

    // Headline copy snippets
    expect(
      screen.getByText(/We are pleased to offer our accommodation options/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To ensure a comfortable and convenient stay/i)
    ).toBeInTheDocument();

    // Bulleted list items
    expect(
      screen.getByText(/Hotels with exclusive rates for ICTAAA 2026 participants/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Walking distance or short drive to the conference venue/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Options ranging from budget to premium accommodation/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/For booking links, rates, and more information, please see the list below./i)
    ).toBeInTheDocument();
  });

  it("renders a card for each hotel with external link and icon", () => {
    render(<AccommodationOptionsPage />);

    // Expect all hotel link buttons present by their names
    const hotelButtons = [
      "InterContinental Bahrain",
      "Downtown Rotana",
      "Ibis",
      "The Westin City Centre Bahrain",
      "Le Méridien City Centre Bahrain",
    ];

    hotelButtons.forEach((name) => {
      const link = screen.getByRole("link", { name: new RegExp(name, "i") });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      // The "🔗" icon is aria-hidden; ensure it's inside the link
      const icon = within(link).getByText("🔗");
      expect(icon).toBeInTheDocument();
    });
  });

  it("uses alt text equal to the hotel name for images and renders even when image is null", () => {
    render(<AccommodationOptionsPage />);

    // For hotels with images
    const withImage = [
      { name: "InterContinental Bahrain", src: "/images/hotels/intercontinental.jpg" },
      { name: "Downtown Rotana", src: "/images/hotels/downtown.jpg" },
      { name: "Ibis", src: "/images/hotels/ibis.jpg" },
    ];
    withImage.forEach(({ name, src }) => {
      const img = screen.getByAltText(name);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", src);
    });

    // For hotels with image: null, the <img> still exists with src=null in JSX.
    // Validate alt exists; src may be absent or "null" depending on React/JSDOM handling.
    const nullImageHotels = [
      "The Westin City Centre Bahrain",
      "Le Méridien City Centre Bahrain",
    ];
    nullImageHotels.forEach((name) => {
      const img = screen.getByAltText(name);
      expect(img).toBeInTheDocument();
      // Don't assert exact src value; just ensure the attribute exists (behavior may vary)
      expect(img.getAttribute("alt")).toBe(name);
    });
  });

  it("renders hotel notes using HTML via dangerouslySetInnerHTML", () => {
    render(<AccommodationOptionsPage />);

    // InterContinental note: bolded substring exists
    expect(
      screen.getByText(/University of Technology Bahra/i)
    ).toBeInTheDocument();

    // Downtown Rotana booking code bolded
    expect(screen.getByText(/ROSIDT/)).toBeInTheDocument();

    // Ibis includes an email link and a WhatsApp link
    const email = screen.getByRole("link", { name: /Vanessa\.vaquilar@accor\.com/i });
    expect(email).toBeInTheDocument();
    expect(email).toHaveAttribute("href", "mailto:Vanessa.vaquilar@accor.com");

    const whatsapp = screen.getByRole("link", { name: /WhatsApp \+973 35358850/i });
    expect(whatsapp).toBeInTheDocument();
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("https://wa.me/97335358850"));
  });

  it("ensures each hotel link points to the expected URL", () => {
    render(<AccommodationOptionsPage />);

    expect(screen.getByRole("link", { name: /InterContinental Bahrain/i }))
      .toHaveAttribute("href", "https://www.ihg.com/intercontinental/hotels/gb/en/manama/bahha/hoteldetail");

    expect(screen.getByRole("link", { name: /Downtown Rotana/i }))
      .toHaveAttribute("href", expect.stringContaining("safelinks"));

    expect(screen.getByRole("link", { name: /Ibis/i }))
      .toHaveAttribute("href", "https://all.accor.com/hotel/6702/index.en.shtml");

    expect(screen.getByRole("link", { name: /The Westin City Centre Bahrain/i }))
      .toHaveAttribute("href", "http://www.westincitycentrebahrain.com/");

    expect(screen.getByRole("link", { name: /Le Méridien City Centre Bahrain/i }))
      .toHaveAttribute("href", "http://www.lemeridienbahraincitycentre.com/");
  });
});