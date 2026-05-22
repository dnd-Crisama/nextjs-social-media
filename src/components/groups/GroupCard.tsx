"use client";

import { GroupData } from "@/lib/types";
import Link from "next/link";
import { Users } from "lucide-react";
import UserAvatar from "../UserAvatar";
import Image from "next/image";

interface GroupCardProps {
  group: GroupData;
}

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`} className="h-full">
  <div className="h-[263px] w-[300px] overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg w-64 flex-shrink-0 flex flex-col">
    <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/20 flex-shrink-0">
      {group.coverImageUrl && (
        <Image
          src={group.coverImageUrl}
          alt={group.name}
          fill
          className="object-cover"
        />
      )}
    </div>

    <div className="px-4 py-3 flex flex-1 flex-col">
      <div className="flex justify-start -mt-8 mb-1 relative z-10">
        <UserAvatar
          avatarUrl={group.avatarUrl}
          size={56}
          className="border-3 border-card flex-shrink-0"
        />
      </div>

      <h3 className="font-bold text-base text-foreground line-clamp-1">
        {group.name}
      </h3>

      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
        {group.description || ""}
      </p>

      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          <span>{group._count.members} Members</span>
        </div>

        {!group.isPublic && (
          <>
            <span>·</span>
            <span>Private</span>
          </>
        )}
      </div>
    </div>
  </div>
</Link>
  );
}
