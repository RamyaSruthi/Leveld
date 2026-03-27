"use client";

import { useState } from "react";
import { TopicRow } from "./topic-row";
import { AddTopicForm } from "./add-topic-form";
import type { PillarConfig, TopicWithProgress } from "@/lib/types";

interface Props {
  topics: TopicWithProgress[];
  userId: string;
  pillarSlug: string;
  pillars: PillarConfig[];
}

export function TopicList({ topics, userId, pillarSlug, pillars }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags from topics
  const allTags = Array.from(
    new Set(topics.map((t) => t.tag).filter((t): t is string => !!t))
  ).sort();

  const filteredTopics = activeTag
    ? topics.filter((t) => t.tag === activeTag)
    : topics;

  return (
    <>
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mr-1">
            Filter
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className={`
              font-mono text-[11px] px-2.5 py-1 rounded-full border transition-colors
              ${activeTag === null
                ? "bg-purple text-white border-purple"
                : "bg-surface border-line text-ink-muted hover:border-line-subtle hover:text-ink"
              }
            `}
          >
            All ({topics.length})
          </button>
          {allTags.map((tag) => {
            const count = topics.filter((t) => t.tag === tag).length;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`
                  font-mono text-[11px] px-2.5 py-1 rounded-full border transition-colors
                  ${activeTag === tag
                    ? "bg-purple text-white border-purple"
                    : "bg-surface border-line text-ink-muted hover:border-purple-border hover:text-purple"
                  }
                `}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Topic list */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        {filteredTopics.length === 0 ? (
          <div className="px-4 py-10 text-center">
            {activeTag ? (
              <>
                <p className="text-[13px] text-ink-dim mb-1">
                  No topics tagged &ldquo;{activeTag}&rdquo;
                </p>
                <button
                  onClick={() => setActiveTag(null)}
                  className="text-[12px] text-purple hover:underline"
                >
                  Clear filter
                </button>
              </>
            ) : (
              <>
                <p className="text-[13px] text-ink-dim mb-1">No topics yet</p>
                <p className="text-[12px] text-ink-muted">
                  Add your first topic below
                </p>
              </>
            )}
          </div>
        ) : (
          filteredTopics.map((t) => (
            <TopicRow
              key={t.id}
              topic={t}
              userId={userId}
              pillars={pillars}
              existingTags={allTags}
            />
          ))
        )}

        <AddTopicForm pillar={pillarSlug} userId={userId} existingTags={allTags} />
      </div>
    </>
  );
}
