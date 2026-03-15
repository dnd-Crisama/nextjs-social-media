"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import CreateFrameDialog from "../dialogs/CreateFrameDialog";
import EditFrameDialog from "../dialogs/EditFrameDialog";
import DeleteFrameDialog from "../dialogs/DeleteFrameDialog";

interface FrameData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  price: number;
  spointCost: number;
  type: string;
  createdAt: Date;
}

export default function FramesManagementTab() {
  const { toast } = useToast();
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: frames, isLoading, refetch } = useQuery({
    queryKey: ["admin:frames"],
    queryFn: async () => {
      const res = await fetch("/api/frames");
      if (!res.ok) throw new Error("Failed to fetch frames");
      return res.json() as Promise<FrameData[]>;
    },
  });

  const handleEdit = (frame: FrameData) => {
    setSelectedFrame(frame);
    setShowEditDialog(true);
  };

  const handleDelete = (frame: FrameData) => {
    setSelectedFrame(frame);
    setShowDeleteDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    refetch();
    toast({ description: "Frame created successfully" });
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setSelectedFrame(null);
    refetch();
    toast({ description: "Frame updated successfully" });
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    setSelectedFrame(null);
    refetch();
    toast({ description: "Frame deleted successfully" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div>
        <Button onClick={() => setShowCreateDialog(true)}>+ Create Frame</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-6 py-3 text-left font-semibold">Frame Name</th>
                <th className="px-6 py-3 text-left font-semibold">Description</th>
                <th className="px-6 py-3 text-center font-semibold">Type</th>
                <th className="px-6 py-3 text-center font-semibold">Price</th>
                <th className="px-6 py-3 text-center font-semibold">SPoints</th>
                <th className="px-6 py-3 text-center font-semibold">Created</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {frames && frames.length > 0 ? (
                frames.map((frame) => (
                  <tr key={frame.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 font-medium">{frame.name}</td>
                    <td className="px-6 py-3 text-muted-foreground max-w-xs truncate">
                      {frame.description || "—"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-primary/10 px-2 py-1 rounded text-xs font-semibold">
                        {frame.type === "AVATAR" ? "Avatar" : "Profile"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {frame.price > 0 ? `$${frame.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {frame.spointCost > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <span>⭐</span>
                          {frame.spointCost}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3 text-center text-muted-foreground text-xs">
                      {new Date(frame.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(frame)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(frame)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No frames yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateFrameDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedFrame && (
        <>
          <EditFrameDialog
            frame={selectedFrame}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={handleEditSuccess}
          />
          <DeleteFrameDialog
            frame={selectedFrame}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  );
}
