import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TheTutor - AI-Powered Personalized Learning";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              background: "#d4af37",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "72px",
              color: "white",
            }}
          >
            T
          </div>
          <div
            style={{
              fontSize: "96px",
              fontWeight: "bold",
              color: "#1a1a1a",
              fontFamily: "serif",
            }}
          >
            TheTutor
          </div>
        </div>
        <div
          style={{
            fontSize: "42px",
            color: "#333333",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.4,
          }}
        >
          AI-Powered Personalized Learning Platform
        </div>
        <div
          style={{
            fontSize: "32px",
            color: "#8a6a09",
            marginTop: "32px",
            fontWeight: "600",
          }}
        >
          Just Ask.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
