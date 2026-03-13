"use client";

import { PostData } from "@/lib/types";
import { Loader2, SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "../EmojiPicker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSubmitCommentMutation } from "./mutations";

interface CommentInputProps {
  post: PostData;
  parentId?: string;       // nếu có → đây là reply input
  replyTo?: string;        // @username được pre-fill
  onCancel?: () => void;   // callback để ẩn input khi huỷ reply
  autoFocus?: boolean;
}

export default function CommentInput({
  post,
  parentId,
  replyTo,
  onCancel,
  autoFocus,
}: CommentInputProps) {
  const [input, setInput] = useState(replyTo ? `@${replyTo} ` : "");
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useSubmitCommentMutation(post.id);

  // Focus và đặt cursor sau @mention khi mở reply
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    mutation.mutate(
      { post, content: input.trim(), parentId },
      {
        onSuccess: () => {
          setInput("");
          onCancel?.(); // tự đóng reply input sau khi gửi
        },
      },
    );
  }

  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={onSubmit}
    >
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          placeholder={parentId ? `Reply...` : "Write a comment..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus={autoFocus}
          className="pr-9"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <EmojiPicker
            onEmojiSelect={(emoji) => setInput((prev) => prev + emoji)}
            buttonClassName="p-0.5"
          />
        </div>
      </div>

      {/* Nút huỷ reply */}
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      )}

      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={!input.trim() || mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <SendHorizonal />
        )}
      </Button>
    </form>
  );
}