"use client";

import Image from "next/image";
import { GroupData } from "@/lib/types";
import { Users, Lock } from "lucide-react";
import UserAvatar from "../UserAvatar";

interface GroupHeaderProps {
  group: GroupData;
}

export default function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      {group.coverImageUrl && (
            <div className="relative h-96 w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={group.coverImageUrl}
            alt={group.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Group Info */}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-end gap-3">
            <UserAvatar avatarUrl={group.avatarUrl} className="h-16 w-16" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">
                {group.name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group._count.members} members</span>
                {!group.isPublic && (
                  <>
                    <span>·</span>
                    <Lock className="h-4 w-4" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {group.description && (
          <p className="text-foreground">{group.description}</p>
        )}
      </div>
    </div>
  );
}
