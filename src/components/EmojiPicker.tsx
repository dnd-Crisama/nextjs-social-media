"use client";

import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";
import { useRef, useState } from "react";

export const EMOJI_GROUPS = [
  {
    label: "😀",
    emojis: [
      "😀","😂","💀","😊","😍","🤩","😎","🥳","😅","😆",
      "🤣","😇","🙂","😉","😋","😜","🤔","🤗","😴","😤",
      "😠","😢","😭","😱","🥺","😏","😒","🙄","😬","🤯",
    ],
  },
  {
    label: "👍",
    emojis: [
      "👍","👎","👏","🙌","🤝","🤜","👊","✌️","🤞","🖐️",
      "🤙","💪","🙏","👋","🫶","❤️","🔥","💯","✨","🎉",
      "🎊","💀","👀","💬","💭",
    ],
  },
  {
    label: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
      "🦁","🐮","🐷","🐸","🐵","🦋","🐝","🐠","🦄","🐲",
    ],
  },
  {
    label: "🍕",
    emojis: [
      "🍕","🍔","🍟","🌭","🍿","🧂","🥞","🧇","🍩","🍪",
      "🎂","🍫","🍬","🍭","🍦","🥤","🧃","☕","🍵","🧋",
    ],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  // Optional: control button appearance
  buttonClassName?: string;
}

export default function EmojiPicker({
  onEmojiSelect,
  buttonClassName,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);

  function handleSelect(emoji: string) {
    onEmojiSelect(emoji);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Emoji"
        className={cn(
          "flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
          buttonClassName,
        )}
      >
        <SmilePlus className="size-5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full right-0 z-50 mb-2 w-72 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Category tabs */}
            <div className="flex border-b border-border">
              {EMOJI_GROUPS.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setActiveGroup(i)}
                  className={cn(
                    "flex-1 py-1.5 text-base transition-colors",
                    activeGroup === i ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
              {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="flex items-center justify-center rounded p-1 text-lg hover:bg-accent transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}