# Optional PDF Tools

The invoice app does not require system PDF analysis tools for normal local development or production use.

The built-in document and invoice workflows should stay independent from machine-specific utilities. Optional tools are useful only for development tasks such as inspecting external PDFs, comparing generated output, debugging print rendering, or preparing CI checks.

## Optional Packages

On Debian or Ubuntu systems, these packages are useful:

```bash
sudo apt-get update
sudo apt-get install -y poppler-utils ghostscript qpdf fonts-dejavu fonts-liberation fonts-noto
```

They provide tools such as:

- `pdfinfo` for PDF metadata
- `pdftotext` for text extraction
- `pdftoppm` for rendering PDF pages to images
- `ghostscript` for PDF rendering and conversion
- `qpdf` for PDF validation and repair

## Project Policy

These tools are optional. Do not make them required unless the project adds one of these features:

- PDF import from external invoices
- visual PDF regression tests
- automated PDF validation in CI
- server-side PDF repair or conversion

For normal invoice creation, editing, and export, prefer the app's own Node/Next rendering pipeline and project-managed dependencies.

## Quick Check

Run:

```bash
scripts/check-pdf-tools.sh
```

The script reports available tools but exits successfully even when optional tools are missing.
