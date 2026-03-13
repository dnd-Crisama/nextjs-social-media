"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { FollowerInfo, UserData } from "@/lib/types";
import Link from "next/link";
import { PropsWithChildren } from "react";
import FollowButton from "./FollowButton";
import FollowerCount from "./FollowerCount";
import Linkify from "./Linkify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import UserAvatar from "./UserAvatar";

interface UserTooltipProps extends PropsWithChildren {
  user: UserData;
}

export default function UserTooltip({ children, user }: UserTooltipProps) {
  const { user: loggedInUser } = useSession();

  const followerState: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: !!user.followers.some(
      ({ followerId }) => followerId === loggedInUser.id,
    ),
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="p-0 overflow-hidden">
          <div className="flex w-80 flex-col break-words">
            {/* Cover image */}
            <div className="relative h-28 w-full">
              {user.coverImageUrl ? (
                <img
                  src={user.coverImageUrl}
                  alt="Cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/60" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 px-4 pb-4">
              {/* Avatar + Follow button row */}
              <div className="flex items-end justify-between gap-2 -mt-8 relative z-10">
                <Link href={`/users/${user.username}`}>
                  <div className="ring-2 ring-card rounded-full">
                    <UserAvatar size={80} avatarUrl={user.avatarUrl} />
                  </div>
                </Link>
                {loggedInUser.id !== user.id && (
                  <FollowButton userId={user.id} initialState={followerState} />
                )}
              </div>

              {/* Name & username */}
              <div>
                <Link href={`/users/${user.username}`}>
                  <div className="text-lg font-semibold hover:underline">
                    {user.displayName}
                  </div>
                  <div className="text-muted-foreground">@{user.username}</div>
                </Link>
              </div>

              {/* Bio */}
              {user.bio && (
                <Linkify>
                  <div className="line-clamp-4 whitespace-pre-line text-sm">
                    {user.bio}
                  </div>
                </Linkify>
              )}

              {/* Follower count */}
              <FollowerCount userId={user.id} initialState={followerState} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}