/**
 * AccommodationOptionsPage tests
 * Testing framework: Jest
 * Testing library: @testing-library/react
 *
 * If your project uses Vitest, these tests should be compatible with minimal tweaks
 * (e.g., replace jest.mock with vi.mock if globals aren't configured).
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock AboutHeader to isolate this page and avoid external dependencies.
jest.mock("../../../components/common/AboutHeader", () => {
  return function MockAboutHeader(props) {
    return (
      <div data-testid="about-header">
        {props.title} | {props.date}
      </div>
    );
  };
});

import AccommodationOptionsPage from "./accommodation-options.page.jsx";

describe("AccommodationOptionsPage", () => {
  it("renders AboutHeader with correct title and date", () => {
    render(<AccommodationOptionsPage />);
    const header = screen.getByTestId("about-header");

    expect(header && header.textContent.includes("Accommodation Options")).toBe(true);
    expect(header && header.textContent.includes("September 5-7, 2025")).toBe(true);
  });

  it("renders hotel links and images for all listed hotels", () => {
    render(<AccommodationOptionsPage />);
    const hotelNames = [
      "InterContinental Bahrain",
      "Downtown Rotana",
      "Ibis",
      "The Westin City Centre Bahrain",
      "Le Méridien City Centre Bahrain",
    ];

    hotelNames.forEach((name) => {
      const link = screen.getByRole("link", { name: new RegExp(`^${name}$`, "i") });
      expect(link).toBeTruthy();

      const img = screen.getByAltText(name);
      expect(img).toBeTruthy();
    });
  });

  it("applies secure attributes (target and rel) on external hotel links", () => {
    render(<AccommodationOptionsPage />);
    const link = screen.getByRole("link", { name: /InterContinental Bahrain/i });
    expect(link.getAttribute("target")).toBe("_blank");
    const rel = link.getAttribute("rel") || "";
    expect(rel.includes("noopener")).toBe(true);
    expect(rel.includes("noreferrer")).toBe(true);
  });

  it("renders notes when provided and omits note container when empty", () => {
    const { container } = render(<AccommodationOptionsPage />);

    // Positive notes present
    expect(screen.getByText(/Use ROSIDT as the Booking Code/i)).toBeTruthy();
    expect(screen.getByText(/Prior to booking/i)).toBeTruthy();

    // Count only the note containers by their specific class (acceptable here for negative checks)
    const noteEls = container.querySelectorAll(".text-xs.text-gray-700.mt-2");

    expect(noteEls.length).toBe(3); // InterContinental, Downtown Rotana, Ibis
  });

  it("renders email and WhatsApp links inside notes with correct hrefs", () => {
    render(<AccommodationOptionsPage />);
    const email = screen.getByRole("link", { name: /Vanessa\.vaquilar@accor\.com/i });
    expect(email.getAttribute("href")).toBe("mailto:Vanessa.vaquilar@accor.com");

    const wa = screen.getByRole("link", { name: /WhatsApp \+973 35358850/i });
    expect(wa.getAttribute("href")).toBe("https://wa.me/97335358850");
  });

  it("renders IMG with alt text even when image src is null (no src attribute)", () => {
    render(<AccommodationOptionsPage />);
    ["The Westin City Centre Bahrain", "Le Méridien City Centre Bahrain"].forEach((name) => {
      const img = screen.getByAltText(name);
      expect(img.tagName.toLowerCase()).toBe("img");
      const src = img.getAttribute("src");
      expect(src).toBeFalsy(); // null or empty string both treated as falsy
    });
  });

  it("includes decorative link icon hidden from accessibility", () => {
    render(<AccommodationOptionsPage />);
    const link = screen.getByRole("link", { name: /InterContinental Bahrain/i });
    const hiddenIcon = link.querySelector("span[aria-hidden]");
    expect(hiddenIcon).toBeTruthy();
  });

  it("uses the provided encoded URL for Downtown Rotana", () => {
    render(<AccommodationOptionsPage />);
    const rotana = screen.getByRole("link", { name: /Downtown Rotana/i });
    expect(rotana.getAttribute("href")).toBe(
      "https://eur06.safelinks.protection.outlook.com/?url=http%3A%2F%2Froho.it%2Fbgmg&data=05%7C02%7Ccrbansolay%40utb.edu.bh%7Ccfa6045b6ccb425e426e08ddabdfcfc4%7Cc599d08d7ffd46c98e6ccc8b13dbba77%7C0%7C0%7C638855699924365403%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=qiBIKXnECK6lFPOIUs5Uap3y7%2BmHuA%2FUiRO1tn3Xm4Y%3D&reserved=0"
    );
  });
});