RegistrationPage tests:
- Assumes Jest + @testing-library/react are available (common Next.js setup).
- Mocks shadcn/ui Dialog via a virtual module to avoid path alias resolution during tests.
- Mocks AboutHeader and RegistrationSchema to focus on component behavior.
- Injects a minimal global z.ZodError to exercise validation error branch.
- Covers:
  • Rendering of payment sections and price cards
  • Payment dialog open/close rendering behavior
  • Guard against missing payment ID
  • Happy-path submit (registration + mailer) and form reset + success dialog
  • Non-OK server response surfaced to status
  • Zod validation error surfaced to status without network requests