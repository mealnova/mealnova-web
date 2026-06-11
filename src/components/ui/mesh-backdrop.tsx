/**
 * Layered emerald gradient-mesh + film-grain backdrop (pure CSS, zero images).
 * tone="light"  → cream surface with soft emerald glows (page heros)
 * tone="dark"   → deep forest surface with luminous emerald mesh (dark bands)
 */
export function MeshBackdrop({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className={
          tone === "dark"
            ? "absolute -inset-[6%] mesh-emerald-dark mesh-drift"
            : "absolute -inset-[6%] mesh-emerald mesh-drift bg-[var(--color-surface)]"
        }
      />
      <div className={tone === "dark" ? "grain-overlay grain-overlay-strong" : "grain-overlay"} />
    </div>
  );
}
