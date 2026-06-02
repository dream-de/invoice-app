import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import importPlugin from "eslint-plugin-import"
import unusedImports from "eslint-plugin-unused-imports"
import nextConfig from "eslint-config-next/typescript"

export default [
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
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "import/no-duplicates": "warn",
      "import/no-cycle": "warn",
      "no-undef": "off",
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/space-y-|shadow-|rounded-|gap-|p-|m-|hover:|bg-|text-|border-/]",
          message:
            "Use designTokens instead of raw Tailwind classes"
        }
      ]
    }
  }
]
