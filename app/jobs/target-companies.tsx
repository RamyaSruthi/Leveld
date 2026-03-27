"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTargetCompanies } from "./actions";

interface Props {
  userId: string;
  companies: string[];
}

export function TargetCompanies({ userId, companies: initial }: Props) {
  const [companies, setCompanies] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  function addCompany() {
    const name = input.trim();
    if (!name || companies.includes(name)) {
      setInput("");
      return;
    }
    const updated = [...companies, name];
    setCompanies(updated);
    setInput("");
    setShowInput(false);
    startTransition(async () => {
      await updateTargetCompanies({ userId, companies: updated });
      router.refresh();
    });
  }

  function removeCompany(name: string) {
    const updated = companies.filter((c) => c !== name);
    setCompanies(updated);
    startTransition(async () => {
      await updateTargetCompanies({ userId, companies: updated });
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompany();
    }
    if (e.key === "Escape") {
      setInput("");
      setShowInput(false);
    }
  }

  return (
    <div className="bg-surface rounded-lg border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <p className="font-mono text-[11px] text-ink-muted uppercase tracking-widest">
          Target Companies
        </p>
        <button
          onClick={() => setShowInput(true)}
          className="font-mono text-[11px] text-purple hover:opacity-75 transition-opacity"
        >
          + Add
        </button>
      </div>

      <div className="px-4 py-3">
        {companies.length === 0 && !showInput ? (
          <p className="text-[12px] text-ink-faint text-center py-3">
            No target companies yet
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <span
                key={c}
                className="group flex items-center gap-1.5 font-mono text-[11px] px-3 py-1 rounded-full bg-base border border-line text-ink-dim"
              >
                {c}
                <button
                  onClick={() => removeCompany(c)}
                  disabled={isPending}
                  className="text-ink-faint hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {showInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Google, Amazon…"
              className="
                flex-1 h-8 px-3 rounded-md text-[12px]
                bg-base border border-line text-ink
                placeholder:text-ink-faint
                focus:outline-none focus:border-purple
              "
            />
            <button
              onClick={addCompany}
              disabled={isPending || !input.trim()}
              className="px-3 py-1 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => { setShowInput(false); setInput(""); }}
              className="text-[11px] text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
