"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import InviteDialog from "./InviteDialog";
import { UserPlus } from "lucide-react";

interface InviteButtonProps {
  groupId: string;
  onInviteSuccess?: () => void;
}

export default function InviteButton({
  groupId,
  onInviteSuccess,
}: InviteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Invite Members
      </Button>
      <InviteDialog
        groupId={groupId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onInviteSuccess={() => {
          onInviteSuccess?.();
          setIsDialogOpen(false);
        }}
      />
    </>
  );
}
