"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareActionsProps = {
  title: string;
  text?: string;
  path?: string;
  className?: string;
  shareLabel?: string;
  copyLabel?: string;
};

function getShareUrl(path?: string) {
  if (typeof window === "undefined") return path ?? "";
  if (!path) return window.location.href;

  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function ShareActions({
  title,
  text,
  path,
  className,
  shareLabel = "Share",
  copyLabel = "Copy link",
}: ShareActionsProps) {
  const [copied, setCopied] = useState<"share" | "copy" | null>(null);

  async function markCopied(source: "share" | "copy") {
    setCopied(source);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function share() {
    const url = getShareUrl(path);
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyToClipboard(url);
    await markCopied("share");
  }

  async function copy() {
    await copyToClipboard(getShareUrl(path));
    await markCopied("copy");
  }

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap", className)}>
      <Button
        type="button"
        onClick={share}
        className="min-h-11 rounded-2xl border border-amber-200/25 bg-amber-200 text-black hover:bg-amber-100"
      >
        {copied === "share" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied === "share" ? "Link copied" : shareLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={copy}
        className="min-h-11 rounded-2xl border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]"
      >
        {copied === "copy" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied === "copy" ? "Copied" : copyLabel}
      </Button>
    </div>
  );
}
