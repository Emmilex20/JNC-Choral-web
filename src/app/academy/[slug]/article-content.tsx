import type { ReactNode } from "react";
import {
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Music2,
  Quote,
  Sparkles,
} from "lucide-react";

type ArticleBlock =
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "paragraph"; text: string; lead?: boolean }
  | { type: "quote"; text: string }
  | { type: "callout"; label: string; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "example"; text: string }
  | { type: "divider" };

const headingSignals =
  /^(why|how|what|when|where|conclusion|introduction|overview|summary|final|key|listening|matching|managing|building|developing|understanding|practice|practical|common|step|steps|benefits|examples|lesson|application|exercise|rehearsal|vocal|choral|music|rhythm|harmony|melody|diction|breath|tone)\b/i;

const smallWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function normalizeBlocks(body: string) {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripListMarker(line: string) {
  return line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "").trim();
}

function isListBlock(block: string) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((line) => /^([-*•]\s+|\d+[.)]\s+)/.test(line));
}

function isOrderedList(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .every((line) => /^\d+[.)]\s+/.test(line));
}

function looksTitleLike(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 9) return false;

  return words.every((word, index) => {
    const normalized = word.replace(/[^A-Za-z]/g, "");
    if (!normalized) return true;
    if (index > 0 && smallWords.has(normalized.toLowerCase())) return true;
    return /^[A-Z]/.test(normalized);
  });
}

function isSectionHeading(block: string, index: number, previous?: string) {
  const text = block.trim();
  if (text.includes("\n")) return false;
  if (index === 0) return false;
  if (previous?.trim().endsWith(":")) return false;
  if (/[.!?;:]$/.test(text)) return false;
  if (text.length < 3 || text.length > 86) return false;
  if (text.split(/\s+/).length > 9) return false;

  return headingSignals.test(text) || looksTitleLike(text);
}

function splitCapitalizedPhrases(text: string) {
  const matches = text.match(/[A-Z][A-Za-z]*(?:\s+(?:[a-z]+|[A-Z][A-Za-z]*)){0,3}(?=\s+[A-Z]|$)/g);
  return matches?.map((item) => item.trim()).filter((item) => item.length > 1) ?? [];
}

function parseArticleBody(body: string): ArticleBlock[] {
  const rawBlocks = normalizeBlocks(body);
  let hasLead = false;

  return rawBlocks.map((block, index) => {
    const previous = rawBlocks[index - 1];
    const markdownHeading = block.match(/^(#{2,3})\s+(.+)$/);

    if (/^---+$/.test(block)) return { type: "divider" };

    if (markdownHeading) {
      return {
        type: "heading",
        text: markdownHeading[2].trim(),
        level: markdownHeading[1].length === 2 ? 2 : 3,
      };
    }

    if (isSectionHeading(block, index, previous)) {
      return { type: "heading", text: block, level: 2 };
    }

    if (block.startsWith(">")) {
      return {
        type: "quote",
        text: block.replace(/^>\s?/gm, "").trim(),
      };
    }

    const callout = block.match(/^(Note|Tip|Key idea|Practice|Remember):\s+(.+)$/i);
    if (callout) {
      return {
        type: "callout",
        label: callout[1],
        text: callout[2],
      };
    }

    if (isListBlock(block)) {
      return {
        type: "list",
        ordered: isOrderedList(block),
        items: block
          .split("\n")
          .map(stripListMarker)
          .filter(Boolean),
      };
    }

    if (previous?.trim().endsWith(":")) {
      const phraseItems = splitCapitalizedPhrases(block);
      if (phraseItems.length >= 3) {
        return { type: "list", ordered: false, items: phraseItems };
      }

      return { type: "example", text: block };
    }

    const lead = !hasLead;
    hasLead = true;
    return { type: "paragraph", text: block, lead };
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="italic text-amber-50">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function HeadingBlock({
  text,
  level,
  index,
}: {
  text: string;
  level: 2 | 3;
  index: number;
}) {
  const className =
    level === 2
      ? "text-3xl font-semibold tracking-tight text-white md:text-4xl"
      : "text-2xl font-semibold tracking-tight text-white";

  return (
    <section className={index === 0 ? "" : "pt-4"}>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-10 bg-amber-200/70" />
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/62">
          Section
        </span>
      </div>
      {level === 2 ? (
        <h2 className={className}>{text}</h2>
      ) : (
        <h3 className={className}>{text}</h3>
      )}
    </section>
  );
}

function ListBlock({ items, ordered }: { items: string[]; ordered: boolean }) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag className="grid gap-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border border-white/10 bg-black/24 p-4 text-base leading-7 text-white/72"
        >
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10 text-xs font-semibold text-amber-50">
            {ordered ? index + 1 : <CheckCircle2 className="h-3.5 w-3.5" />}
          </span>
          <span>{renderInline(item)}</span>
        </li>
      ))}
    </ListTag>
  );
}

function Frame({
  children,
  icon,
  tone = "gold",
}: {
  children: ReactNode;
  icon: ReactNode;
  tone?: "gold" | "cyan";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-200/16 bg-cyan-200/[0.055]"
      : "border-amber-200/16 bg-amber-200/[0.06]";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-amber-100">
          {icon}
        </span>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function RichArticleContent({ body }: { body: string }) {
  const blocks = parseArticleBody(body);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.032))] shadow-[0_26px_80px_rgba(0,0,0,0.25)]">
      <div className="border-b border-white/10 bg-black/20 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-amber-100">
              <BookIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
                Academy Lesson
              </p>
              <p className="mt-1 text-sm text-white/62">
                Structured for reading, rehearsal notes, and quick review.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/68">
            <ListChecks className="h-3.5 w-3.5 text-amber-100" />
            Rich reading mode
          </span>
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-9">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <HeadingBlock
                key={`${block.text}-${index}`}
                text={block.text}
                level={block.level}
                index={index}
              />
            );
          }

          if (block.type === "list") {
            return (
              <ListBlock
                key={`${block.items.join("-")}-${index}`}
                items={block.items}
                ordered={block.ordered}
              />
            );
          }

          if (block.type === "quote") {
            return (
              <Frame key={`${block.text}-${index}`} icon={<Quote className="h-5 w-5" />}>
                <blockquote className="text-xl font-medium leading-9 text-white">
                  {renderInline(block.text)}
                </blockquote>
              </Frame>
            );
          }

          if (block.type === "callout") {
            return (
              <Frame
                key={`${block.label}-${block.text}-${index}`}
                icon={<Lightbulb className="h-5 w-5" />}
                tone="cyan"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/72">
                  {block.label}
                </p>
                <p className="mt-2 text-base leading-8 text-white/74">
                  {renderInline(block.text)}
                </p>
              </Frame>
            );
          }

          if (block.type === "example") {
            return (
              <Frame key={`${block.text}-${index}`} icon={<Music2 className="h-5 w-5" />}>
                <p className="text-xl font-semibold leading-9 text-amber-50">
                  {renderInline(block.text)}
                </p>
              </Frame>
            );
          }

          if (block.type === "divider") {
            return <hr key={`divider-${index}`} className="border-white/10" />;
          }

          return (
            <p
              key={`${block.text}-${index}`}
              className={
                block.lead
                  ? "rounded-[1.5rem] border border-amber-200/14 bg-amber-200/[0.055] p-5 text-xl leading-9 text-white md:text-2xl md:leading-10"
                  : "text-lg leading-9 text-white/76"
              }
            >
              {renderInline(block.text)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function BookIcon() {
  return <Sparkles className="h-5 w-5" />;
}
