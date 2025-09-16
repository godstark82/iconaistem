/**
 * Tests for UploadPaperPage
 *
 * Detected/assumed framework:
 * - Test runner: Jest
 * - DOM: jest-environment-jsdom
 * - UI: React Testing Library (@testing-library/react, @testing-library/jest-dom)
 *
 * If your repo uses Vitest instead of Jest, replace:
 * - jest.fn -> vi.fn
 * - jest.mock -> vi.mock
 * - expect(...).toBeInTheDocument requires @testing-library/jest-dom be set up.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// IMPORTANT: We import the component by its resolved path.
// Update this import if your actual file path differs.
import UploadPaperPage from '../../app/upload-paper/page' // fallback common Next.js path
// Alternative common paths (uncomment if needed):
// import UploadPaperPage from '../../pages/upload-paper'
// import UploadPaperPage from '../../src/pages/upload-paper'
// import UploadPaperPage from '../../app/(site)/upload-paper/page'

// Mock heavy UI dependencies used inside the page to avoid portal/animation complexity.
jest.mock('../../components/common/AboutHeader', () => () => <div data-testid="about-header" />)

jest.mock('../../components/ui/dialog', () => {
  const Dialog = ({ open, onOpenChange, children }) => (
    <div data-testid="dialog" data-open={open ? 'true' : 'false'}>
      {children}
    </div>
  )
  const DialogContent = ({ children }) => <div data-testid="dialog-content">{children}</div>
  const DialogHeader = ({ children }) => <div data-testid="dialog-header">{children}</div>
  const DialogTitle = ({ children, className }) => <h1 data-testid="dialog-title" className={className}>{children}</h1>
  const DialogDescription = ({ children }) => <div data-testid="dialog-description">{children}</div>
  const DialogFooter = ({ children }) => <div data-testid="dialog-footer">{children}</div>
  const DialogClose = ({ asChild, children }) => <button data-testid="dialog-close">{children}</button>
  return { __esModule: true, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
})

jest.mock('../../components/ui/button', () => {
  const Button = ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>
  return { __esModule: true, Button }
})

// Mock the Zod schema module so we can control validation behavior.
jest.mock('../../schema/paper-upload-schema', () => {
  return {
    __esModule: true,
    default: {
      // By default, echo input (valid case). Override per-test to throw for invalid cases.
      parse: jest.fn((data) => data),
    },
  }
})

const PaperUploadSchema = require('../../schema/paper-upload-schema').default

// Utilities
const fillHappyPathForm = async (user) => {
  const title = 'AI for Sustainable Cities'
  const authorName = 'Dr. Ada Lovelace'
  const authorEmail = 'ada@example.com'
  const affiliation = 'Analytical Engines Institute'
  const country = 'UK'
  const abstract = 'We explore AI-driven sustainability...'
  const file = new File(['dummy'], 'paper.docx', { type: 'application/docx' })

  await user.type(screen.getByPlaceholderText('Paper Title'), title)
  await user.type(screen.getByPlaceholderText("Author's Full Name"), authorName)
  await user.type(screen.getByPlaceholderText("Author's Email"), authorEmail)
  await user.type(screen.getByPlaceholderText("Author's Affiliation"), affiliation)
  await user.type(screen.getByPlaceholderText("Uploader's Country"), country)
  // File input: find by label text shown above the input
  const uploadLabel = screen.getByText(/Upload Paper \(DOCX\)/i)
  const uploadInput = uploadLabel.parentElement.querySelector('input[type="file"]')
  await user.upload(uploadInput, file)
  await user.type(screen.getByPlaceholderText('Abstract'), abstract)

  return { title, authorName, authorEmail, affiliation, country, abstract, file }
}

describe('UploadPaperPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    // Default global fetch mock with two sequential calls
    global.fetch = jest.fn()
  })

  it('renders core form fields and static content', () => {
    render(<UploadPaperPage />)

    // Header and submission guidelines presence
    expect(screen.getByTestId('about-header')).toBeInTheDocument()
    expect(screen.getByText('Submission Guidelines')).toBeInTheDocument()
    expect(screen.getByText('Submit Your Paper')).toBeInTheDocument()

    // Form fields
    expect(screen.getByPlaceholderText('Paper Title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Author's Full Name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Author's Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Author's Affiliation")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Uploader's Country")).toBeInTheDocument()
    expect(screen.getByText(/Upload Paper \(DOCX\)/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Abstract')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit Paper/i })).toBeInTheDocument()
  })

  it('updates state on text and file inputs', async () => {
    const user = userEvent.setup()
    render(<UploadPaperPage />)

    const { title, authorName, authorEmail, affiliation, country, abstract, file } = await fillHappyPathForm(user)

    // Verify the file was accepted (input holds 1 file)
    const uploadInput = screen.getByText(/Upload Paper \(DOCX\)/i).parentElement.querySelector('input[type="file"]')
    expect(uploadInput.files).toHaveLength(1)
    expect(uploadInput.files[0].name).toBe(file.name)

    // Spot-check one field value via DOM value (controlled input)
    expect(screen.getByPlaceholderText('Paper Title')).toHaveValue(title)
    expect(screen.getByPlaceholderText("Author's Email")).toHaveValue(authorEmail)
    expect(screen.getByPlaceholderText('Abstract')).toHaveValue(abstract)
  })

  it('submits successfully: posts form data, sends email, shows confirmation, resets form', async () => {
    const user = userEvent.setup()
    render(<UploadPaperPage />)

    const formVals = await fillHappyPathForm(user)

    // Mock upload API success
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, id: 'upload-123' }),
      })
      // Mock mailer API success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })

    const submitBtn = screen.getByRole('button', { name: /Submit Paper/i })
    await user.click(submitBtn)

    // Loading state: text should change
    expect(screen.getByRole('button', { name: /Submitting\.\.\./i })).toBeInTheDocument()

    // First fetch: /api/paper-upload with FormData
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/paper-upload',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    )

    // Verify FormData contents (extract by iterating)
    const body = global.fetch.mock.calls[0][1].body
    const data = {}
    // FormData iteration in jsdom
    body.forEach((v, k) => { data[k] = v })
    expect(data).toMatchObject({
      paperTitle: formVals.title,
      paperAbstract: formVals.abstract,
      authorName: formVals.authorName,
      authorEmail: formVals.authorEmail,
      authorAffiliation: formVals.affiliation,
      authorCountry: formVals.country,
    })
    expect(data.uploadedFile).toBeInstanceOf(File)
    expect(data.uploadedFile.name).toBe('paper.docx')

    // Second fetch: /api/mailer with correct payload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/mailer',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    )
    const emailReq = JSON.parse(global.fetch.mock.calls[1][1].body)
    expect(emailReq).toMatchObject({
      to: formVals.authorEmail,
      subject: 'Paper Submission Successful - ICTAAA 2026',
    })
    // Email body should include template parts
    expect(emailReq.text).toContain(`Dear ${formVals.authorName},`)
    expect(emailReq.text).toContain(`"${formVals.title}"`)
    expect(emailReq.text).toContain('ICTAAA 2026 Committee')

    // Status and modal visible
    await waitFor(() => {
      expect(screen.getByText('Paper submitted successfully\!')).toBeInTheDocument()
      const dialog = screen.getByTestId('dialog')
      expect(dialog).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('CONFIRMATION OF SUBMISSION')
    })

    // Form should reset (inputs cleared)
    expect(screen.getByPlaceholderText('Paper Title')).toHaveValue('')
    expect(screen.getByPlaceholderText("Author's Full Name")).toHaveValue('')
    expect(screen.getByPlaceholderText("Author's Email")).toHaveValue('')
    expect(screen.getByPlaceholderText("Author's Affiliation")).toHaveValue('')
    expect(screen.getByPlaceholderText("Uploader's Country")).toHaveValue('')
    expect(screen.getByPlaceholderText('Abstract')).toHaveValue('')
  })

  it('handles API error response: shows failure status and does not send email', async () => {
    const user = userEvent.setup()
    render(<UploadPaperPage />)
    await fillHappyPathForm(user)

    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'File too large' }),
      })

    await user.click(screen.getByRole('button', { name: /Submit Paper/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    // No mailer call on failure
    expect(global.fetch).not.toHaveBeenCalledTimes(2)

    // Failure status shown
    await waitFor(() => {
      expect(screen.getByText(/Submission failed: File too large/i)).toBeInTheDocument()
    })

    // Modal should not open
    const dialog = screen.getByTestId('dialog')
    expect(dialog).toHaveAttribute('data-open', 'false')
  })

  it('handles validation failure (schema throws): shows failure status, no network calls', async () => {
    const user = userEvent.setup()
    render(<UploadPaperPage />)

    await fillHappyPathForm(user)

    // Make schema parsing fail
    PaperUploadSchema.parse.mockImplementationOnce(() => {
      throw new Error('Invalid email format')
    })

    await user.click(screen.getByRole('button', { name: /Submit Paper/i }))

    // No network calls should be made if schema fails
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })

    expect(screen.getByText(/Submission failed: Invalid email format/i)).toBeInTheDocument()
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    render(<UploadPaperPage />)
    await fillHappyPathForm(user)

    // Create a fetch that never resolves immediately to observe the disabled state
    let resolveUpload
    const uploadPromise = new Promise((res) => { resolveUpload = res })
    global.fetch.mockReturnValueOnce(uploadPromise)

    const btn = screen.getByRole('button', { name: /Submit Paper/i })
    expect(btn).toBeEnabled()
    await user.click(btn)

    // Button should be disabled and text changed
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submitting\.\.\./i })).toBeDisabled()
    })

    // Finish the pending promise to avoid hanging test
    resolveUpload({ ok: true, json: async () => ({ ok: true }) })
  })
})