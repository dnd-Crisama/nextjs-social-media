import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/generated/prisma";
import { Heart, MessageCircle, User2 } from "lucide-react";
import Link from "next/link";

interface NotificationProps {
  notification: NotificationData & { latestComment: string | null };
}

function truncate(text: string, wordLimit: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "…";
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { message: string; icon: JSX.Element; href: string; badgeColor: string }
  > = {
    FOLLOW: {
      message: "followed you",
      icon: <User2 className="size-3.5 text-primary-foreground" />,
      href: `/users/${notification.issuer.username}`,
      badgeColor: "bg-primary",
    },
    COMMENT: {
      message: "commented on your post",
      icon: <MessageCircle className="size-3.5 text-primary-foreground" />,
      href: `/posts/${notification.postId}`,
      badgeColor: "bg-sky-500",
    },
    LIKE: {
      message: "liked your post",
      icon: <Heart className="size-3.5 text-primary-foreground" />,
      href: `/posts/${notification.postId}`,
      badgeColor: "bg-rose-500",
    },
  };

  const { message, icon, href, badgeColor } =
    notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block group">
      <article
        className={cn(
          "relative flex gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm transition-all duration-200",
          "border border-border/40 hover:border-border hover:shadow-md",
          !notification.read && "border-l-[3px] border-l-primary bg-primary/5",
        )}
      >
        {/* Unread dot */}
        {!notification.read && (
          <span className="absolute right-4 top-4 size-2 rounded-full bg-primary" />
        )}

        {/* Badge icon (top-left, large) */}
        <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              badgeColor,
            )}
          >
            {icon}
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Avatar + name + action */}
          <div className="flex items-center gap-2.5">
            <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={40} />
            <p className="text-sm leading-snug">
              <span className="font-bold text-foreground">
                {notification.issuer.displayName}
              </span>{" "}
              <span className="text-muted-foreground">{message}</span>
            </p>
          </div>

          {/* COMMENT: post context + comment body */}
          {notification.type === "COMMENT" &&
            (notification.post || notification.latestComment) && (
              <div className="ml-0.5 rounded-xl border border-border/60 bg-muted/40 overflow-hidden">
                {/* Post context line */}
                {notification.post && (
                  <div className="flex items-baseline gap-1.5 border-b border-border/40 px-3 py-2">
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      From post:
                    </span>
                    <span className="text-xs text-muted-foreground/80 italic truncate">
                      {truncate(notification.post.content, 20)}
                    </span>
                  </div>
                )}
                {/* Their comment */}
                {notification.latestComment && (
                  <div className="px-3 py-2.5">
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3 whitespace-pre-line">
                      {notification.latestComment}
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* LIKE: just post preview */}
          {notification.type === "LIKE" && notification.post && (
            <div className="ml-0.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
              <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                {notification.post.content}
              </p>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}