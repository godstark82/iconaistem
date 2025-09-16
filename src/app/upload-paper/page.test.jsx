/**
 * Tests for UploadPaperPage
 * Framework/Libraries: Jest + @testing-library/react (+@testing-library/user-event)
 *
 * These tests cover:
 * - Rendering of form and key UI elements
 * - State updates via handleChange for text and file inputs
 * - Successful submission flow (schema validation, /api/paper-upload POST, success email POST, modal open, status text, form reset)
 * - Failure on server error (/api/paper-upload not ok)
 * - Failure on schema validation (PaperUploadSchema.parse throws)
 * - Failure when mailer fetch rejects
 * - Modal close behavior
 *
 * External dependencies mocked:
 * - PaperUploadSchema (parse)
 * - fetch (global)
 * - Dialog/UI components are rendered as-is; if Radix portals cause issues in CI, consider mocking '../../components/ui/dialog'.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock schema validator to control validation outcomes
jest.mock("../../schema/paper-upload-schema", () => ({
  __esModule: true,
  default: {
    parse: jest.fn((data) => data), // by default, echo back validated data
  },
}));

// Optionally mock AboutHeader to isolate DOM
jest.mock("../../components/common/AboutHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="about-header" />,
}));

// If Dialog (Radix-based) causes portal issues, provide a lightweight mock.
// Commented out by default to exercise real components.
// jest.mock("../../components/ui/dialog", () => {
//   const Dialog = ({ open, onOpenChange, children }) => (open ? <div data-testid="dialog">{children}</div> : null);
//   const Passthrough = ({ children, ...rest }) => <div {...rest}>{children}</div>;
//   return {
//     __esModule: true,
//     Dialog,
//     DialogContent: Passthrough,
//     DialogHeader: Passthrough,
//     DialogTitle: ({ className, children }) => <h2 className={className}>{children}</h2>,
//     DialogDescription: Passthrough,
//     DialogFooter: Passthrough,
//     DialogClose: ({ asChild, children }) => <button onClick={() => {}}>{children}</button>,
//   };
// });

import UploadPaperPage from "./page";

const PaperUploadSchema = require("../../schema/paper-upload-schema").default;

beforeEach(() => {
  // Fresh fetch mock per test
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

function setupRender() {
  return render(<UploadPaperPage />);
}

function createDocxFile(name = "paper.docx") {
  // Using common docx MIME; accept attr mismatch should not block tests
  return new File(["dummy"], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

async function fillHappyPathForm() {
  const paperTitle = screen.getByPlaceholderText("Paper Title");
  const authorName = screen.getByPlaceholderText("Author's Full Name");
  const authorEmail = screen.getByPlaceholderText("Author's Email");
  const authorAffiliation = screen.getByPlaceholderText("Author's Affiliation");
  const uploaderCountry = screen.getByPlaceholderText("Uploader's Country");
  const abstract = screen.getByPlaceholderText("Abstract");
  const fileInput = screen.getByLabelText(/Upload Paper/i);

  await userEvent.type(paperTitle, "AI in 2026");
  await userEvent.type(authorName, "Ada Lovelace");
  await userEvent.type(authorEmail, "ada@example.com");
  await userEvent.type(authorAffiliation, "Analytical Engine Institute");
  await userEvent.type(uploaderCountry, "UK");
  await userEvent.type(abstract, "A study on computational creativity.");

  const f = createDocxFile();
  // fireEvent required for file inputs
  fireEvent.change(fileInput, { target: { files: [f] } });

  return {
    values: {
      paperTitle: "AI in 2026",
      authorName: "Ada Lovelace",
      authorEmail: "ada@example.com",
      authorAffiliation: "Analytical Engine Institute",
      uploaderCountry: "UK",
      paperAbstract: "A study on computational creativity.",
      uploadedFile: f,
    },
  };
}

test("renders header, submission section, and submit button", () => {
  setupRender();
  expect(screen.getByTestId("about-header")).toBeInTheDocument();
  expect(screen.getByText(/Submit Your Paper/i)).toBeInTheDocument();
  const submitBtn = screen.getByRole("button", { name: /Submit Paper/i });
  expect(submitBtn).toBeEnabled();
});

test("updates text inputs and file input correctly", async () => {
  setupRender();
  const { values } = await fillHappyPathForm();

  // spot-check a couple of values via input value assertions
  expect(screen.getByPlaceholderText("Paper Title")).toHaveValue(values.paperTitle);
  expect(screen.getByPlaceholderText("Author's Full Name")).toHaveValue(values.authorName);

  // verify file selected visually by checking input files length if accessible
  const fileInput = screen.getByLabelText(/Upload Paper/i);
  expect(fileInput.files).toHaveLength(1);
  expect(fileInput.files[0].name).toBe(values.uploadedFile.name);
});

test("successful submission posts to /api/paper-upload, then sends success email, opens modal, resets form and shows status", async () => {
  setupRender();
  const { values } = await fillHappyPathForm();

  // First fetch: paper upload OK
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "ok" }),
    })
    // Second fetch: mailer OK (content of response is irrelevant; code does not read it)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sent: true }),
    });

  const submitBtn = screen.getByRole("button", { name: /Submit Paper/i });
  await userEvent.click(submitBtn);

  // Button shows loading text while submitting
  expect(screen.getByRole("button", { name: /Submitting.../i })).toBeDisabled();

  // Validate schema called with expected mapping (authorCountry <- uploaderCountry)
  await waitFor(() => {
    expect(PaperUploadSchema.parse).toHaveBeenCalledTimes(1);
  });
  const parsedArg = PaperUploadSchema.parse.mock.calls[0][0];
  expect(parsedArg).toMatchObject({
    paperTitle: values.paperTitle,
    paperAbstract: values.paperAbstract,
    authorName: values.authorName,
    authorEmail: values.authorEmail,
    authorAffiliation: values.authorAffiliation,
    authorCountry: values.uploaderCountry,
  });
  expect(parsedArg.uploadedFile).toBe(values.uploadedFile);

  // Verify upload fetch call
  expect(global.fetch).toHaveBeenNthCalledWith(
    1,
    "/api/paper-upload",
    expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
    })
  );

  // Verify success email fetch
  expect(global.fetch).toHaveBeenNthCalledWith(
    2,
    "/api/mailer",
    expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String),
    })
  );

  // Inspect email payload body
  const mailPayload = JSON.parse(global.fetch.mock.calls[1][1].body);
  expect(mailPayload).toMatchObject({
    to: values.authorEmail,
    subject: "Paper Submission Successful - ICTAAA 2026",
  });
  // Email text should include templated strings
  expect(mailPayload.text).toContain(`Dear ${values.authorName},`);
  expect(mailPayload.text).toContain(`"${values.paperTitle}"`);
  expect(mailPayload.text).toContain("ICTAAA 2026 Committee");

  // Success status shown
  await waitFor(() => {
    expect(screen.getByText(/Paper submitted successfully\!/i)).toBeInTheDocument();
  });

  // Modal content appears
  expect(
    await screen.findByText(/CONFIRMATION OF SUBMISSION/i, {}, { timeout: 2000 })
  ).toBeInTheDocument();
  expect(screen.getByText(/Thank You for Your Submission/i)).toBeInTheDocument();
  expect(
    screen.getByText(/Notifications of acceptance will be sent via email no later than 15 September 2025/i)
  ).toBeInTheDocument();

  // Form resets after success
  expect(screen.getByPlaceholderText("Paper Title")).toHaveValue("");
  expect(screen.getByPlaceholderText("Author's Full Name")).toHaveValue("");
  expect(screen.getByPlaceholderText("Author's Email")).toHaveValue("");
  expect(screen.getByPlaceholderText("Author's Affiliation")).toHaveValue("");
  expect(screen.getByPlaceholderText("Uploader's Country")).toHaveValue("");
  expect(screen.getByPlaceholderText("Abstract")).toHaveValue("");
});

test("handles server error from /api/paper-upload and does not send email or show modal", async () => {
  setupRender();
  await fillHappyPathForm();

  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Validation error from API" }),
  });

  await userEvent.click(screen.getByRole("button", { name: /Submit Paper/i }));

  await waitFor(() => {
    expect(screen.getByText(/Submission failed: Validation error from API/i)).toBeInTheDocument();
  });

  // Only one fetch (upload), mailer not called
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/CONFIRMATION OF SUBMISSION/i)).not.toBeInTheDocument();
});

test("handles schema validation error before any fetch is attempted", async () => {
  setupRender();

  // Force schema parse to throw
  PaperUploadSchema.parse.mockImplementationOnce(() => {
    const err = new Error("Schema parse failed");
    throw err;
  });

  // Minimal fill to trigger submit (required attributes won't block programmatic submit)
  await userEvent.type(screen.getByPlaceholderText("Paper Title"), "X");
  await userEvent.type(screen.getByPlaceholderText("Author's Full Name"), "Y");
  await userEvent.type(screen.getByPlaceholderText("Author's Email"), "y@example.com");
  await userEvent.type(screen.getByPlaceholderText("Author's Affiliation"), "Org");
  await userEvent.type(screen.getByPlaceholderText("Uploader's Country"), "US");
  await userEvent.type(screen.getByPlaceholderText("Abstract"), "Z");
  fireEvent.change(screen.getByLabelText(/Upload Paper/i), {
    target: { files: [createDocxFile()] },
  });

  await userEvent.click(screen.getByRole("button", { name: /Submit Paper/i }));

  await waitFor(() => {
    expect(screen.getByText(/Submission failed: Schema parse failed/i)).toBeInTheDocument();
  });

  // No network calls when schema fails
  expect(global.fetch).not.toHaveBeenCalled();
});

test("handles failure when mailer fetch rejects (network error) and does not show success modal", async () => {
  setupRender();
  await fillHappyPathForm();

  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "ok" }),
    })
    .mockRejectedValueOnce(new Error("Mailer network down"));

  await userEvent.click(screen.getByRole("button", { name: /Submit Paper/i }));

  await waitFor(() => {
    expect(screen.getByText(/Submission failed: Mailer network down/i)).toBeInTheDocument();
  });

  expect(screen.queryByText(/CONFIRMATION OF SUBMISSION/i)).not.toBeInTheDocument();
});

test("allows closing the confirmation modal via Close button", async () => {
  setupRender();
  await fillHappyPathForm();

  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

  await userEvent.click(screen.getByRole("button", { name: /Submit Paper/i }));

  // Wait for modal
  const title = await screen.findByText(/CONFIRMATION OF SUBMISSION/i);
  expect(title).toBeInTheDocument();

  // Click Close button; depending on Dialog implementation, it should close
  const closeBtn = screen.getByRole("button", { name: /Close/i });
  await userEvent.click(closeBtn);

  // Allow state update
  await waitFor(() => {
    expect(screen.queryByText(/CONFIRMATION OF SUBMISSION/i)).not.toBeInTheDocument();
  });
});