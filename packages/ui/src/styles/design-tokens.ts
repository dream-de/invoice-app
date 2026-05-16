export const designTokens = {
  text: {
    h1: "text-4xl font-bold tracking-tight text-neutral-900",
    h2: "text-2xl font-semibold text-neutral-900",
    h3: "text-lg font-semibold text-neutral-900",
    body: "text-sm text-neutral-600",
    muted: "text-xs text-neutral-500",
    label: "text-sm font-medium text-neutral-700"
  },

  layout: {
    page: "space-y-10",
    section: "space-y-8",
    group: "space-y-6"
  },

  card: {
    base:
      "rounded-2xl border border-neutral-200 bg-white shadow-md hover:shadow-lg transition-all duration-200",
    padding: "p-6"
  },

  interaction: {
    base: "transition-all duration-200",
    hover: "hover:shadow-lg hover:-translate-y-0.5",
    active: "active:scale-[0.98]"
  },

  button: {
    primary:
      "bg-neutral-900 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98]",
    secondary:
      "border border-neutral-300 px-4 py-2 rounded-xl hover:bg-neutral-50 transition-all duration-200",
    ghost:
      "px-4 py-2 rounded-xl hover:bg-neutral-100 transition-all duration-200"
  },

  input: {
    base:
      "w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10"
  }
}
