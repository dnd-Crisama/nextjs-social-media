"use client";

import FollowButton from "@/components/FollowButton";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import UserAvatar from "@/components/UserAvatar";
import useDebounce from "@/hooks/useDebounce";
import kyInstance from "@/lib/ky";
import { FollowerInfo, PostsPage, UserData } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText, Loader2, SearchX, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/(main)/SessionProvider";
import { useState } from "react";

interface SearchResultsProps {
  query: string;
  initialTab: "posts" | "users";
}

type Tab = "posts" | "users";

interface UsersPage {
  users: UserData[];
  nextCursor: string | null;
}

export default function SearchResults({ query, initialTab }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Sync tab to URL
  function switchTab(tab: Tab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", tab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  const debouncedQuery = useDebounce(query, 300);

  return (
    <div className="space-y-0 rounded-2xl bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        {query ? (
          <h1 className="text-xl font-bold line-clamp-1 break-all">
            Results for &ldquo;{query}&rdquo;
          </h1>
        ) : (
          <h1 className="text-xl font-bold text-muted-foreground">
            Search for posts or people
          </h1>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <TabButton
          active={activeTab === "posts"}
          icon={<FileText className="size-4" />}
          label="Posts"
          onClick={() => switchTab("posts")}
        />
        <TabButton
          active={activeTab === "users"}
          icon={<Users className="size-4" />}
          label="People"
          onClick={() => switchTab("users")}
        />
      </div>

      {/* Results */}
      <div className="p-5">
        {!debouncedQuery.trim() ? (
          <EmptyHint message="Type something to search." />
        ) : activeTab === "posts" ? (
          <PostResults query={debouncedQuery} />
        ) : (
          <UserResults query={debouncedQuery} />
        )}
      </div>
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors
        ${active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Post Results ─────────────────────────────────────────────────────────────

function PostResults({ query }: { query: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "search", "posts", query],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            type: "posts",
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") return <PostsLoadingSkeleton />;

  if (status === "error") {
    return <EmptyHint message="Something went wrong. Please try again." error />;
  }

  if (status === "success" && !posts.length) {
    return <EmptyHint message={`No posts found for "${query}".`} />;
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}

// ─── User Results ─────────────────────────────────────────────────────────────

function UserResults({ query }: { query: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["search", "users", query],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            type: "users",
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json<UsersPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  const users = data?.pages.flatMap((page) => page.users ?? []) || [];

  if (status === "pending") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return <EmptyHint message="Something went wrong. Please try again." error />;
  }

  if (status === "success" && !users.length) {
    return <EmptyHint message={`No people found for "${query}".`} />;
  }

  return (
    <InfiniteScrollContainer
      className="space-y-3"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user }: { user: UserData }) {
  const { user: loggedInUser } = useSession();
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(({ followerId }) => followerId === loggedInUser.id),
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl p-3 hover:bg-accent/50 transition-colors">
      <Link
        href={`/users/${user.username}`}
        className="flex items-center gap-3 min-w-0"
      >
        <UserAvatar avatarUrl={user.avatarUrl} size={44} />
        <div className="min-w-0">
          <p className="font-semibold truncate">{user.displayName}</p>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>
      <div className="shrink-0">
        <FollowButton userId={user.id} initialState={followerInfo} />
      </div>
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="size-11 rounded-full bg-muted shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Empty / Error hint ───────────────────────────────────────────────────────

function EmptyHint({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <SearchX className={`size-10 ${error ? "text-destructive" : "text-muted-foreground"}`} />
      <p className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {message}
      </p>
    </div>
  );
}