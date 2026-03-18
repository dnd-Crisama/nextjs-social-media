"use client";

import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import CropImageDialog from "@/components/CropImageDialog";
import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserData } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ImageIcon, X } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Resizer from "react-image-file-resizer";
import { useUpdateProfileMutation } from "./mutations";
import { cn } from "@/lib/utils";

interface FrameData {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
}

interface EditProfileDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Frame Picker (Discord-style grid) ───────────────────────────────────────

interface FramePickerProps {
  frames: FrameData[];
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
  previewAvatarSrc?: string | StaticImageData;
  previewBannerSrc?: string | null;
  previewDisplayName?: string;
  type: "AVATAR" | "PROFILE";
}

function FramePicker({
  frames,
  selectedId,
  onSelect,
  previewAvatarSrc,
  previewBannerSrc,
  previewDisplayName,
  type,
}: FramePickerProps) {
  const filtered = frames.filter((f) => f.type === type);
  const selectedFrame = filtered.find((f) => f.id === selectedId) ?? null;

  // ── Grid (shared for both types) ──────────────────────────────
  const grid = (
    <div className="grid grid-cols-4 gap-2">
      {/* None tile */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all duration-150",
          !selectedId
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border bg-muted/40 hover:border-muted-foreground/40 hover:bg-muted/70",
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center">
            <X className="w-3 h-3 text-muted-foreground/60" />
          </div>
          <span className="text-[10px] text-muted-foreground leading-none">None</span>
        </div>
      </button>

      {filtered.map((frame) => (
        <button
          key={frame.id}
          type="button"
          onClick={() => onSelect(frame.id)}
          className={cn(
            "relative aspect-square rounded-lg border-2 overflow-hidden transition-all duration-150 group",
            selectedId === frame.id
              ? "border-primary shadow-md shadow-primary/20"
              : "border-border hover:border-muted-foreground/50",
          )}
          title={frame.name}
        >
          <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          {selectedId === frame.id && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
              <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );

  if (type === "AVATAR") {
    return (
      <div className="flex gap-4">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {grid}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No frames owned yet. Visit the shop!
            </p>
          )}
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Preview</span>
          <div className="relative w-16 h-16">
            <Image
              src={previewAvatarSrc || avatarPlaceholder}
              alt="Preview"
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
            />
            {selectedFrame && (
              <img
                src={selectedFrame.imageUrl}
                alt={selectedFrame.name}
                className="absolute -inset-0.5 w-[calc(100%+4px)] h-[calc(100%+4px)] object-contain pointer-events-none z-10 scale-125"
              />
            )}
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-background z-20" />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {selectedFrame ? selectedFrame.name : "No frame"}
          </span>
        </div>
      </div>
    );
  }

  // ── PROFILE type: full mini profile card preview ───────────────
  return (
    <div className="space-y-3">
      {/* Grid */}
      <div>
        {grid}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No profile effects owned yet. Visit the shop!
          </p>
        )}
      </div>

      {/* Mini profile card preview */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium block mb-2">
          Preview
        </span>
        <div className="w-56 rounded-xl overflow-hidden border border-border shadow-lg bg-card">
          {/* Banner area */}
          <div className="relative h-16">
            {previewBannerSrc ? (
              <img src={previewBannerSrc} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-muted" />
            )}
            {/* Profile effect overlay on banner */}
            {selectedFrame && (
              <img
                src={selectedFrame.imageUrl}
                alt={selectedFrame.name}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />
            )}
          </div>

          {/* Avatar (overlapping banner) */}
          <div className="px-3 pb-3">
            <div className="relative -mt-6 mb-2 w-12 h-12">
              <Image
                src={previewAvatarSrc || avatarPlaceholder}
                alt="Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full border-[3px] border-card"
              />
              {/* Online dot */}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card z-20" />
            </div>

            {/* Name */}
            <p className="text-sm font-semibold leading-tight truncate">
              {previewDisplayName || "Display Name"}
            </p>
          </div>
        </div>

        {selectedFrame && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {selectedFrame.name}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export default function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || "",
      avatarFrameId: user.avatarFrameId || undefined,
      bannerFrameId: user.bannerFrameId || undefined,
    },
  });

  const mutation = useUpdateProfileMutation();

  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const [croppedCover, setCroppedCover] = useState<Blob | null>(null);
  const [ownedFrames, setOwnedFrames] = useState<FrameData[]>([]);
  const [loadingFrames, setLoadingFrames] = useState(true);

  const avatarPreviewSrc = croppedAvatar
    ? URL.createObjectURL(croppedAvatar)
    : user.avatarUrl || avatarPlaceholder;

  const bannerPreviewSrc = croppedCover
    ? URL.createObjectURL(croppedCover)
    : user.coverImageUrl || null;

  useEffect(() => {
    if (!open) return;
    setLoadingFrames(true);
    fetch("/api/user-frames")
      .then((r) => (r.ok ? r.json() : []))
      .then(setOwnedFrames)
      .catch(() => setOwnedFrames([]))
      .finally(() => setLoadingFrames(false));
  }, [open]);

  async function onSubmit(values: UpdateUserProfileValues) {
    const newAvatarFile = croppedAvatar
      ? new File([croppedAvatar], `avatar_${user.id}.webp`)
      : undefined;
    const newCoverFile = croppedCover
      ? new File([croppedCover], `cover_${user.id}.webp`)
      : undefined;
    mutation.mutate(
      { values, avatar: newAvatarFile, cover: newCoverFile },
      {
        onSuccess: () => {
          setCroppedAvatar(null);
          setCroppedCover(null);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0">
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-4">
          {/* Cover image */}
          <div>
            <Label className="mb-1.5 block text-sm">Cover Image</Label>
            <CoverInput src={bannerPreviewSrc} onImageCropped={setCroppedCover} />
          </div>

          {/* Avatar */}
          <div>
            <Label className="mb-1.5 block text-sm">Avatar</Label>
            <AvatarInput src={avatarPreviewSrc} onImageCropped={setCroppedAvatar} />
          </div>

          <Form {...form}>
            <form
              id="edit-profile-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pb-4"
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Avatar Frame Picker */}
              <FormField
                control={form.control}
                name="avatarFrameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Decoration</FormLabel>
                    {loadingFrames ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <FramePicker
                        frames={ownedFrames}
                        selectedId={field.value}
                        onSelect={(id) => field.onChange(id)}
                        previewAvatarSrc={avatarPreviewSrc}
                        type="AVATAR"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner Frame Picker */}
              <FormField
                control={form.control}
                name="bannerFrameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Effect</FormLabel>
                    {loadingFrames ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <FramePicker
                        frames={ownedFrames}
                        selectedId={field.value}
                        onSelect={(id) => field.onChange(id)}
                        previewAvatarSrc={avatarPreviewSrc}
                        previewBannerSrc={bannerPreviewSrc}
                        previewDisplayName={form.watch("displayName") || user.displayName}
                        type="PROFILE"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="px-5 py-4 border-t shrink-0">
          <LoadingButton
            type="submit"
            form="edit-profile-form"
            loading={mutation.isPending}
          >
            Save changes
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cover Input ──────────────────────────────────────────────────────────────

interface CoverInputProps {
  src: string | null;
  onImageCropped: (blob: Blob | null) => void;
}

function CoverInput({ src, onImageCropped }: CoverInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onImageSelected(image: File | undefined) {
    if (!image) return;
    Resizer.imageFileResizer(
      image, 1500, 500, "WEBP", 90, 0,
      (uri) => setImageToCrop(uri as File),
      "file",
    );
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block w-full h-28 rounded-xl overflow-hidden bg-secondary hover:opacity-90 transition-opacity"
      >
        {src ? (
          <img src={src} alt="Cover preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-muted-foreground">
            <ImageIcon className="size-6" />
            <span className="text-xs">Choose cover image</span>
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity text-white">
          <Camera size={22} />
        </span>
      </button>
      {src && (
        <button
          type="button"
          onClick={() => onImageCropped(null)}
          className="mt-1 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <X size={12} /> Remove cover image
        </button>
      )}
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={3 / 1}
          onCropped={onImageCropped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
    </>
  );
}

// ─── Avatar Input ─────────────────────────────────────────────────────────────

interface AvatarInputProps {
  src: string | StaticImageData;
  onImageCropped: (blob: Blob | null) => void;
}

function AvatarInput({ src, onImageCropped }: AvatarInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onImageSelected(image: File | undefined) {
    if (!image) return;
    Resizer.imageFileResizer(
      image, 1024, 1024, "WEBP", 100, 0,
      (uri) => setImageToCrop(uri as File),
      "file",
    );
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block mb-2"
      >
        <Image
          src={src}
          alt="Avatar preview"
          width={80}
          height={80}
          className="size-20 flex-none rounded-full object-cover"
        />
        <span className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-full bg-black bg-opacity-30 text-white transition-colors duration-200 group-hover:bg-opacity-25">
          <Camera size={18} />
        </span>
      </button>
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={1}
          onCropped={onImageCropped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
    </>
  );
}