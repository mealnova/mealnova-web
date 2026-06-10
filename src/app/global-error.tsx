"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#f4f0e9",
          color: "#101819",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontWeight: 400, fontSize: "1.8rem" }}>Something went wrong</h1>
          <p style={{ color: "#475359" }}>
            The page hit an unexpected error. Your data is safe.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#245945",
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "0.7rem 1.6rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
