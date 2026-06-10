import { ImageResponse } from "next/og";
import { getBrandSettings } from "@/lib/api";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const brand = await getBrandSettings().catch(() => null);
  const siteName = brand?.siteName?.trim() || "Mealnova";
  const tagline = brand?.tagline?.trim() || "Operational catering for modern teams and events";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #f8fafc 100%)",
          padding: "56px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "86px",
              width: "86px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "22px",
              background: "#f59e0b",
              color: "#0f172a",
              fontSize: "40px",
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#facc15",
              }}
            >
              Mealnova
            </div>
            <div
              style={{
                fontSize: "22px",
                color: "#cbd5e1",
              }}
            >
              Public site
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: "960px",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              fontSize: "76px",
              lineHeight: 1.02,
              fontWeight: 700,
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              fontSize: "34px",
              lineHeight: 1.3,
              color: "#e2e8f0",
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "24px",
            color: "#cbd5e1",
          }}
        >
          <div>Corporate catering, cafeteria operations, and event service</div>
          <div>mealnova.in</div>
        </div>
      </div>
    ),
    size,
  );
}
