"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTopic } from "./actions";
import { DSA_TAGS, DSA_ROADMAPS } from "@/lib/types";

export function AddTopicForm({
  pillar,
  userId,
  existingTags,
}: {
  pillar: string;
  userId: string;
  existingTags?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [roadmap, setRoadmap] = useState("");
  const [topicType, setTopicType] = useState<string>("coding_problem");
  const [isCompanySpecific, setIsCompanySpecific] = useState(false);
  const [company, setCompany] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDsa = pillar === "dsa";

  function reset() {
    setTitle("");
    setDescription("");
    setTag("");
    setRoadmap("");
    setTopicType("coding_problem");
    setIsCompanySpecific(false);
    setCompany("");
    setSourceUrl("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTopic({
        pillar,
        userId,
        title: title.trim(),
        description: description.trim(),
        tag: tag.trim() || undefined,
        ...(isDsa && {
          roadmap: roadmap || undefined,
          topic_type: topicType || undefined,
          is_company_specific: isCompanySpecific,
          company: isCompanySpecific ? company.trim() : undefined,
          source_url: sourceUrl.trim() || undefined,
        }),
      });
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="
          w-full flex items-center gap-2 px-4 py-3
          text-[12px] text-ink-muted hover:text-ink
          hover:bg-hover transition-colors
        "
      >
        <span className="text-[16px] leading-none font-light">+</span>
        Add {isDsa ? "question" : "topic"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 border-t border-line bg-base space-y-3">

      {/* Title */}
      <div>
        <label className="block text-[11px] font-mono text-ink-muted mb-1">
          {isDsa ? "Question title" : "Topic title"} *
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isDsa ? "e.g. Two Sum, Longest Palindrome…" : "e.g. Scalability Fundamentals…"}
          className="
            w-full h-9 px-3 rounded-md text-[13px]
            bg-surface border border-line text-ink
            placeholder:text-ink-faint
            focus:outline-none focus:border-line-subtle
          "
        />
      </div>

      {/* Topic type — DSA only */}
      {isDsa && (
        <div>
          <label className="block text-[11px] font-mono text-ink-muted mb-1">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTopicType("coding_problem")}
              className={`
                flex-1 h-9 rounded-md text-[12px] font-mono border transition-colors
                ${topicType === "coding_problem"
                  ? "bg-purple text-white border-purple"
                  : "bg-surface border-line text-ink-muted hover:border-line-subtle"
                }
              `}
            >
              💻 Coding Problem
            </button>
            <button
              type="button"
              onClick={() => setTopicType("concept")}
              className={`
                flex-1 h-9 rounded-md text-[12px] font-mono border transition-colors
                ${topicType === "concept"
                  ? "bg-purple text-white border-purple"
                  : "bg-surface border-line text-ink-muted hover:border-line-subtle"
                }
              `}
            >
              📖 Concept
            </button>
          </div>
        </div>
      )}

      {/* Tag — available for ALL pillars */}
      <div>
        <label className="block text-[11px] font-mono text-ink-muted mb-1">
          Tag
        </label>
        {isDsa ? (
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="
              w-full h-9 px-3 rounded-md text-[13px]
              bg-surface border border-line text-ink
              focus:outline-none focus:border-line-subtle
              appearance-none cursor-pointer
            "
          >
            <option value="">Select tag…</option>
            {DSA_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Kafka, React, Spring Boot…"
              list="existing-tags"
              className="
                w-full h-9 px-3 rounded-md text-[13px]
                bg-surface border border-line text-ink
                placeholder:text-ink-faint
                focus:outline-none focus:border-line-subtle
              "
            />
            {existingTags && existingTags.length > 0 && (
              <datalist id="existing-tags">
                {existingTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </>
        )}
      </div>

      {/* DSA-specific fields */}
      {isDsa && (
        <>
          <div>
            <label className="block text-[11px] font-mono text-ink-muted mb-1">
              Roadmap
            </label>
            <select
              value={roadmap}
              onChange={(e) => setRoadmap(e.target.value)}
              className="
                w-full h-9 px-3 rounded-md text-[13px]
                bg-surface border border-line text-ink
                focus:outline-none focus:border-line-subtle
                appearance-none cursor-pointer
              "
            >
              <option value="">Select roadmap…</option>
              {DSA_ROADMAPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Company specific */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <div
                onClick={() => setIsCompanySpecific(!isCompanySpecific)}
                className={`
                  w-4 h-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors
                  ${isCompanySpecific ? "bg-purple border-purple" : "border-line-subtle bg-surface"}
                `}
              >
                {isCompanySpecific && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-[12px] text-ink-dim">Company-specific question</span>
            </label>

            {isCompanySpecific && (
              <input
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Amazon, Flipkart…"
                className="
                  mt-2 w-full h-9 px-3 rounded-md text-[13px]
                  bg-surface border border-line text-ink
                  placeholder:text-ink-faint
                  focus:outline-none focus:border-line-subtle
                "
              />
            )}
          </div>

          {/* Problem link */}
          <div>
            <label className="block text-[11px] font-mono text-ink-muted mb-1">
              Problem link (optional)
            </label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/…"
              type="url"
              className="
                w-full h-9 px-3 rounded-md text-[13px]
                bg-surface border border-line text-ink
                placeholder:text-ink-faint
                focus:outline-none focus:border-line-subtle
              "
            />
          </div>
        </>
      )}

      {/* Description (non-DSA only) */}
      {!isDsa && (
        <div>
          <label className="block text-[11px] font-mono text-ink-muted mb-1">
            Description (optional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description…"
            className="
              w-full h-9 px-3 rounded-md text-[13px]
              bg-surface border border-line text-ink
              placeholder:text-ink-faint
              focus:outline-none focus:border-line-subtle
            "
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="
            px-4 py-1.5 rounded-md text-[12px] font-medium
            bg-purple text-white
            disabled:opacity-50 hover:opacity-90 transition-opacity
          "
        >
          {isPending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); }}
          className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
