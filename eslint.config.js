module.exports = {
  rules: {
    // nur WARN, kein ERROR mehr
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
