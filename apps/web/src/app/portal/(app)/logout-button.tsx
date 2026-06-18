"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/portal/logout", { method: "POST" })
    router.push("/portal/login")
    router.refresh()
  }

  return <button type="button" onClick={logout}>Abmelden</button>
}
