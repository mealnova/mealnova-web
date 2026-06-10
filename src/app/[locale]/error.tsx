"use client";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="page-section">
      <div className="container-max" style={{ textAlign: "center" }}>
        <p className="eyebrow">Temporary issue</p>
        <h1 className="section-title">We couldn&apos;t load this page</h1>
        <p className="body-large" style={{ margin: "0.75rem auto 1.5rem" }}>
          Please try again in a moment — the rest of the site is still available.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center rounded-full px-6 py-3 text-white"
          style={{ background: "var(--color-primary-500)" }}
        >
          Try again
        </button>
      </div>
    </section>
  );
}
