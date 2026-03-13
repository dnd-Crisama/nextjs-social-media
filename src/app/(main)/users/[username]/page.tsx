import { validateRequest } from "@/auth";
import FollowButton from "@/components/FollowButton";
import FollowerCount from "@/components/FollowerCount";
import Linkify from "@/components/Linkify";
import TrendsSidebar from "@/components/TrendsSidebar";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import EditProfileButton from "./EditProfileButton";
import UserPosts from "./UserPosts";

interface PageProps {
  params: { username: string };
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) notFound();

  return user;
});

export async function generateMetadata({
  params: { username },
}: PageProps): Promise<Metadata> {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};

  const user = await getUser(username, loggedInUser.id);

  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

export default async function Page({ params: { username } }: PageProps) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const user = await getUser(username, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0">
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />
        <UserPosts userId={user.id} />
      </div>
      <TrendsSidebar />
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

async function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
  };

  return (
    <div className="w-full rounded-2xl bg-card shadow-sm mb-5">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-56 rounded-t-2xl overflow-hidden">
        {user.coverImageUrl ? (
          <img
            src={user.coverImageUrl}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="px-5 pb-5">
        {/* Avatar + Action buttons row */}
        <div className="flex items-end justify-between -mt-12 mb-3 relative z-10">
          <div className="ring-4 ring-card rounded-full shadow-md">
            <UserAvatar
              avatarUrl={user.avatarUrl}
              size={96}
              className="size-24 rounded-full"
            />
          </div>
          <div className="mt-14">
            {user.id === loggedInUserId ? (
              <EditProfileButton user={user} />
            ) : (
              <FollowButton userId={user.id} initialState={followerInfo} />
            )}
          </div>
        </div>

        {/* Name & username */}
        <div className="mb-2">
          <h1 className="text-xl font-bold leading-tight">{user.displayName}</h1>
          <div className="text-muted-foreground text-sm">@{user.username}</div>
        </div>

        {/* Bio */}
        {user.bio && (
          <Linkify>
            <p className="text-sm mb-3 whitespace-pre-line break-words leading-relaxed">
              {user.bio}
            </p>
          </Linkify>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm mb-4">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" />
            Member since {formatDate(user.createdAt, "MMMM yyyy")}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-5 text-sm">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-foreground">
              {formatNumber(user._count.posts)}
            </span>
            <span className="text-muted-foreground">Posts</span>
          </div>
          <FollowerCount userId={user.id} initialState={followerInfo} />
        </div>
      </div>

      {/* Posts tab bar */}
      <div className="border-t border-border">
        <div className="flex">
          <div className="flex-1 py-3 text-center text-sm font-semibold border-b-2 border-primary text-primary cursor-default">
          {user.displayName}&apos;s posts
          </div>
        </div>
      </div>
    </div>
  );
}