"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/app/(main)/SessionProvider";
import { useToast } from "@/components/ui/use-toast";
import { Frame } from "@/generated/prisma";
import { useState } from "react";
import {
  useClaimFrameWithSPointMutation,
  useFramesQuery,
  useUserBalanceQuery,
  useUserOwnedFramesQuery,
} from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import { cn } from "@/lib/utils";
import { CheckCircle, Gift, Sparkles, Star } from "lucide-react";

export default function ExploreFramesPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const { data: frames, isLoading: framesLoading } = useFramesQuery();
  const { data: balance } = useUserBalanceQuery();
  const { data: ownedFramesData, refetch: refetchOwned } = useUserOwnedFramesQuery();
  const { mutate: claimFrame } = useClaimFrameWithSPointMutation();

  // Track WHICH frame is being claimed — not just "something is loading"
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const ownedFrameIds = new Set((ownedFramesData ?? []).map((f: Frame) => f.id));

  const handleClaimFrame = (frameId: string, spointCost: number) => {
    if (spointCost > 0 && (!balance || balance.pointsBalance < spointCost)) {
      toast({
        title: "Insufficient SPoints",
        description: `You need ${spointCost} SPoints. You have ${balance?.pointsBalance ?? 0}.`,
        variant: "destructive",
      });
      return;
    }

    // Only THIS frame shows loading
    setClaimingId(frameId);

    claimFrame(frameId, {
      onSuccess: () => {
        toast({
          title: spointCost === 0 ? "🎁 Free frame claimed!" : "✨ Frame claimed!",
          description: "Equip it from Edit Profile.",
        });
        refetchOwned();
        setClaimingId(null);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to claim frame",
          variant: "destructive",
        });
        setClaimingId(null);
      },
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-muted-foreground">Please log in to explore frames.</p>
      </div>
    );
  }

  const avatarFrames = frames?.filter((f) => f.type === "AVATAR") ?? [];
  const profileFrames = frames?.filter((f) => f.type === "PROFILE") ?? [];

  return (
    <div className="w-full min-w-0 space-y-8 pb-10">
      {/* Header */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              Explore Frames
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Customize your profile with unique frames. Equip them from{" "}
              <span className="font-medium text-foreground">Edit Profile</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2">
            <Star className="size-4 text-primary fill-primary" />
            <span className="font-bold text-primary">{balance?.pointsBalance ?? 0}</span>
            <span className="text-sm text-muted-foreground">SPoints</span>
          </div>
        </div>
      </div>

      {framesLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {avatarFrames.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-primary" />
                Avatar Frames
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {avatarFrames.map((frame) => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    isOwned={ownedFrameIds.has(frame.id)}
                    // ✅ Only this specific frame's button shows loading
                    isClaiming={claimingId === frame.id}
                    onClaim={() => handleClaimFrame(frame.id, frame.spointCost)}
                  />
                ))}
              </div>
            </section>
          )}

          {profileFrames.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-sky-500" />
                Profile Banner Frames
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileFrames.map((frame) => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    isOwned={ownedFrameIds.has(frame.id)}
                    // ✅ Only this specific frame's button shows loading
                    isClaiming={claimingId === frame.id}
                    onClaim={() => handleClaimFrame(frame.id, frame.spointCost)}
                  />
                ))}
              </div>
            </section>
          )}

          {!frames?.length && (
            <div className="flex justify-center items-center min-h-64 rounded-2xl bg-card">
              <p className="text-muted-foreground">No frames available yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface FrameCardProps {
  frame: Frame;
  isOwned: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}

function FrameCard({ frame, isOwned, isClaiming, onClaim }: FrameCardProps) {
  const isFree = frame.spointCost === 0 && frame.price === 0;
  const isPaidMoney = frame.price > 0 && frame.spointCost === 0;

  return (
    <div className={cn(
      "group relative rounded-2xl border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md",
      isOwned && "border-primary/50 bg-primary/5",
    )}>
      {/* Preview */}
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        <img
          src={frame.imageUrl}
          alt={frame.name}
          className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium border border-border/50">
          {frame.type === "AVATAR" ? "Avatar" : "Banner"}
        </div>
        {isOwned && (
          <div className="absolute top-2 right-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground flex items-center gap-1">
            <CheckCircle className="size-3" /> Owned
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{frame.name}</h3>
        {frame.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{frame.description}</p>
        )}

        {/* Price tag */}
        <div className="mt-2 mb-3">
          {isFree && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <Gift className="size-3" /> Free
            </span>
          )}
          {frame.spointCost > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Star className="size-3 fill-primary" /> {frame.spointCost} SPoints
            </span>
          )}
          {isPaidMoney && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
              💰 ${frame.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Button — isClaiming chỉ true với đúng frame này */}
        {isOwned ? (
          <Button disabled variant="outline" className="w-full text-sm">
            <CheckCircle className="size-4 mr-1.5 text-primary" /> Owned
          </Button>
        ) : isPaidMoney ? (
          <Button disabled variant="outline" className="w-full text-sm opacity-60">
            💰 Buy with Money (Soon)
          </Button>
        ) : (
          <LoadingButton
            onClick={onClaim}
            loading={isClaiming}
            className="w-full text-sm"
          >
            {isFree ? (
              <span className="flex items-center gap-1.5">
                <Gift className="size-4" /> Claim Free
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Star className="size-4" /> Claim with {frame.spointCost} SPoints
              </span>
            )}
          </LoadingButton>
        )}
      </div>
    </div>
  );
}