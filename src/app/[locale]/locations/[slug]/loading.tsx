export default function LocationDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="page-section">
        <div className="container-max">
          <div className="skeleton h-8 w-32 rounded mb-4" />
          <div className="skeleton h-14 w-3/4 rounded mb-6" />
          <div className="skeleton h-6 w-1/2 rounded mb-12" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
