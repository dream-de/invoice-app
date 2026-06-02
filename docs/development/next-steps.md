# Development Next Steps

This list captures the recommended order after the repository cleanup and
branching documentation.

## Current State

- `main` is the stable branch.
- Backup branches have been removed locally.
- Repository structure is documented in `docs/development/project-structure.md`.
- Branching rules are documented in `docs/development/branching.md`.

## Recommended Order

1. Installation flow
   - Verify clean Docker installation from scratch.
   - Check first-run setup and required environment variables.
   - Confirm the app can start without hidden local-only assumptions.

2. First login
   - Verify setup-created credentials.
   - Confirm login redirect behavior.
   - Check session cookie behavior for HTTP and HTTPS installs.

3. Starter invoices
   - Verify demo/starter invoices are created after setup.
   - Check document detail pages, status, payments, send, print, share, and
     download actions.

4. OCR import
   - Test file upload and OCR extraction.
   - Verify imported invoice positions.
   - Check error handling for unsupported or unreadable files.

5. Documents
   - Review document list, detail page, payment dialogs, and action toolbar.
   - Verify mobile and desktop layouts.
   - Confirm dialogs are usable and draggable where expected.

6. README
   - Update installation instructions after the flow is verified.
   - Keep production and development setup clearly separated.

7. Security hardening
   - Re-check `.env.example` placeholders.
   - Verify runtime environment validation.
   - Review auth, rate limits, upload size limits, and production headers.

8. Public repository readiness
   - Only make the repository public after installation, login, OCR, documents,
     README, and security checks are verified.

## Working Rule

Before each larger product step:

```bash
git switch main
git pull origin main
git switch -c feature/descriptive-name
```

After the step is tested:

```bash
git add .
git commit -m "Describe the completed step"
git push -u origin feature/descriptive-name
```

Small documentation or cleanup changes can stay on `main` if the working tree is
clean and the change is easy to verify.
