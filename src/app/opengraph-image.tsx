import { ImageResponse } from "next/og";

export const alt =
  "Portofolio Afrian Pryo Sulistyanno — UI/UX Designer dan Web Developer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(ellipse at 50% 120%, #460000 0%, #160000 42%, #050505 78%)",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#B30814",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#B30814",
            }}
          />
          PORTOFOLIO
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              color: "#B30814",
              fontSize: "70px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            AFRIAN PRYO
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: "42px",
              lineHeight: 1.2,
            }}
          >
            UI/UX Designer &amp; Web Developer
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.25)",
            paddingTop: "22px",
            color: "rgba(255,255,255,0.7)",
            fontSize: "22px",
          }}
        >
          <span>Jepara, Indonesia</span>
          <span>afrianpryo.vercel.app</span>
        </div>
      </div>
    ),
    size
  );
}
