"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_CATEGORIES } from "@/lib/types";
import type { Resource, ResourceCategory } from "@/lib/types";
import { addResource, deleteResource } from "@/app/resources/actions";

interface Props {
  resources: Resource[];
  userId: string;
  pillarSlug: string;
}

export function PillarResources({ resources, userId, pillarSlug }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("article");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setTitle("");
    setUrl("");
    setDescription("");
    setShowForm(false);
  }

  function handleAdd() {
    if (!title.trim()) return;
    startTransition(async () => {
      await addResource({
        userId,
        category,
        title: title.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        pillarSlug,
      });
      reset();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteResource({ id, userId, pillarSlug });
      router.refresh();
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">
          Resources {resources.length > 0 && `· ${resources.length}`}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-[11px] font-mono text-purple hover:opacity-75 transition-opacity"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface border border-line rounded-lg p-3 mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="h-7 px-2 rounded text-[11px] bg-base border border-line text-ink focus:outline-none focus:border-purple appearance-none cursor-pointer"
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
            className="w-full h-8 px-3 rounded-md text-[12px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            type="url"
            className="w-full h-8 px-3 rounded-md text-[12px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note (optional)"
            className="w-full h-8 px-3 rounded-md text-[12px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !title.trim()}
              className="px-3 py-1 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
            <button
              onClick={reset}
              className="px-2 py-1 text-[11px] text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resource list */}
      {resources.length === 0 && !showForm ? (
        <p className="text-[12px] text-ink-muted py-4">
          No resources yet for this pillar.
        </p>
      ) : (
        <div className="space-y-1.5">
          {resources.map((r) => {
            const catMeta = RESOURCE_CATEGORIES.find((c) => c.value === r.category);
            return (
              <div
                key={r.id}
                className="group flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-line bg-surface hover:border-line-subtle transition-colors"
              >
                <span className="text-[14px] mt-0.5 shrink-0">{catMeta?.icon ?? "📎"}</span>
                <div className="flex-1 min-w-0">
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-ink hover:text-purple transition-colors truncate block"
                    >
                      {r.title} <span className="text-[10px] text-ink-faint">↗</span>
                    </a>
                  ) : (
                    <span className="text-[13px] font-medium text-ink truncate block">
                      {r.title}
                    </span>
                  )}
                  {r.description && (
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-[10px] font-mono text-ink-muted hover:text-red-600 transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
