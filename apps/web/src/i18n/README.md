# i18n

This is the stable translation foundation for the invoice app.

## Structure

- `config.ts` defines supported languages, fallback behavior and storage keys.
- `locales/<language>/<namespace>.json` contains keyed UI translations.
- `legacy-dom/en.json` provides compatibility strings for older pages that still render German text directly.
- `dictionary.ts` merges namespaces into typed dictionaries.
- `useTranslation.ts` is the public hook entrypoint for new code.

## Namespaces

- `common`: shared labels and actions.
- `navigation`: main navigation and shell labels.
- `dashboard`: dashboard cards and activity text.
- `customers`, `projects`, `articles`, `documents`, `finance`, `settings`, `templates`: feature-specific text.
- `validation`: form and validation messages.

## Rules

- New UI text should use `useTranslation().t("namespace.key")`.
- Do not automatically translate user data, invoice content, customer names, article names, or saved template text.
- Add new languages by creating all namespace files under `locales/<language>/`, then registering the language in `config.ts` and `dictionary.ts`.
- Prefer keyed namespace files for new or updated screens.
