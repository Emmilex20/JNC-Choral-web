import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

/** "Home / Music Hub / Quizzes" trail so visitors always know where they are. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="border-b border-white/10 bg-black/40">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-2.5 text-xs text-white/60 md:px-6">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {crumb.href && !last ? (
                <Link href={crumb.href} className="hover:text-white hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-white/90" : undefined}>
                  {crumb.label}
                </span>
              )}
              {last ? null : <ChevronRight className="h-3 w-3 text-white/30" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
