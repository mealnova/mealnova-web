type PreviewBannerProps = {
  routePath: string;
};

export function PreviewBanner({ routePath }: PreviewBannerProps) {
  return (
    <div className="border-b border-sky-200 bg-sky-50/95 px-4 py-3 text-sm text-sky-950">
      <div className="container-max flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold">Preview mode is active</div>
          <div className="text-sky-900/80">
            Reviewing draft content for <span className="font-mono">{routePath}</span>
          </div>
        </div>
        <form action="/api/preview/exit" method="post">
          <button
            type="submit"
            className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-100"
          >
            Exit Preview
          </button>
        </form>
      </div>
    </div>
  );
}
