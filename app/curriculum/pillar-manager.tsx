"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PillarConfig } from "@/lib/types";
import { renamePillar, updatePillarColor, addPillar, deletePillar } from "./pillar-actions";

const PRESET_COLORS = [
  "#6c5ce7", "#0984e3", "#00b894", "#e17055",
  "#fdcb6e", "#a29bfe", "#fd79a8", "#636e72",
  "#2d3436", "#d63031", "#e84393", "#00cec9",
];

interface Props {
  pillars: PillarConfig[];
  userId: string;
}

export function PillarManager({ pillars, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6c5ce7");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(p: PillarConfig) {
    setEditingId(p.id);
    setEditLabel(p.label);
    setEditColor(p.color);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditColor("");
    setError(null);
  }

  function saveEdit(p: PillarConfig) {
    if (!editLabel.trim()) return;
    startTransition(async () => {
      setError(null);
      try {
        if (editLabel.trim() !== p.label) {
          await renamePillar({ pillarId: p.id, userId, newLabel: editLabel.trim() });
        }
        if (editColor !== p.color) {
          await updatePillarColor({ pillarId: p.id, userId, color: editColor });
        }
        cancelEdit();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      setError(null);
      try {
        await addPillar({ userId, label: newLabel.trim(), color: newColor });
        setNewLabel("");
        setNewColor("#6c5ce7");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  function handleDelete(p: PillarConfig) {
    if (!confirm(`Delete "${p.label}"? Topics must be moved first.`)) return;
    startTransition(async () => {
      setError(null);
      try {
        await deletePillar({ pillarId: p.id, userId, slug: p.slug });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
      >
        Edit pillars
      </button>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-ink">Manage Pillars</p>
        <button
          onClick={() => { setOpen(false); cancelEdit(); }}
          className="text-[11px] text-ink-muted hover:text-ink transition-colors"
        >
          Done
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}

      {/* Existing pillars */}
      <div className="space-y-1.5">
        {pillars.map((p) => (
          <div key={p.id}>
            {editingId === p.id ? (
              <div className="flex items-center gap-2 bg-base rounded-md p-2 border border-line">
                {/* Color picker */}
                <div className="relative shrink-0">
                  <span
                    className="block w-5 h-5 rounded-full border border-line cursor-pointer"
                    style={{ backgroundColor: editColor }}
                    onClick={() => {
                      const next = PRESET_COLORS[(PRESET_COLORS.indexOf(editColor) + 1) % PRESET_COLORS.length];
                      setEditColor(next);
                    }}
                    title="Click to cycle colors"
                  />
                </div>
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(p);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 h-7 px-2 rounded text-[13px] bg-surface border border-line text-ink focus:outline-none focus:border-purple"
                />
                <button
                  onClick={() => saveEdit(p)}
                  disabled={isPending}
                  className="text-[11px] font-mono text-purple hover:opacity-75 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-[11px] font-mono text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-hover transition-colors group">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="flex-1 text-[13px] text-ink">{p.label}</span>
                <button
                  onClick={() => startEdit(p)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-ink-muted hover:text-ink transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-ink-muted hover:text-red-600 transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new pillar */}
      <div className="flex items-center gap-2 pt-2 border-t border-line">
        <span
          className="block w-5 h-5 rounded-full border border-line cursor-pointer shrink-0"
          style={{ backgroundColor: newColor }}
          onClick={() => {
            const next = PRESET_COLORS[(PRESET_COLORS.indexOf(newColor) + 1) % PRESET_COLORS.length];
            setNewColor(next);
          }}
          title="Click to cycle colors"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="New pillar name…"
          className="flex-1 h-8 px-2 rounded text-[13px] bg-base border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newLabel.trim()}
          className="text-[11px] font-mono px-3 py-1.5 rounded-md bg-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Adding…" : "+ Add"}
        </button>
      </div>
    </div>
  );
}
