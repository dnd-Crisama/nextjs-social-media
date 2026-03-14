"use client";

import { Button } from "@/components/ui/button";
import {
  requestJoinGroup,
  leaveGroup,
} from "@/app/(main)/groups/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Plus } from "lucide-react";
import kyInstance from "@/lib/ky";
import { useSession } from "@/app/(main)/SessionProvider";

interface GroupMemberInfo {
  isMember: boolean;
  status: "PENDING" | "APPROVED" | null;
  isAdmin: boolean;
}

interface JoinGroupButtonProps {
  groupId: string;
  creatorId: string;
}

export default function JoinGroupButton({
  groupId,
  creatorId,
}: JoinGroupButtonProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: memberInfo } = useQuery<GroupMemberInfo>({
    queryKey: ["group-member", groupId, user?.id],
    queryFn: async () => {
      try {
        const response = await kyInstance
          .get(`/api/groups/${groupId}/member-info`)
          .json<GroupMemberInfo>();
        return response;
      } catch {
        return {
          isMember: false,
          status: null,
          isAdmin: false,
        };
      }
    },
  });

  const { mutate: requestJoin, isPending: isJoinPending } = useMutation({
    mutationFn: () => requestJoinGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group-member", groupId, user?.id],
      });
    },
  });

  const { mutate: leave, isPending: isLeavePending } = useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group-member", groupId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-feed"],
      });
    },
  });

  if (!memberInfo) {
    return (
      <Button disabled size="sm">
        <Loader2 className="h-4 w-4" />
      </Button>
    );
  }

  const isAdmin = creatorId === user?.id;

  if (!memberInfo.isMember && !isAdmin) {
    if (memberInfo.status === "PENDING") {
      return (
        <Button disabled size="sm" variant="outline">
          Pending
        </Button>
      );
    }

    return (
      <Button
        onClick={() => requestJoin()}
        disabled={isJoinPending}
        size="sm"
        className="gap-2"
      >
        {isJoinPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Join
      </Button>
    );
  }

  if (memberInfo.isMember && !isAdmin) {
    return (
      <Button
        onClick={() => leave()}
        disabled={isLeavePending}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        {isLeavePending && <Loader2 className="h-4 w-4 animate-spin" />}
        <LogOut className="h-4 w-4" />
        Leave
      </Button>
    );
  }

  if (isAdmin) {
    return (
      <Button disabled size="sm" variant="secondary">
        Admin
      </Button>
    );
  }

  return null;
}
