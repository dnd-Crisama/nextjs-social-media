"use client";

import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import GroupCard from "@/components/groups/GroupCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import kyInstance from "@/lib/ky";
import type { GroupsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<"trending" | "search">("trending");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["groups", activeTab, searchQuery],
    queryFn: ({ pageParam }) => {
      const params: any = {};
      if (pageParam) params.cursor = pageParam;
      if (activeTab === "search" && searchQuery) {
        params.query = searchQuery;
      } else if (activeTab === "trending") {
        params.sort = "trending";
      }

      return kyInstance
        .get("/api/groups", { searchParams: params })
        .json<GroupsPage>();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || null,
  });

  const groups = data?.pages.flatMap((page) => page.groups) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">
            Join communities to share and discover posts
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-4">
          {status === "pending" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {status === "success" && groups.length === 0 && !hasNextPage && (
            <p className="py-8 text-center text-muted-foreground">
              No groups found yet. Create one to get started!
            </p>
          )}

          {status === "error" && (
            <p className="py-8 text-center text-destructive">
              Failed to load groups. Please try again.
            </p>
          )}

          {groups.length > 0 && (
            <InfiniteScrollContainer
              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-start"
              onBottomReached={() =>
                hasNextPage && !isFetching && fetchNextPage()
              }
            >
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </InfiniteScrollContainer>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery && (
            <>
              {status === "pending" && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {status === "success" && groups.length === 0 && !hasNextPage && (
                <p className="py-8 text-center text-muted-foreground">
                  No groups found matching "{searchQuery}"
                </p>
              )}

              {status === "error" && (
                <p className="py-8 text-center text-destructive">
                  Failed to search groups. Please try again.
                </p>
              )}

              {groups.length > 0 && (
                <InfiniteScrollContainer
                  className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                  onBottomReached={() =>
                    hasNextPage && !isFetching && fetchNextPage()
                  }
                >
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                  {isFetchingNextPage && (
                    <div className="col-span-full flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </InfiniteScrollContainer>
              )}
            </>
          )}

          {!searchQuery && (
            <p className="py-8 text-center text-muted-foreground">
              Enter a search term to find groups
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
