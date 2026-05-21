import type { DesktopNotificationRequest } from "../ipc/contracts"

export type DesktopNotificationPlan = DesktopNotificationRequest & {
  silent: boolean
}

export function createDesktopNotificationPlan(
  notification: DesktopNotificationRequest
): DesktopNotificationPlan {
  return {
    ...notification,
    silent: notification.tone === "info"
  }
}
