"use client"

import React, { useEffect } from "react"

type ToastProps = {
  message: string
  onClose?: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return

    const t = setTimeout(() => {
      onClose?.()
    }, 3000)

    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-4 right-4 rounded-md bg-black px-4 py-2 text-white shadow">
      {message}
    </div>
  )
}
