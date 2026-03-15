"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/app/(main)/SessionProvider";
import { useToast } from "@/components/ui/use-toast";
import { Frame } from "@/generated/prisma";
import { useEffect, useState } from "react";
import { useClaimFrameWithSPointMutation, useFramesQuery, useUserBalanceQuery } from "./mutations";
import LoadingButton from "@/components/LoadingButton";

export default function ExploreFramesPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const { data: frames, isLoading: framesLoading } = useFramesQuery();
  const { data: balance } = useUserBalanceQuery();
  const { mutate: claimFrame, isPending: claiming } = useClaimFrameWithSPointMutation();
  const [ownedFrameIds, setOwnedFrameIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch user's owned frames
    const fetchOwnedFrames = async () => {
      try {
        const res = await fetch("/api/user-frames");
        if (res.ok) {
          const owned = await res.json();
          setOwnedFrameIds(new Set(owned.map((f: Frame) => f.id)));
        }
      } catch (error) {
        console.error("Failed to fetch owned frames:", error);
      }
    };

    fetchOwnedFrames();
  }, []);

  const handleClaimFrame = (frameId: string, cost: number) => {
    if (!balance || balance.pointsBalance < cost) {
      toast({
        title: "Insufficient SPoints",
        description: `You need ${cost} SPoints to claim this frame. You have ${balance?.pointsBalance || 0}.`,
        variant: "destructive",
      });
      return;
    }

    claimFrame(frameId, {
      onSuccess: () => {
        toast({
          title: "Frame claimed!",
          description: "You can now use this frame in your profile.",
        });
        setOwnedFrameIds((prev) => new Set([...prev, frameId]));
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to claim frame",
          variant: "destructive",
        });
      },
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please log in to explore frames.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore Frames</h1>
        <p className="text-muted-foreground mt-2">
          Customize your profile with unique frames. You have{" "}
          <span className="font-semibold text-primary">{balance?.pointsBalance || 0}</span> SPoints.
        </p>
      </div>

      {framesLoading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : frames && frames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.map((frame) => (
            <FrameCard
              key={frame.id}
              frame={frame}
              isOwned={ownedFrameIds.has(frame.id)}
              isClaiming={claiming}
              onClaim={() => handleClaimFrame(frame.id, frame.spointCost)}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-96">
          <p className="text-lg text-muted-foreground">No frames available yet.</p>
        </div>
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
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={frame.imageUrl}
          alt={frame.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold">
          {frame.type === "AVATAR" ? "Avatar" : "Profile"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{frame.name}</h3>
        {frame.description && (
          <p className="text-sm text-muted-foreground mb-3">{frame.description}</p>
        )}

        <div className="mb-4 text-sm">
          {frame.spointCost > 0 && (
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span>⭐</span>
              <span>{frame.spointCost} SPoints</span>
            </div>
          )}
          {frame.price > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>💰</span>
              <span>${frame.price.toFixed(2)}</span>
            </div>
          )}
        </div>

        {isOwned ? (
          <Button disabled className="w-full">
            ✓ Owned
          </Button>
        ) : frame.spointCost > 0 ? (
          <LoadingButton
            onClick={onClaim}
            loading={isClaiming}
            className="w-full"
          >
            Claim with SPoints
          </LoadingButton>
        ) : frame.price > 0 ? (
          <Button disabled className="w-full">
            💰 Buy with Money (Coming Soon)
          </Button>
        ) : (
          <Button disabled className="w-full">
            Free
          </Button>
        )}
      </div>
    </div>
  );
}
