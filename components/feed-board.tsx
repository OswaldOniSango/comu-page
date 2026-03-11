"use client";

import { useMemo, useState } from "react";

import { PostCard } from "@/components/post-card";
import type { Locale, Post, PostKind } from "@/lib/types";

type Props = {
  locale: Locale;
  posts: Post[];
};

export function FeedBoard({ locale, posts }: Props) {
  const [filter, setFilter] = useState<"all" | PostKind>("all");
  const filtered = useMemo(() => {
    if (filter === "all") {
      return posts;
    }
    return posts.filter((post) => post.kind === filter);
  }, [filter, posts]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {["all", "news", "announcement", "recap"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option as "all" | PostKind)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${
              filter === option
                ? "bg-gold text-ink"
                : "border border-white/10 bg-white/5 text-white/65"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((post) => (
          <PostCard key={post.id} locale={locale} post={post} />
        ))}
      </div>
    </div>
  );
}
