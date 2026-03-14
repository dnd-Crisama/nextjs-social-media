"use client";

import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import GroupCard from "@/components/groups/GroupCard";
import kyInstance from "@/lib/ky";
import { GroupsPage } from "@/lib/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { useState, useEffect } from "react";

function MyGroupsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<GroupsPage>({
    queryKey: ["groups", "my-groups"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/groups/my-groups",
          pageParam ? { searchParams: { cursor: pageParam as string } } : {}
        )
        .json<GroupsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    staleTime: 0,
  });

  const groups = data?.pages.flatMap((page) => page.groups) || [];

  if (status === "pending") {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "success" && groups.length === 0 && !hasNextPage) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-muted-foreground">
          You haven't joined any groups yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Explore groups and join communities that interest you!
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="py-8 text-center text-destructive">
        Failed to load groups. Please try again.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="grid gap-3 grid-cols-1 sm:grid-cols-2"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
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
  );
}

export default function MyGroupsPage() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["groups", "my-groups"] });
    setReady(true);
  }, [queryClient]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground">Groups you've joined</p>
        </div>
        <CreateGroupDialog />
      </div>

      {ready && <MyGroupsList />}
    </div>
  );
}