"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface FollowerCountProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowerCount({
  userId,
  initialState,
}: FollowerCountProps) {
  const { data } = useFollowerInfo(userId, initialState);

  return (
    <div className="flex items-baseline gap-1">
      <span className="font-bold text-foreground">{formatNumber(data.followers)}</span>
      <span className="text-muted-foreground">Followers</span>
    </div>
  );
}