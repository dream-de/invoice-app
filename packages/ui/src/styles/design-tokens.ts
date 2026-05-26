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
  },

  admin: {
    pageShell: "p-10",
    contentWide: "mx-auto max-w-6xl",
    statGrid: "grid gap-6 md:grid-cols-3",
    centeredPage: "flex min-h-screen items-center justify-center p-10",
    errorCard: "max-w-md rounded-xl border border-red-200 bg-white p-8 shadow-sm",
    errorTitle: "text-2xl font-bold text-red-600",
    errorText: "mt-4 text-sm text-neutral-600",
    errorButton: "mt-6 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
  },

  accountingStatusBadge: {
    base: "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
    balanced: "bg-green-500/10 text-green-300 border-green-500/30",
    open: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    error: "bg-red-500/10 text-red-300 border-red-500/30",
    active: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    revenue: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    fallback: "bg-slate-800 text-slate-300 border-slate-700"
  },

  utility: {
    u0203ed6078: "mt-1 text-sm text-neutral-600",
    u0478c89a15: "p-6",
    u04bf589a97: "mt-6 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white",
    u0846dfd512: "mt-4 text-slate-400",
    u08f466f9c5: "rounded-xl border border-slate-800 p-6 hover:border-blue-500 transition",
    u0b45bc1db1: "grid grid-cols-1 gap-6 md:grid-cols-3",
    u0cf3524e8a: "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm",
    u0f5f4577d5: "border-b border-slate-800 px-6 py-4",
    u121913d0a0: "grid gap-6 md:grid-cols-3",
    u15a5615a4b: "mt-10 space-y-6",
    u17fe1da1de: "mt-2 text-3xl font-bold",
    u22babeb684: "text-5xl font-bold",
    u2689f39580: "font-medium",
    u26a869e00c: "mt-4 text-neutral-500",
    u32a71e64be: "max-w-5xl mx-auto",
    u34e85d341c: "text-slate-400 text-sm",
    u3554eb81da: "text-sm text-neutral-500",
    u432ca38431: "text-2xl font-bold text-red-400",
    u4df3cc14e1: "rounded-xl border border-slate-800 bg-slate-900/50",
    u59ee6928dd: "flex min-h-screen items-center justify-center",
    u5b6a20fe28: "border-b border-neutral-200 px-6 py-4",
    u623e052301: "mx-auto max-w-4xl",
    u6b1c3b20f7: "flex min-h-screen items-center justify-center p-10",
    u7793e4b914: "mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500",
    u7890688d30: "text-5xl font-bold text-white",
    u794af4e5bc: "max-w-md rounded-xl border border-red-900 bg-red-950/40 p-8",
    u7db266bed9: "space-y-2 text-sm text-neutral-700",
    u8588407212: "text-lg font-semibold",
    u8cc03efa68: "rounded-xl border border-slate-800 bg-slate-900/50 p-6",
    u92a525a0c6: "text-sm text-slate-400",
    u9c7f2a2b70: "flex items-start justify-between gap-4",
    u9cb760d000: "mx-auto max-w-6xl space-y-8",
    u9ed334d095: "mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500",
    ua4d0f420b7: "p-10",
    ua6f5030e4b: "rounded-xl border border-neutral-200 bg-white shadow-sm",
    uadc5ca2753: "mx-auto max-w-6xl",
    uaf6ac64dff: "grid grid-cols-1 md:grid-cols-3 gap-6",
    uba964cf8cf: "text-xl font-semibold mb-2",
    uc52b72f5ca: "mt-4 space-y-4",
    uc8fb474da8: "mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500",
    uca6bf63030: "text-center",
    ucc70d0093a: "rounded-lg bg-black px-4 py-2 text-sm font-medium text-white",
    ud54a74882f: "mt-4 text-sm text-slate-300",
    udfe74d797c: "text-slate-400 mb-10",
    ue37f5e8623: "mt-2 text-sm text-slate-500",
    ue4de0bd191: "text-4xl font-bold mb-3",
    ue6ee580267: "flex flex-wrap gap-3",
    ue75104fa5d: "mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2",
    uedb2e65dce: "mt-4 flex items-center justify-between",
    uf556221233: "block text-sm font-medium",
    ufade624428: "text-lg font-semibold text-white",
    ufdc10ac346: "mt-1 text-sm text-slate-400",
    ufffcd17f89: "space-y-4 text-center"
  }
}
