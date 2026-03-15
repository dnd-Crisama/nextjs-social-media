"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateGroupSchema, UpdateGroupValues } from "@/lib/validation";
import {
  updateGroupSettings,
  deleteGroup as deleteGroupAction,
} from "@/app/(main)/groups/actions";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Settings, Trash2, Upload, X } from "lucide-react";
import { GroupData } from "@/lib/types";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/components/ui/use-toast";
import CropImageDialog from "@/components/CropImageDialog";

interface GroupSettingsProps {
  group: GroupData;
}

export default function GroupSettings({ group }: GroupSettingsProps) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    group.avatarUrl || null
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    group.coverImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop dialog states
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [showCoverCrop, setShowCoverCrop] = useState(false);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const { startUpload: startAvatarUpload } = useUploadThing("groupAvatar");
  const { startUpload: startCoverUpload } = useUploadThing("groupCoverImage");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateGroupValues>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description || "",
      isPublic: group.isPublic,
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setAvatarCropSrc(src);
        setShowAvatarCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropped = (blob: Blob | null) => {
    if (blob) {
      const file = new File([blob], "avatar.webp", { type: "image/webp" });
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(blob);
    }
    setShowAvatarCrop(false);
    setAvatarCropSrc(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setCoverCropSrc(src);
        setShowCoverCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverCropped = (blob: Blob | null) => {
    if (blob) {
      const file = new File([blob], "cover.webp", { type: "image/webp" });
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(blob);
    }
    setShowCoverCrop(false);
    setCoverCropSrc(null);
  };

  const onSubmit = async (data: UpdateGroupValues) => {
    try {
      setIsLoading(true);
      let avatarUrl = data.avatarUrl || group.avatarUrl;
      let coverImageUrl = data.coverImageUrl || group.coverImageUrl;

      // Upload avatar if changed
      if (avatarFile) {
        setIsUploading(true);
        const avatarRes = await startAvatarUpload([avatarFile]);
        if (avatarRes && avatarRes.length > 0) {
          avatarUrl = avatarRes[0].url;
        }
        setIsUploading(false);
      }

      // Upload cover if changed
      if (coverFile) {
        setIsUploading(true);
        const coverRes = await startCoverUpload([coverFile]);
        if (coverRes && coverRes.length > 0) {
          coverImageUrl = coverRes[0].url;
        }
        setIsUploading(false);
      }

      await updateGroupSettings(group.id, {
        ...data,
        avatarUrl: avatarUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: ["group", group.id],
      });

      setAvatarFile(null);
      setCoverFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update group:", error);
      toast({
        variant: "destructive",
        description: "Failed to update group. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGroupAction(group.id);

      await queryClient.invalidateQueries({
        queryKey: ["groups"],
      });

      router.push("/groups");
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete group. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isSubmitDisabled = isLoading || isUploading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Manage your group's information and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Group Avatar</Label>
            <div className="flex items-center gap-4">
              {avatarPreview && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isSubmitDisabled}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              {avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(group.avatarUrl || null);
                  }}
                  disabled={isSubmitDisabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="space-y-2">
              {coverPreview && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                disabled={isSubmitDisabled}
                className="cursor-pointer"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 5MB
                </p>
                {coverFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(group.coverImageUrl || null);
                    }}
                    disabled={isSubmitDisabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="Group name"
              {...register("name")}
              disabled={isSubmitDisabled}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Group description"
              {...register("description")}
              disabled={isSubmitDisabled}
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isPublic")}
                disabled={isSubmitDisabled}
                className="rounded border border-input"
              />
              <span>Public Group</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Unchecked = Private group
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitDisabled}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {(isLoading || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? "Uploading..." : "Save Changes"}
            </Button>
          </div>
        </form>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm font-medium">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Avatar Crop Dialog */}
      {showAvatarCrop && avatarCropSrc && (
        <CropImageDialog
          src={avatarCropSrc}
          cropAspectRatio={1}
          onCropped={handleAvatarCropped}
          onClose={() => {
            setShowAvatarCrop(false);
            setAvatarCropSrc(null);
          }}
        />
      )}

      {/* Cover Crop Dialog */}
      {showCoverCrop && coverCropSrc && (
        <CropImageDialog
          src={coverCropSrc}
          cropAspectRatio={16 / 9}
          onCropped={handleCoverCropped}
          onClose={() => {
            setShowCoverCrop(false);
            setCoverCropSrc(null);
          }}
        />
      )}
    </Dialog>
  );
}
