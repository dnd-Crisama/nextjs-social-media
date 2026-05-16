import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import DailyQuests from "./DailyQuests";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none md:block lg:w-80">
      {/* max-h = viewport - navbar height - page padding. overflow-y-auto makes it scrollable */}
      <div
        className="flex max-h-[calc(100vh-5.25rem-2.5rem)] flex-col gap-5 overflow-y-auto pb-5 pr-1"
        style={{ scrollbarWidth: "none" }}
      >
        <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
          <WhoToFollow />
          <DailyQuests />
          <TrendingTopics />
        </Suspense>
      </div>
    </div>
  );
}

async function WhoToFollow() {
  const { user } = await validateRequest();

  if (!user) return null;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
      followers: {
        none: {
          followerId: user.id,
        },
      },
      isBanned: false,
    },
    select: getUserDataSelect(user.id),
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {usersToFollow.map((userToFollow) => (
        <div key={userToFollow.id} className="flex items-center gap-3">
          <Link
            href={`/users/${userToFollow.username}`}
            className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
          >
            <UserAvatar avatarUrl={userToFollow.avatarUrl} className="flex-none" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 break-all font-semibold hover:underline">
                {userToFollow.displayName}
              </p>
              <p className="line-clamp-1 break-all text-muted-foreground">
                @{userToFollow.username}
              </p>
            </div>
          </Link>
          <div className="flex-none">
            <FollowButton
              userId={userToFollow.id}
              initialState={{
                followers: userToFollow._count.followers,
                isFollowedByUser: userToFollow.followers.some(
                  ({ followerId }) => followerId === user.id, 
                ),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
            SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
            FROM posts
            GROUP BY (hashtag)
            ORDER BY count DESC, hashtag ASC
            LIMIT 5
        `;

    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Trending topics</div>
      {trendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];

        return (
          <Link key={title} href={`/hashtag/${title}`} className="block">
            <p
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(count)} {count === 1 ? "post" : "posts"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
