import { ImageResponse } from "next/og"

export const size = {
  width: 32,
  height: 32
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9px",
          background: "linear-gradient(135deg, #101827 0%, #123f73 58%, #d9f944 100%)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.28)",
          position: "relative"
        }}
      >
        <div
          style={{
            width: "17px",
            height: "21px",
            display: "flex",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.96)",
            boxShadow: "0 5px 10px rgba(0,0,0,0.24)",
            position: "relative"
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              display: "flex",
              background: "#d9f944",
              clipPath: "polygon(100% 0, 100% 100%, 0 0)",
              position: "absolute",
              right: "0px",
              top: "0px"
            }}
          />
          <div
            style={{
              width: "9px",
              height: "5px",
              display: "flex",
              borderLeft: "3px solid #123f73",
              borderBottom: "3px solid #123f73",
              transform: "rotate(-45deg)",
              position: "absolute",
              left: "4px",
              top: "8px"
            }}
          />
        </div>
      </div>
    ),
    {
      ...size
    }
  )
}
