import Image from "next/image";
import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-primitives";
import type { ResolvedContentPage } from "@/lib/content-pages";
import {
  Building2,
  CalendarDays,
  ChefHat,
  Clock3,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ParsedBlock =
  | { type: "h2" | "h3"; text: string; id: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; text: string };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseContent(content: string): ParsedBlock[] {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return { type: "p", text: "" } as ParsedBlock;
      }

      if (lines.length === 1 && lines[0].startsWith("### ")) {
        const text = lines[0].replace(/^###\s+/, "").trim();
        return { type: "h3", text, id: slugify(text) } as ParsedBlock;
      }

      if (lines.length === 1 && lines[0].startsWith("## ")) {
        const text = lines[0].replace(/^##\s+/, "").trim();
        return { type: "h2", text, id: slugify(text) } as ParsedBlock;
      }

      if (lines.every((line) => line.startsWith("- "))) {
        return {
          type: "ul",
          items: lines.map((line) => line.replace(/^- /, "").trim()),
        } as ParsedBlock;
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return {
          type: "ol",
          items: lines.map((line) => line.replace(/^\d+\.\s+/, "").trim()),
        } as ParsedBlock;
      }

      return {
        type: "p",
        text: lines.join(" "),
      } as ParsedBlock;
    })
    .filter((block) => !(block.type === "p" && !block.text));
}

export function CmsPage({
  eyebrow,
  page,
  variant = "default",
}: {
  eyebrow?: string;
  page: ResolvedContentPage;
  variant?: "default" | "story";
}) {
  const blocks = parseContent(page.content);
  const headings = blocks.filter(
    (block): block is Extract<ParsedBlock, { type: "h2" | "h3" }> =>
      block.type === "h2" || block.type === "h3",
  );

  if (variant === "story") {
    return <StoryCmsPage eyebrow={eyebrow} page={page} blocks={blocks} />;
  }

  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={page.title}
        description={page.metaDescription || ""}
      />

      <section className="section-padding bg-transparent">
        <div className="container-max">
          <div className={`grid gap-12 ${headings.length > 1 ? "lg:grid-cols-[280px_1fr]" : ""}`}>
            {headings.length > 1 && (
              <aside className="hidden lg:block">
                <nav className="site-panel sticky top-28 p-4">
                  <ul className="space-y-1">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={`block rounded-xl px-3 py-2 text-sm transition-all ${
                            heading.type === "h3"
                              ? "pl-6 text-text-tertiary hover:bg-black/[0.04] hover:text-text-primary"
                              : "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary"
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            <div className="site-panel p-6 lg:p-8">
              {page.updatedAt ? (
                <p className="mb-6 text-xs text-text-tertiary">
                  Last updated:{" "}
                  {new Date(page.updatedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              ) : null}
              <div className="space-y-6">
                {blocks.map((block, index) => {
                  if (block.type === "h2") {
                    return (
                      <h2
                        key={`${block.id}-${index}`}
                        id={block.id}
                        className="scroll-mt-28 text-2xl font-extrabold text-text-primary"
                      >
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "h3") {
                    return (
                      <h3
                        key={`${block.id}-${index}`}
                        id={block.id}
                        className="scroll-mt-28 text-lg font-bold text-text-primary"
                      >
                        {block.text}
                      </h3>
                    );
                  }

                  if (block.type === "ul") {
                    return (
                      <ul
                        key={`ul-${index}`}
                        className="list-disc space-y-2 pl-6 text-sm leading-8 text-text-secondary"
                      >
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    );
                  }

                  if (block.type === "ol") {
                    return (
                      <ol
                        key={`ol-${index}`}
                        className="list-decimal space-y-2 pl-6 text-sm leading-8 text-text-secondary"
                      >
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    );
                  }

                  if (block.type === "p") {
                    return (
                      <p key={`p-${index}`} className="text-sm leading-8 text-text-secondary">
                        {block.text}
                      </p>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function StoryCmsPage({
  blocks,
  eyebrow,
  page,
}: {
  blocks: ParsedBlock[];
  eyebrow?: string;
  page: ResolvedContentPage;
}) {
  const sections = buildStorySections(blocks);
  const intro =
    page.metaDescription ||
    sections.flatMap((section) => section.paragraphs).at(0) ||
    "A closer look at the people, standards, and operating rhythm behind the service.";
  const features = buildStoryFeatures(
    sections.length > 0
      ? sections
      : [
          {
            id: "about",
            title: page.title,
            paragraphs: [intro],
            items: [],
          },
        ],
  );
  const midpoint = Math.ceil(features.length / 2);
  const leftFeatures = features.slice(0, midpoint);
  const rightFeatures = features.slice(midpoint);
  const headingEyebrow = eyebrow || "Discover our story";

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-warm)] px-4 py-[clamp(5rem,8vw,7rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[12%] top-28 h-64 w-64 rounded-full bg-[var(--color-secondary-500)]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-[10%] h-72 w-72 rounded-full bg-[var(--color-primary-500)]/5 blur-3xl"
      />

      <div className="container-max relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="eyebrow justify-center">
            <Sparkles className="h-4 w-4" />
            {headingEyebrow}
          </span>
          <h1 className="mt-4 font-display text-[clamp(2.75rem,6vw,5rem)] font-normal leading-none tracking-[-0.02em] text-[var(--color-text-primary)]">
            {page.title}
          </h1>
          <div className="mt-6 h-[3px] w-24 rounded-full bg-[var(--color-secondary-500)]" />
          <p className="body-large mt-8 max-w-2xl text-pretty text-center">
            {intro}
          </p>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)_minmax(0,1fr)] lg:items-center xl:gap-16">
          <div className="space-y-12 lg:space-y-16">
            {leftFeatures.map((feature, index) => (
              <StoryFeatureCard
                key={feature.id}
                icon={storyIcons[index % storyIcons.length]}
                feature={feature}
              />
            ))}
          </div>

          <div className="order-first mx-auto w-full max-w-[440px] lg:order-none">
            <div className="relative">
              <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-[var(--color-primary-500)]/10" />
              <div className="absolute -left-8 bottom-10 h-28 w-28 rounded-full bg-[var(--color-secondary-500)]/10" />
              <div className="relative overflow-hidden rounded-lg border-[6px] border-[var(--color-primary-100)] bg-white shadow-[0_28px_80px_-45px_rgba(16,24,25,0.7)]">
                <div className="relative aspect-[4/5]">
                  <Image
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
                    alt={`${page.title} catering service`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 380px, 88vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-dark)]/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-12 lg:space-y-16">
            {rightFeatures.length > 0
              ? rightFeatures.map((feature, index) => (
                  <StoryFeatureCard
                    key={feature.id}
                    icon={storyIcons[(index + leftFeatures.length) % storyIcons.length]}
                    feature={feature}
                  />
                ))
              : leftFeatures.slice(0, 1).map((feature) => (
                  <StoryFeatureCard
                    key={`${feature.id}-summary`}
                    icon={<ShieldCheck className="h-6 w-6" />}
                    feature={feature}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type StoryContentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  items: string[];
};

type StoryFeature = {
  id: string;
  title: string;
  context?: string;
  description?: string;
};

const storyIcons = [
  <ChefHat className="h-6 w-6" />,
  <Leaf className="h-6 w-6" />,
  <Building2 className="h-6 w-6" />,
  <ShieldCheck className="h-6 w-6" />,
  <Clock3 className="h-6 w-6" />,
  <CalendarDays className="h-6 w-6" />,
  <MapPin className="h-6 w-6" />,
];

function buildStorySections(blocks: ParsedBlock[]): StoryContentSection[] {
  const sections: StoryContentSection[] = [];
  let current: StoryContentSection | null = null;

  for (const block of blocks) {
    if (block.type === "h2" || block.type === "h3") {
      current = {
        id: block.id,
        title: block.text,
        paragraphs: [],
        items: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = {
        id: "intro",
        title: "Our Story",
        paragraphs: [],
        items: [],
      };
      sections.push(current);
    }

    if (block.type === "p") {
      current.paragraphs.push(block.text);
    } else if (block.type === "ul" || block.type === "ol") {
      current.items.push(...block.items);
    }
  }

  return sections;
}

function buildStoryFeatures(sections: StoryContentSection[]): StoryFeature[] {
  return sections.flatMap((section) => {
    const sectionFeatures: StoryFeature[] = [];

    if (section.paragraphs.length > 0) {
      sectionFeatures.push({
        id: section.id,
        title: section.title,
        description: section.paragraphs.join(" "),
      });
    }

    section.items.forEach((item, index) => {
      sectionFeatures.push({
        id: `${section.id}-${index}`,
        title: item,
        context: section.title,
      });
    });

    return sectionFeatures;
  });
}

function StoryFeatureCard({
  feature,
  icon,
}: {
  icon: ReactNode;
  feature: StoryFeature;
}) {
  return (
    <article className="group min-w-0">
      <div className="mb-5 flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/55 text-[var(--color-secondary-600)] shadow-sm transition-colors duration-300 group-hover:bg-[var(--color-secondary-50)]">
          {icon}
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-[var(--color-primary-300)]" />
        </div>
        <div className="min-w-0">
          {feature.context ? (
            <p className="muted-label mb-1 text-[var(--color-secondary-600)]">
              {feature.context}
            </p>
          ) : null}
          <h2
            id={feature.id}
            className="text-h3 text-[clamp(1.2rem,1vw+1rem,1.6rem)] text-[var(--color-text-primary)]"
          >
            {feature.title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 pl-0 sm:pl-[4.5rem]">
        {feature.description ? (
          <p
            className="break-words text-[1rem] leading-8 text-[var(--color-text-secondary)]"
          >
            {feature.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
