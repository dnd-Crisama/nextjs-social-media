"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function BalanceDisplay() {
  const { data: balance } = useQuery({
    queryKey: ["userBalance"],
    queryFn: async () => {
      const res = await fetch("/api/user-balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
  });

  return (
    <Link
      href="/explore-frames"
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
    >
      <span className="text-lg">⭐</span>
      <span className="font-semibold text-sm">{balance?.pointsBalance || 0}</span>
    </Link>
  );
}
