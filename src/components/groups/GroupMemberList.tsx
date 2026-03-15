"use client";

import { GroupDetail } from "@/lib/types";
import { useSession } from "@/app/(main)/SessionProvider";
import {
  approveGroupMember,
  rejectGroupMember,
  removeGroupMember,
} from "@/app/(main)/groups/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Trash2, Check, X } from "lucide-react";
import UserAvatar from "../UserAvatar";
import Link from "next/link";

interface GroupMemberListProps {
  group: GroupDetail;
}

export default function GroupMemberList({ group }: GroupMemberListProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = group.userId === user?.id;

  const approvedMembers = group.members.filter((m) => m.status === "APPROVED");
  const pendingMembers = group.members.filter((m) => m.status === "PENDING");

  const { mutate: approveUser, isPending: isApprovePending } = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      approveGroupMember(group.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    },
  });

  const { mutate: rejectUser, isPending: isRejectPending } = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      rejectGroupMember(group.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    },
  });

  const { mutate: removeMember, isPending: isRemovePending } = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      removeGroupMember(group.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Approved Members */}
      <div>
        <h3 className="mb-3 font-semibold">Members ({approvedMembers.length})</h3>
        <div className="space-y-2">
          {approvedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
                <Link
                  href={`/users/${member.user.username}`}
                  className="flex flex-1 items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                >
                <UserAvatar avatarUrl={member.user.avatarUrl} frame={member.user.avatarFrame} />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {member.user.displayName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{member.user.username}
                  </div>
                </div>
              </Link>

              {member.userId === group.userId && (
                <div className="flex items-center gap-1 ml-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              )}

              {isAdmin && member.userId !== group.userId && member.userId !== user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember({ userId: member.userId })}
                  disabled={isRemovePending}
                  className="ml-2"
                >
                  {isRemovePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Join Requests */}
      {isAdmin && pendingMembers.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">
            Join Requests ({pendingMembers.length})
          </h3>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                  <Link
                    href={`/users/${member.user.username}`}
                    className="flex flex-1 items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar avatarUrl={member.user.avatarUrl} frame={member.user.avatarFrame} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {member.user.displayName}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      @{member.user.username}
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => approveUser({ userId: member.userId })}
                    disabled={isApprovePending}
                  >
                    {isApprovePending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rejectUser({ userId: member.userId })}
                    disabled={isRejectPending}
                  >
                    {isRejectPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvedMembers.length === 0 && pendingMembers.length === 0 && (
        <p className="text-center text-muted-foreground">No members yet</p>
      )}
    </div>
  );
}
