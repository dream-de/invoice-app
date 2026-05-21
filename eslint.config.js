const js = require("@eslint/js")
const tsParser = require("@typescript-eslint/parser")
const tsPlugin = require("@typescript-eslint/eslint-plugin")
const importPlugin = require("eslint-plugin-import")
const unusedImports = require("eslint-plugin-unused-imports")
const nextConfig = require("eslint-config-next/typescript")

module.exports = [
  ...nextConfig,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "unused-imports": unusedImports
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "unused-imports/no-unused-imports": "warn",
      "import/no-duplicates": "warn",
      "no-undef": "off",
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "Literal[value=/space-y-|shadow-|rounded-|gap-|p-|m-|hover:|bg-|text-|border-/]",
          message:
            "Use designTokens instead of raw Tailwind classes"
        }
      ]
    }
  }
]
