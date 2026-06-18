import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "40px", background: "linear-gradient(135deg, #101827 0%, #6d28d9 52%, #14b8a6 100%)", position: "relative" }}>
        <div style={{ width: "130px", height: "130px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "32px", background: "rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)" }}>
          <div style={{ width: "68px", height: "68px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", left: "5px", top: "0px", color: "#fff", fontSize: "58px", fontWeight: 900, lineHeight: 1, fontFamily: "Arial, Helvetica, sans-serif" }}>D</div>
            <div style={{ position: "absolute", right: "2px", top: "20px", width: "16px", height: "4px", borderRadius: "999px", background: "#fff" }} />
            <div style={{ position: "absolute", right: "2px", top: "31px", width: "13px", height: "4px", borderRadius: "999px", background: "#fff", opacity: 0.92 }} />
            <div style={{ position: "absolute", right: "2px", top: "42px", width: "18px", height: "4px", borderRadius: "999px", background: "#fff", opacity: 0.84 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
