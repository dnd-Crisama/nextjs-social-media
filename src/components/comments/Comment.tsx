"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { CommentData, PostData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import CommentInput from "./CommentInput";
import CommentMoreButton from "./CommentMoreButton";

interface CommentProps {
  comment: CommentData;
  post: PostData;
  depth?: number;
}

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9_-]+$/.test(part) ? (
      <Link
        key={i}
        href={`/users/${part.slice(1)}`}
        className="font-semibold text-primary hover:underline"
      >
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function Comment({ comment, post, depth = 0 }: CommentProps) {
  const { user } = useSession();
  const [showReplyInput, setShowReplyInput] = useState(false);

  const canReply = depth < 2;

  return (
    <div className={depth > 0 ? "ml-10 border-l-2 border-border/40 pl-3" : ""}>
      <div className="group/comment flex gap-3 py-2">
        {/* Avatar */}
        <span className="hidden sm:inline shrink-0">
              <UserTooltip user={comment.user}>
                <Link href={`/users/${comment.user.username}`}>
                  <UserAvatar
                    avatarUrl={comment.user.avatarUrl}
                    size={depth === 0 ? 36 : 28}
                    frame={comment.user.avatarFrame}
                  />
                </Link>
              </UserTooltip>
        </span>

        {/* Bubble + actions cùng hàng */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {/* Bubble */}
            <div className="inline-block max-w-full rounded-2xl bg-muted px-3 py-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <UserTooltip user={comment.user}>
                  <Link
                    href={`/users/${comment.user.username}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {comment.user.displayName}
                  </Link>
                </UserTooltip>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed break-words">
                {renderContent(comment.content)}
              </p>
            </div>

            {/* Reply + More — bên phải bubble, hiện khi hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0">
              {canReply && (
                <button
                  type="button"
                  onClick={() => setShowReplyInput((v) => !v)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded"
                >
                  Reply
                </button>
              )}
              {comment.user.id === user.id && (
                <CommentMoreButton comment={comment} className="" />
              )}
            </div>
          </div>

          {showReplyInput && (
            <div className="mt-1.5">
              <CommentInput
                post={post}
                parentId={comment.id}
                replyTo={comment.user.username}
                onCancel={() => setShowReplyInput(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              post={post}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}