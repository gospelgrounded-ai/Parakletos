import { ImageResponse } from "next/og";

// Maskable variant — the glyph sits inside a ~20% safe area so Android's
// adaptive-icon cropping (circle, squircle, etc.) never clips it.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4051b5",
          color: "white",
          fontSize: 76,
          fontWeight: 700,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        P
      </div>
    ),
    { width: 192, height: 192 }
  );
}
