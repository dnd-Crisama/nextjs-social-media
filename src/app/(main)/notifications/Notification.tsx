import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/generated/prisma";
import { AtSign, CheckCircle, Heart, MessageCircle, User2, UserPlus, XCircle, AlertOctagon } from "lucide-react";
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
    NotificationType | "MODERATION",
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
    MENTION: {
      message: "mentioned you in a comment",
      icon: <AtSign className="size-3.5 text-primary-foreground" />,
      href: `/posts/${notification.postId}`,
      badgeColor: "bg-violet-500",
    },
    GROUP_JOIN_REQUEST: {
      message: "requested to join your group",
      icon: <UserPlus className="size-3.5 text-primary-foreground" />,
      href: `/groups/${(notification as any).groupId}`,
      badgeColor: "bg-blue-500",
    },
    GROUP_JOIN_APPROVED: {
      message: "approved your group join request",
      icon: <CheckCircle className="size-3.5 text-primary-foreground" />,
      href: `/groups/${(notification as any).groupId}`,
      badgeColor: "bg-emerald-500",
    },
    GROUP_JOIN_REJECTED: {
      message: "rejected your group join request",
      icon: <XCircle className="size-3.5 text-primary-foreground" />,
      href: `/groups`,
      badgeColor: "bg-red-500",
    },
    MODERATION: {
      message: "Your content violated community guidelines and was removed.",
      icon: <AlertOctagon className="size-3.5 text-primary-foreground" />,
      href: "#",
      badgeColor: "bg-destructive",
    },
  };

  const notifConfig = notificationTypeMap[notification.type as keyof typeof notificationTypeMap];
  if (!notifConfig) return null;

  const { message, icon, href, badgeColor } = notifConfig;
  const isModeration = notification.type === "MODERATION";

  // Lấy nội dung hiển thị cho vi phạm: Ưu tiên latestComment (nội dung lưu tạm) 
  // sau đó mới đến notification.post.content (nếu có)
  const offendingContent = notification.latestComment || notification.post?.content;

  return (
    <Link 
      href={href} 
      className={cn("block group", isModeration && "cursor-default pointer-events-none")}
    >
      <article
        className={cn(
          "relative flex gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm transition-all duration-200",
          "border border-border/40 hover:border-border hover:shadow-md",
          !notification.read && "border-l-[3px] border-l-primary bg-primary/5",
          isModeration && "bg-destructive/5 border-destructive/20"
        )}
      >
        {!notification.read && (
          <span className="absolute right-4 top-4 size-2 rounded-full bg-primary" />
        )}

        <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
          <div className={cn("flex size-8 items-center justify-center rounded-full", badgeColor)}>
            {icon}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <UserAvatar 
              avatarUrl={notification.issuer.avatarUrl} 
              size={40} 
              frame={(notification.issuer as any).avatarFrame} 
            />
            <div className="flex flex-col">
              <p className="text-sm leading-snug">
                {isModeration ? (
                  <span className="font-bold text-destructive">System Security</span>
                ) : (
                  <span className="font-bold text-foreground">{notification.issuer.displayName}</span>
                )}
                {" "}
                <span className={cn("text-muted-foreground", isModeration && "text-destructive/80")}>
                  {message}
                </span>
              </p>
            </div>
          </div>

          {/* ── FIX: HIỂN THỊ NỘI DUNG VI PHẠM (Dành cho MODERATION) ── */}
          {isModeration && offendingContent && (
            <div className="ml-0.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-1 opacity-70">
                Offending Content:
              </p>
              <p className="text-sm text-destructive/90 italic leading-relaxed line-clamp-3 whitespace-pre-line">
                "{truncate(offendingContent, 25)}"
              </p>
            </div>
          )}

          {/* COMMENT / MENTION: Dùng logic cũ nhưng đảm bảo scannable */}
          {!isModeration && (notification.type === "COMMENT" || notification.type === "MENTION") &&
            (notification.post || notification.latestComment) && (
              <div className="ml-0.5 rounded-xl border border-border/60 bg-muted/40 overflow-hidden">
                {notification.post && (
                  <div className="flex items-baseline gap-1.5 border-b border-border/40 px-3 py-2 bg-muted/20">
                    <span className="shrink-0 text-[10px] font-bold text-muted-foreground uppercase">From post:</span>
                    <span className="text-xs text-muted-foreground/80 italic truncate">
                      {truncate(notification.post.content, 20)}
                    </span>
                  </div>
                )}
                {notification.latestComment && (
                  <div className="px-3 py-2.5">
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3 whitespace-pre-line">
                      {notification.latestComment}
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* LIKE: Logic cũ */}
          {!isModeration && notification.type === "LIKE" && notification.post && (
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