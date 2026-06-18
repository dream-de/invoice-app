"use client"

import { useState } from "react"
import styles from "../../Portal.module.css"

type Customer = {
  contact: string | null
  email: string | null
  phone: string | null
}

export default function ProfileForm({ customer }: { customer: Customer }) {
  const [contact, setContact] = useState(customer.contact ?? "")
  const [email, setEmail] = useState(customer.email ?? "")
  const [phone, setPhone] = useState(customer.phone ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [nextPassword, setNextPassword] = useState("")
  const [message, setMessage] = useState("")

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, email, phone })
    })
    const data = await response.json().catch(() => ({}))
    setMessage(response.ok ? "Profil gespeichert." : data.error || "Profil konnte nicht gespeichert werden.")
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch("/api/portal/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, nextPassword })
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      setCurrentPassword("")
      setNextPassword("")
      setMessage("Passwort geaendert.")
    } else {
      setMessage(data.error || "Passwort konnte nicht geaendert werden.")
    }
  }

  return (
    <div>
      {message ? <p className={styles.notice}>{message}</p> : null}
      <form className={styles.form} onSubmit={saveProfile}>
        <div className={styles.field}><label htmlFor="contact">Kontaktperson</label><input id="contact" value={contact} onChange={(event) => setContact(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="email">E-Mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="phone">Telefon</label><input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
        <button className={styles.button} type="submit">Kontaktdaten speichern</button>
      </form>
      <form className={styles.form} onSubmit={savePassword}>
        <div className={styles.field}><label htmlFor="current-password">Aktuelles Passwort</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="next-password">Neues Passwort</label><input id="next-password" type="password" autoComplete="new-password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} /></div>
        <button className={styles.button} type="submit">Passwort aendern</button>
      </form>
    </div>
  )
}
