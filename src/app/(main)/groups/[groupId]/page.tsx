"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/app/(main)/SessionProvider";
import { Loader2 } from "lucide-react";
import GroupHeader from "@/components/groups/GroupHeader";
import GroupSettings from "@/components/groups/GroupSettings";
import GroupMemberList from "@/components/groups/GroupMemberList";
import JoinGroupButton from "@/components/groups/JoinGroupButton";
import InviteButton from "@/components/groups/InviteButton";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { getGroupDetails } from "@/app/(main)/groups/actions";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";

interface PageProps {
  params: {
    groupId: string;
  };
}

export default function GroupPage({ params }: PageProps) {
  const { user } = useSession();

  // Fetch group details
  const { data: group, status: groupStatus } = useQuery({
    queryKey: ["group", params.groupId],
    queryFn: () => getGroupDetails(params.groupId),
  });

  // Fetch group posts
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status: postsStatus,
  } = useInfiniteQuery({
    queryKey: ["group-feed", params.groupId],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          `/api/groups/${params.groupId}/feed`,
          pageParam ? { searchParams: { cursor: pageParam } } : {}
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || null,
  });

  const posts = postsData?.pages.flatMap((page) => page.posts) || [];
  const isAdmin = group && group.userId === user?.id;

  if (groupStatus === "pending") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (groupStatus === "error" || !group) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-destructive">Group Not Found</h2>
        <p className="text-muted-foreground">
          This group doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <GroupHeader group={group} />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <JoinGroupButton groupId={group.id} creatorId={group.userId} />
        {isAdmin && (
          <>
            <InviteButton groupId={group.id} />
            <GroupSettings group={group} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Posts</h2>

          {postsStatus === "pending" && <PostsLoadingSkeleton />}

          {postsStatus === "success" && posts.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No posts yet. Be the first to post!
            </p>
          )}

          {postsStatus === "error" && (
            <p className="py-8 text-center text-destructive">
              Failed to load posts. Please try again.
            </p>
          )}

          {posts.length > 0 && (
            <InfiniteScrollContainer
              className="space-y-5"
              onBottomReached={() =>
                hasNextPage && !isFetching && fetchNextPage()
              }
            >
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </InfiniteScrollContainer>
          )}
        </div>

        {/* Sidebar - Members */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto">
          <div className="rounded-lg border border-border bg-card p-4">
            <GroupMemberList group={group} />
          </div>
        </div>
      </div>
    </div>
  );
}
