"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import LoadingButton from "@/components/LoadingButton";
import { useToast } from "@/components/ui/use-toast";

interface CreateFrameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateFrameDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFrameDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "0",
    spointCost: "0",
    type: "AVATAR" as "AVATAR" | "PROFILE",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "type" ? (value as "AVATAR" | "PROFILE") : value,
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Image URL is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          price: parseFloat(formData.price) || 0,
          spointCost: parseInt(formData.spointCost) || 0,
          type: formData.type,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create frame");
      }

      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        price: "0",
        spointCost: "0",
        type: "AVATAR",
      });
      onSuccess();
      toast({
        title: "Success",
        description: "Frame created successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create frame",
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
          <DialogTitle>Create Frame</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Frame Name</label>
            <Input
              name="name"
              placeholder="e.g., Golden Crown"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              placeholder="Describe the frame..."
              className="resize-none"
              rows={2}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              name="imageUrl"
              placeholder="https://example.com/frame.png"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Frame Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="AVATAR">Avatar Frame</option>
              <option value="PROFILE">Profile Banner Frame</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Price ($)</label>
              <Input
                type="number"
                name="price"
                placeholder="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium">SPoints Cost</label>
              <Input
                type="number"
                name="spointCost"
                placeholder="0"
                value={formData.spointCost}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={isLoading}>
              Create Frame
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
