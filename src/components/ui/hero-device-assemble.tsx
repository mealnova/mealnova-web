"use client";

import { Player } from "@remotion/player";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { cn } from "@/lib/utils";

type DeviceMetric = {
  label: string;
  value: string;
};

export interface HeroDeviceAssembleProps {
  assembleStart?: number;
  device?: "laptop" | "phone";
  accentColor?: string;
  speed?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  brandLabel?: string;
  badges?: string[];
  metrics?: DeviceMetric[];
}

const FONT_FAMILY =
  "var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif";

function MockUI({
  accentColor,
  badges = [],
  brandLabel = "Event desk",
  metrics = [],
  subtitle = "Vegetarian menu planning, crew timing, and service notes in one review.",
  title = "Event planning board",
}: {
  accentColor: string;
  badges?: string[];
  brandLabel?: string;
  metrics?: DeviceMetric[];
  subtitle?: string;
  title?: string;
}) {
  const displayMetrics =
    metrics.length > 0
      ? metrics.slice(0, 3)
      : [
          { label: "Guests", value: "500+" },
          { label: "Menus", value: "Pure veg" },
          { label: "Timing", value: "Live" },
        ];
  const displayBadges =
    badges.length > 0
      ? badges.slice(0, 4)
      : ["Event brief", "Menu plan", "Dispatch", "Service crew"];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(145deg, var(--color-surface-dark), color-mix(in srgb, var(--color-primary-600) 78%, black))",
        color: "white",
        fontFamily: FONT_FAMILY,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.055)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 10,
          height: "12%",
          padding: "0 18px",
        }}
      >
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: "50%",
              height: 10,
              width: 10,
            }}
          />
        ))}
        <span
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            marginLeft: 10,
            textTransform: "uppercase",
          }}
        >
          {brandLabel}
        </span>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        <aside
          style={{
            background: "rgba(255,255,255,0.045)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 18,
            width: "25%",
          }}
        >
          {displayBadges.map((badge, index) => (
            <div
              key={badge}
              style={{
                background:
                  index === 0
                    ? `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 42%, transparent))`
                    : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: index === 0 ? "white" : "rgba(255,255,255,0.68)",
                fontSize: 12,
                fontWeight: 700,
                height: 36,
                lineHeight: "36px",
                overflow: "hidden",
                padding: "0 12px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </div>
          ))}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              flex: 1,
              marginTop: 10,
            }}
          />
        </aside>

        <main
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: 16,
            padding: 24,
          }}
        >
          <div>
            <div
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: 6,
                height: 18,
                width: "45%",
              }}
            />
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                lineHeight: 1.65,
                margin: "14px 0 0",
                maxWidth: "78%",
              }}
            >
              {title}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            {displayMetrics.map((metric, index) => (
              <div
                key={`${metric.label}-${metric.value}`}
                style={{
                  background:
                    index === 1
                      ? `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 24%, transparent), rgba(255,255,255,0.035))`
                      : "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
                  border:
                    index === 1
                      ? `1px solid color-mix(in srgb, ${accentColor} 55%, transparent)`
                      : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  minHeight: 92,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontSize: 21,
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  {metric.value}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.48)",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    marginTop: 10,
                    textTransform: "uppercase",
                  }}
                >
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              display: "grid",
              flex: 1,
              gap: 12,
              gridTemplateColumns: "1fr 0.7fr",
              minHeight: 0,
              padding: 14,
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.035))",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {[18, 38, 58, 78].map((top, index) => (
                <span
                  key={top}
                  style={{
                    background:
                      index === 2
                        ? accentColor
                        : "rgba(255,255,255,0.18)",
                    borderRadius: 6,
                    height: 10,
                    left: 18,
                    opacity: index === 2 ? 0.92 : 1,
                    position: "absolute",
                    top: `${top}%`,
                    width: `${58 - index * 7}%`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.58)",
                display: "flex",
                flexDirection: "column",
                fontSize: 12,
                gap: 10,
                justifyContent: "center",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function HeroDeviceAssemble({
  accentColor = "var(--color-secondary-500)",
  assembleStart = 0,
  badges,
  brandLabel,
  className,
  device = "laptop",
  metrics,
  speed = 1,
  subtitle,
  title,
}: HeroDeviceAssembleProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const assemble = spring({
    config: { damping: 12, mass: 1.4, stiffness: 90 },
    durationInFrames: 60,
    fps,
    frame: frame - assembleStart,
  });

  const lidZ = interpolate(assemble, [0, 1], [1000, 0]);
  const baseZ = interpolate(assemble, [0, 1], [-800, 0]);
  const bezelZ = interpolate(assemble, [0, 1], [600, 0]);
  const screenZ = interpolate(assemble, [0, 1], [300, 0]);

  const rotX = interpolate(assemble, [0, 1], [-22, 0]);
  const rotY = interpolate(assemble, [0, 1], [28, 0]);
  const layerOpacity = interpolate(assemble, [0, 0.4], [0.62, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const settleFrame = assembleStart + 45;
  const screenWake = interpolate(frame, [settleFrame, settleFrame + 18], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shimmerProgress = interpolate(
    frame,
    [settleFrame + 6, settleFrame + 30],
    [-1, 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const isPhone = device === "phone";
  const deviceW = isPhone ? 320 : 1040;
  const deviceH = isPhone ? 640 : 620;
  const screenInset = isPhone ? 12 : 18;
  const bezelRadius = isPhone ? 36 : 18;

  return (
    <div
      className={className}
      style={{
        alignItems: "center",
        background:
          "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-primary-500) 28%, transparent) 0%, var(--color-surface-dark) 72%)",
        display: "flex",
        fontFamily: FONT_FAMILY,
        inset: 0,
        justifyContent: "center",
        overflow: "hidden",
        perspective: 2000,
        position: "absolute",
      }}
    >
      <div
        style={{
          height: deviceH,
          position: "relative",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transformStyle: "preserve-3d",
          width: deviceW,
          willChange: "transform",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--color-surface-dark) 92%, white), var(--color-surface-dark))",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: bezelRadius + 4,
            boxShadow:
              "0 60px 120px rgba(16,24,25,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
            inset: 0,
            opacity: layerOpacity,
            position: "absolute",
            transform: `translateZ(${lidZ - 8}px)`,
          }}
        />

        {!isPhone ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-primary-700) 72%, white), var(--color-surface-dark))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0 0 12px 12px",
              bottom: -28,
              boxShadow: "0 30px 60px rgba(16,24,25,0.45)",
              height: 28,
              left: -40,
              opacity: layerOpacity,
              position: "absolute",
              right: -40,
              transform: `translateZ(${baseZ}px) rotateX(78deg)`,
              transformOrigin: "top center",
            }}
          />
        ) : null}

        <div
          style={{
            background: "color-mix(in srgb, var(--color-surface-dark) 82%, black)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: bezelRadius,
            boxShadow:
              "inset 0 0 0 2px rgba(255,255,255,0.04), 0 20px 60px rgba(16,24,25,0.45)",
            inset: 0,
            opacity: layerOpacity,
            position: "absolute",
            transform: `translateZ(${bezelZ}px)`,
          }}
        />

        <div
          style={{
            background: "var(--color-surface-dark)",
            borderRadius: bezelRadius - 6,
            inset: screenInset,
            opacity: layerOpacity,
            overflow: "hidden",
            position: "absolute",
            transform: `translateZ(${screenZ}px)`,
          }}
        >
          <div
            style={{
              background: "var(--color-surface-dark)",
              inset: 0,
              opacity: 1 - screenWake,
              position: "absolute",
            }}
          />
          <div style={{ inset: 0, opacity: screenWake, position: "absolute" }}>
            <MockUI
              accentColor={accentColor}
              badges={badges}
              brandLabel={brandLabel}
              metrics={metrics}
              subtitle={subtitle}
              title={title}
            />
          </div>
          <div
            style={{
              background:
                "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
              inset: 0,
              mixBlendMode: "screen",
              pointerEvents: "none",
              position: "absolute",
              transform: `translateX(${shimmerProgress * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Scene(props: HeroDeviceAssembleProps) {
  return <HeroDeviceAssemble {...props} />;
}

export function HeroDevicePlayer({
  className,
  ...props
}: HeroDeviceAssembleProps) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Player
        acknowledgeRemotionLicense
        autoPlay
        clickToPlay={false}
        component={Scene}
        compositionHeight={800}
        compositionWidth={1280}
        controls={false}
        durationInFrames={120}
        fps={30}
        initialFrame={70}
        initiallyMuted
        inputProps={props}
        loop
        numberOfSharedAudioTags={0}
        showVolumeControls={false}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
