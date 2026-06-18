import { ImageResponse } from "next/og"

export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "192px", height: "192px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "42px", background: "linear-gradient(135deg, #101827 0%, #6d28d9 52%, #14b8a6 100%)", position: "relative" }}>
        <div style={{ width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "34px", background: "rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.26)" }}>
          <div style={{ width: "74px", height: "74px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", left: "6px", top: "2px", color: "#fff", fontSize: "62px", fontWeight: 900, lineHeight: 1, fontFamily: "Arial, Helvetica, sans-serif" }}>D</div>
            <div style={{ position: "absolute", right: "2px", top: "22px", width: "18px", height: "4px", borderRadius: "999px", background: "#fff" }} />
            <div style={{ position: "absolute", right: "2px", top: "34px", width: "15px", height: "4px", borderRadius: "999px", background: "#fff", opacity: 0.92 }} />
            <div style={{ position: "absolute", right: "2px", top: "46px", width: "20px", height: "4px", borderRadius: "999px", background: "#fff", opacity: 0.84 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
