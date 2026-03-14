"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { GroupsPage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function GroupsMenu() {
  const { data: joinedGroups } = useQuery({
    queryKey: ["groups", "my-groups-sidebar"],
    queryFn: async () => {
      try {
        const response = await kyInstance
          .get("/api/groups/my-groups?limit=5")
          .json<GroupsPage>();
        return response.groups;
      } catch {
        return [];
      }
    },
  });

  if (!joinedGroups || joinedGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 px-4 py-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-muted-foreground flex-1">
          My Groups
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          title="View all groups"
          asChild
        >
          <Link href="/groups/my-groups">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-1">
        {joinedGroups && joinedGroups.map((group) => (
          <Button
            key={group.id}
            variant="ghost"
            className="w-full justify-start gap-2 h-10"
            asChild
          >
            <Link href={`/groups/${group.id}`}>
              <UserAvatar avatarUrl={group.avatarUrl} size={24} />
              <span className="truncate text-sm flex-1 text-left">{group.name}</span>
            </Link>
          </Button>
        ))}
      </div>
      {joinedGroups.length > 0 && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-xs"
          asChild
        >
          <Link href="/groups">
            <Users className="h-4 w-4" />
            Explore Groups
          </Link>
        </Button>
      )}
    </div>
  );
}
