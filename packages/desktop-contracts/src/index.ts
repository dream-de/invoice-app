export type DesktopNativeBridgeContract = {
  appReady: () => Promise<{ ok: true }>
  openExternal: (url: string) => Promise<{ ok: true }>
}

export const desktopContractNamespace = "dreamInvoice"
