"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Button } from "./ui/button";
import {
  Loader2, Check, CalendarCheck, PenSquare, ThumbsUp,
  MessageSquare, Star, Trophy, Flame, Clock, Sparkles, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ActivityType = "DAILY_CHECKIN" | "CREATE_POST" | "LIKE_POST" | "COMMENT_POST";

type Quest = {
  activityType: ActivityType;
  label: string;
  spointReward: number;
  completed: boolean;
  claimed?: boolean;
};

const QUEST_META: Record<ActivityType, {
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}> = {
  DAILY_CHECKIN: {
    icon: <CalendarCheck className="size-5" />,
    description: "Log in and check in today",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  CREATE_POST: {
    icon: <PenSquare className="size-5" />,
    description: "Share something with your followers",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10 border-sky-500/20",
  },
  LIKE_POST: {
    icon: <ThumbsUp className="size-5" />,
    description: "React to someone's post",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/20",
  },
  COMMENT_POST: {
    icon: <MessageSquare className="size-5" />,
    description: "Leave a comment on any post",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/20",
  },
};

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

export default function DailyQuests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const countdown = useCountdown();

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["daily-quests"],
    queryFn: async (): Promise<Quest[]> => {
      const res = await kyInstance
        .get("/api/quests/daily")
        .json<{ quests: Quest[] }>();
      return res.quests;
    },
    refetchOnWindowFocus: false,
    // Cache 5 phút — không fetch lại mỗi lần navigate
    staleTime: 5 * 60 * 1000,
    // Giữ data cũ trong khi refetch (không flash loading)
    placeholderData: (prev) => prev,
  });

  // ✅ ALL hooks must be declared before any early return
  const claimMutation = useMutation({
    mutationFn: async (activityType: ActivityType) =>
      kyInstance.post("/api/quests/claim", { json: { activityType } }).json(),
    onMutate: async (activityType) => {
      await queryClient.cancelQueries({ queryKey: ["daily-quests"] });
      await queryClient.cancelQueries({ queryKey: ["userBalance"] });
      const previousQuests = queryClient.getQueryData<Quest[]>(["daily-quests"]);
      const previousBalance = queryClient.getQueryData<any>(["userBalance"]);
      const reward =
        previousQuests?.find((q) => q.activityType === activityType)
          ?.spointReward ?? 0;
      queryClient.setQueryData<Quest[]>(["daily-quests"], (old) =>
        old?.map((q) =>
          q.activityType === activityType ? { ...q, claimed: true } : q,
        ),
      );
      queryClient.setQueryData(["userBalance"], (old: any) => ({
        ...(old ?? {}),
        pointsBalance: (old?.pointsBalance ?? 0) + reward,
      }));
      return { previousQuests, previousBalance };
    },
    onSuccess: () => {
      toast({ description: "🎉 Reward claimed! SPoints added." });
      queryClient.invalidateQueries({ queryKey: ["daily-quests"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
    },
    onError: (err: any, _vars, context: any) => {
      queryClient.setQueryData(["daily-quests"], context?.previousQuests);
      queryClient.setQueryData(["userBalance"], context?.previousBalance);
      toast({ variant: "destructive", description: err?.message || "Failed to claim" });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (activityType: ActivityType) =>
      kyInstance
        .post("/api/spoint/daily-quests", { json: { activityType } })
        .json<{ ok?: boolean; earnedPoints?: number }>(),
    onMutate: async (activityType) => {
      await queryClient.cancelQueries({ queryKey: ["daily-quests"] });
      await queryClient.cancelQueries({ queryKey: ["userBalance"] });
      const previous = queryClient.getQueryData<Quest[]>(["daily-quests"]);
      const previousBalance = queryClient.getQueryData<any>(["userBalance"]);
      const reward =
        previous?.find((q) => q.activityType === activityType)?.spointReward ?? 0;
      queryClient.setQueryData<Quest[]>(["daily-quests"], (old) =>
        old?.map((q) =>
          q.activityType === activityType
            ? { ...q, completed: true, claimed: true }
            : q,
        ),
      );
      queryClient.setQueryData(["userBalance"], (old: any) => ({
        ...(old ?? {}),
        pointsBalance: (old?.pointsBalance ?? 0) + reward,
      }));
      return { previous, previousBalance };
    },
    onError: (err: any, _vars, context: any) => {
      queryClient.setQueryData(["daily-quests"], context?.previous);
      queryClient.setQueryData(["userBalance"], context?.previousBalance);
      toast({ variant: "destructive", description: err?.message || "Check-in failed" });
    },
    onSuccess: (res) => {
      toast({ description: `✅ Checked in! +${res?.earnedPoints ?? 0} SPoints earned.` });
      queryClient.invalidateQueries({ queryKey: ["daily-quests"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
    },
  });

  // Derived state — computed AFTER all hooks
  const allQuests = data ?? [];
  const pendingQuests = allQuests.filter((q) => !q.claimed);
  const allDone = allQuests.length > 0 && pendingQuests.length === 0;

  // ✅ Early return AFTER all hooks
  if (!isFetching && allDone) return null;

  const claimedCount = allQuests.filter((q) => q.claimed).length;
  const totalReward = allQuests.reduce((s, q) => s + q.spointReward, 0);
  const earnedReward = allQuests.filter((q) => q.claimed).reduce((s, q) => s + q.spointReward, 0);
  const progressPct = allQuests.length > 0 ? (claimedCount / allQuests.length) * 100 : 0;
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10">
            <Trophy className="size-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">Daily Quests</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Resets in</p>
          </div>
        </div>
        {/* Countdown */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums">
          <Clock className="size-3 text-muted-foreground" />
          <span className={cn(
            "transition-colors",
            countdown.startsWith("00:") ? "text-rose-500" : "text-foreground",
          )}>
            {countdown || "··:··:··"}
          </span>
        </div>
      </div>

      {/* Overall progress */}
      {!isFetching && allQuests.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {claimedCount}/{allQuests.length} claimed
            </span>
            <span className="font-semibold text-primary">
              {earnedReward}/{totalReward}{" "}
              <span className="text-muted-foreground font-normal">SP</span>
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
            {progressPct > 0 && progressPct < 100 && (
              <div
                className="absolute inset-y-0 w-8 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ left: `${progressPct}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Quest list — chỉ hiện quest chưa claimed */}
      {isLoading ? (
        // Skeleton — chỉ hiện lần đầu chưa có data
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 animate-pulse">
              <div className="size-9 shrink-0 rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2.5 w-36 rounded bg-muted" />
                <div className="h-1 w-full rounded-full bg-muted" />
              </div>
              <div className="h-6 w-14 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      ) : pendingQuests.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : (
        <div className="space-y-2">
          {pendingQuests.map((q) => {
            const meta = QUEST_META[q.activityType];
            const isCheckin = q.activityType === "DAILY_CHECKIN";
            const isCheckinPending =
              checkinMutation.isPending &&
              checkinMutation.variables === q.activityType;
            const isClaimPending =
              claimMutation.isPending &&
              claimMutation.variables === q.activityType;

            return (
              <div
                key={q.activityType}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                  q.completed
                    ? "border-primary/20 bg-primary/5"
                    : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all",
                    meta.bgColor,
                    meta.color,
                  )}
                >
                  {meta.icon}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold leading-none">
                    {q.label}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {meta.description}
                  </p>
                  {/* Mini progress bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        q.completed ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                      style={{ width: q.completed ? "100%" : "0%" }}
                    />
                  </div>
                </div>

                {/* Reward + action */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    <Star className="size-2.5 fill-current" />
                    {q.spointReward}
                  </div>

                  {isCheckin && !q.completed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 rounded-lg px-2 text-xs"
                      onClick={() => checkinMutation.mutate(q.activityType)}
                      disabled={isCheckinPending}
                    >
                      {isCheckinPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Check in"
                      )}
                    </Button>
                  ) : q.completed ? (
                    <Button
                      size="sm"
                      className="h-6 rounded-lg px-2 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => claimMutation.mutate(q.activityType)}
                      disabled={isClaimPending}
                    >
                      {isClaimPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1">
                          Claim <ChevronRight className="size-3" />
                        </span>
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}