import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { Bookmark, Home, Users } from "lucide-react";
import Link from "next/link";
import MessagesButton from "./MessagesButton";
import NotificationsButton from "./NotificationsButton";
import UserAvatar from "@/components/UserAvatar";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();

  if (!user) return null;

  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 mb-2 rounded-lg px-2 py-2 hover:bg-accent transition-colors"
        asChild
      >
        <Link href={`/users/${user.username}`}>
          <UserAvatar avatarUrl={user.avatarUrl} size={40} />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {user.displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              @{user.username}
            </span>
          </div>
        </Link>
      </Button>
      <div className="my-2 border-b border-border"></div>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Home"
        asChild
      >
        <Link href="/">
          <Home />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>
      <NotificationsButton
        initialState={{ unreadCount: unreadNotificationsCount }}
      />
      <MessagesButton initialState={{ unreadCount: unreadMessagesCount }} />
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark />
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Groups"
        asChild
      >
        <Link href="/groups">
          <Users />
          <span className="hidden lg:inline">Groups</span>
        </Link>
      </Button>
    </div>
  );
}