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
            "linear-gradient(135deg, #1a3d2b 0%, #1e6f4e 45%, #f4f0e9 100%)",
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
              color: "#101819",
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
                color: "#ecdccd",
              }}
            >
              Mealnova
            </div>
            <div
              style={{
                fontSize: "22px",
                color: "#d7e5de",
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
              color: "#eef4f1",
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
            color: "#d7e5de",
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
