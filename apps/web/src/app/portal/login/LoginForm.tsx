"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../Portal.module.css"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const response = await fetch("/api/portal/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)

    if (!response.ok) {
      setMessage(data.error || "Login fehlgeschlagen.")
      return
    }

    router.push("/portal")
    router.refresh()
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="portal-email">E-Mail</label>
        <input id="portal-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="portal-password">Passwort</label>
        <input id="portal-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      {message ? <div className={styles.notice}>{message}</div> : null}
      <button className={styles.button} type="submit" disabled={loading}>{loading ? "Anmelden..." : "Anmelden"}</button>
    </form>
  )
}
