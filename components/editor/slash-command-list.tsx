"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: any; range: any }) => void;
}

interface Props {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<any, Props>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-white border border-line rounded-lg shadow-lg w-60 py-1.5 px-2">
        <p className="text-[12px] text-ink-muted">No results</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-lg shadow-lg w-60 py-1 overflow-hidden">
      <p className="text-[10px] font-mono text-ink-muted uppercase tracking-widest px-3 pt-2 pb-1">
        Blocks
      </p>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          className={`
            w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors
            ${selectedIndex === index ? "bg-hover" : "hover:bg-hover"}
          `}
        >
          <span className="w-7 h-7 flex items-center justify-center rounded bg-surface border border-line text-[13px] shrink-0">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-ink font-medium leading-tight">{item.title}</p>
            <p className="text-[11px] text-ink-muted leading-tight truncate">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
