"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../../Portal.module.css"

export default function InviteForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    const response = await fetch("/api/portal/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) {
      setMessage(data.error || "Einladung konnte nicht angenommen werden.")
      return
    }
    router.push("/portal")
    router.refresh()
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="portal-new-password">Passwort festlegen</label>
        <input id="portal-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      {message ? <div className={styles.notice}>{message}</div> : null}
      <button className={styles.button} type="submit" disabled={loading}>{loading ? "Speichern..." : "Portal aktivieren"}</button>
    </form>
  )
}
