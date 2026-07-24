import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(79,70,229,0.35), transparent)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "white" }}>
          Valens<span style={{ color: "#818cf8" }}>CRM</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 32,
            color: "#a1a1aa",
            maxWidth: 820,
            textAlign: "center",
          }}
        >
          The easiest CRM Builder in the world
        </div>
      </div>
    ),
    size,
  );
}
