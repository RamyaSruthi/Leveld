"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_CATEGORIES } from "@/lib/types";
import type { Resource, ResourceCategory, PillarConfig } from "@/lib/types";
import { addResource, deleteResource } from "./actions";

interface Props {
  resources: Resource[];
  userId: string;
  pillars: PillarConfig[];
}

export function ResourcesList({ resources, userId, pillars }: Props) {
  const pillarMap = Object.fromEntries(pillars.map((p) => [p.slug, p]));
  const [activeTab, setActiveTab] = useState<ResourceCategory>("book");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [formCategory, setFormCategory] = useState<ResourceCategory>("book");
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
        category: formCategory,
        title: title.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
      });
      reset();
      setActiveTab(formCategory);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteResource({ id, userId });
      router.refresh();
    });
  }

  const filtered = resources.filter((r) => r.category === activeTab);
  const activeMeta = RESOURCE_CATEGORIES.find((c) => c.value === activeTab)!;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-line">
        {RESOURCE_CATEGORIES.map((cat) => {
          const count = resources.filter((r) => r.category === cat.value).length;
          const isActive = activeTab === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveTab(cat.value)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors
                border-b-2 -mb-px
                ${isActive
                  ? "border-purple text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
                }
              `}
            >
              <span>{cat.icon}</span>
              {cat.label}
              {count > 0 && (
                <span className="font-mono text-[10px] text-ink-faint ml-1">{count}</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => {
            setFormCategory(activeTab);
            setShowForm(true);
          }}
          className="ml-auto text-[12px] font-medium text-purple hover:opacity-75 transition-opacity mb-1"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface border border-line rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-[12px] font-medium text-ink">
              Add {RESOURCE_CATEGORIES.find((c) => c.value === formCategory)?.label.slice(0, -1) ?? "resource"}
            </p>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as ResourceCategory)}
              className="ml-auto h-7 px-2 rounded text-[12px] bg-base border border-line text-ink focus:outline-none focus:border-purple appearance-none cursor-pointer"
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
            className="w-full h-9 px-3 rounded-md text-[13px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={formCategory === "repo" ? "https://github.com/…" : "https://…"}
            type="url"
            className="w-full h-9 px-3 rounded-md text-[13px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note (optional)"
            className="w-full h-9 px-3 rounded-md text-[13px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={isPending || !title.trim()}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium bg-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resource list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[28px] mb-2">{activeMeta.icon}</p>
          <p className="text-[13px] text-ink-muted">
            No {activeMeta.label.toLowerCase()} yet. Click <span className="text-purple font-medium">+ Add</span> to save one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="group flex items-start gap-3 p-4 rounded-lg border border-line bg-surface hover:border-line-subtle transition-colors"
            >
              <span className="text-[18px] mt-0.5 shrink-0">{activeMeta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-medium text-ink hover:text-purple transition-colors truncate"
                    >
                      {r.title} <span className="text-[11px] text-ink-faint">↗</span>
                    </a>
                  ) : (
                    <span className="text-[14px] font-medium text-ink truncate">
                      {r.title}
                    </span>
                  )}
                </div>
                {r.pillar_slug && pillarMap[r.pillar_slug] && (
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border mt-1"
                    style={{
                      borderColor: pillarMap[r.pillar_slug].color + "40",
                      color: pillarMap[r.pillar_slug].color,
                      backgroundColor: pillarMap[r.pillar_slug].color + "10",
                    }}
                  >
                    {pillarMap[r.pillar_slug].label}
                  </span>
                )}
                {r.description && (
                  <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 shrink-0 text-[10px] font-mono text-ink-muted hover:text-red-600 transition-all disabled:opacity-50 mt-1"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
