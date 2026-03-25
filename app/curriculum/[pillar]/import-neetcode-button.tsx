"use client";

import { useState, useTransition } from "react";
import { importNeetcode150 } from "./actions";

export function ImportNeetcodeButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "done" | "exists" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleImport() {
    startTransition(async () => {
      try {
        await importNeetcode150({ userId });
        setStatus("done");
        setTimeout(() => setStatus("idle"), 3000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("already imported")) {
          setStatus("exists");
          setTimeout(() => setStatus("idle"), 3000);
        } else {
          setErrorMsg(msg);
          setStatus("error");
        }
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleImport}
        disabled={isPending}
        className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-line text-ink-muted hover:border-ink-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Importing…"
          : status === "done"
          ? "Imported ✓"
          : status === "exists"
          ? "Already imported"
          : status === "error"
          ? "Import failed"
          : "Import Neetcode 150"}
      </button>
      {status === "error" && errorMsg && (
        <p className="font-mono text-[10px] text-red-500 max-w-[300px] text-right">{errorMsg}</p>
      )}
    </div>
  );
}
