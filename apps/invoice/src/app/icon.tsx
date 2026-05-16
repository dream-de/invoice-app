
import { ImageResponse } from "next/og";

export const size = {

  width: 32,

  height: 32

};

export const contentType = "image/png";

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

          borderRadius: "8px",

          background: "#bef264",

          color: "#000",

          fontSize: "14px",

          fontWeight: 900

        }}

      >

        IA

      </div>

    ),

    {

      ...size

    }

  );

}

