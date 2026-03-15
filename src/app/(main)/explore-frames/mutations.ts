import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Frame } from "@/generated/prisma";

export function useFramesQuery() {
  return useQuery({
    queryKey: ["frames"],
    queryFn: async () => {
      const res = await fetch("/api/frames");
      if (!res.ok) throw new Error("Failed to fetch frames");
      return res.json() as Promise<Frame[]>;
    },
  });
}

export function useUserOwnedFramesQuery() {
  return useQuery({
    queryKey: ["userOwnedFrames"],
    queryFn: async () => {
      const res = await fetch("/api/user-frames");
      if (!res.ok) throw new Error("Failed to fetch owned frames");
      return res.json() as Promise<Frame[]>;
    },
  });
}

export function useClaimFrameWithSPointMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frameId: string) => {
      const res = await fetch("/api/user-frames/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to claim frame");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOwnedFrames"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
    },
  });
}

export function useBuyFrameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frameId: string) => {
      const res = await fetch("/api/user-frames/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to purchase frame");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOwnedFrames"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
    },
  });
}

export function useUserBalanceQuery() {
  return useQuery({
    queryKey: ["userBalance"],
    queryFn: async () => {
      const res = await fetch("/api/user-balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
  });
}
