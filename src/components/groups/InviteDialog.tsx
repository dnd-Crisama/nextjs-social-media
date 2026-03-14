"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface InviteDialogProps {
  groupId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
}

export default function InviteDialog({
  groupId,
  isOpen,
  onOpenChange,
  onInviteSuccess,
}: InviteDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Search for users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["search-users", groupId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await kyInstance
        .get("/api/search", { searchParams: { q: searchQuery, type: "users" } })
        .json<{ users: User[] }>();
      return response.users || [];
    },
    enabled: isOpen && searchQuery.length > 0,
  });

  // Invite mutation
  const queryClient = useQueryClient();
  const { mutate: inviteUser, isPending: isInviting } = useMutation({
    mutationFn: async (userId: string) => {
      await kyInstance.post(`/api/groups/${groupId}/invite`, {
        json: { userId },
      });
    },
    onSuccess: () => {
      toast({
        description: "User invited successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
      onInviteSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description:
          error.response?.body?.error ||
          "Failed to invite user. Please try again.",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Search and invite users to this group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No users found
              </p>
            )}

            {!isSearching &&
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => inviteUser(user.id)}
                    disabled={isInviting}
                  >
                    {isInviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              ))}
          </div>

          {!searchQuery && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Type to search for users to invite
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
