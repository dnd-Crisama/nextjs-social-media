"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LoadingButton from "@/components/LoadingButton";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface FrameData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  price: number;
  spointCost: number;
  type?: string;
  createdAt?: Date;
}

interface DeleteFrameDialogProps {
  frame: FrameData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteFrameDialog({
  frame,
  open,
  onOpenChange,
  onSuccess,
}: DeleteFrameDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/frames?id=${frame.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete frame");
      }

      onSuccess();
      toast({
        title: "Success",
        description: "Frame deleted successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete frame",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Frame</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{frame.name}"? This action cannot be undone.
            Users who own this frame will still keep it, but it won't be available for new purchases.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={isLoading}
            onClick={handleDelete}
          >
            Delete Frame
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
