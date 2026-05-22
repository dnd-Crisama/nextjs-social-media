"use client";

import { PostData } from "@/lib/types";
import { Media } from "@/generated/prisma";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { useUpdatePostMutation } from "./editor/mutations";
import "./editor/styles.css";
import useMediaUpload, { Attachment } from "./useMediaUpload";
import { useDropzone } from "@uploadthing/react";
import EmojiPicker from "@/components/EmojiPicker";

interface EditPostDialogProps {
  post: PostData;
  open: boolean;
  onClose: () => void;
}

// Represents an existing attachment already saved in the database
interface ExistingAttachment {
  id: string;
  url: string;
  type: string;
}

// Union type for all attachments in the edit dialog
type EditAttachment =
  | { kind: "existing"; data: ExistingAttachment }
  | { kind: "new"; data: Attachment };

export default function EditPostDialog({
  post,
  open,
  onClose,
}: EditPostDialogProps) {
  const mutation = useUpdatePostMutation();

  // 1. Text state initialized from the post content
  const [input, setInput] = useState(post.content);

  // 2. Existing attachments from the database (can be removed but not re-uploaded)
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >(() =>
    post.attachments.map((a: Media) => ({
      id: a.id,
      url: a.url,
      type: a.type,
    }))
  );

  // Track IDs of existing attachments that were removed during editing
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

  // 3. New attachments being added (via upload)
  const {
    startUpload,
    attachments: newAttachments,
    isUploading,
    uploadProgress,
    removeAttachment: removeNewAttachment,
    reset: resetNewUploads,
  } = useMediaUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: startUpload,
  });

  const { onClick, ...rootProps } = getRootProps();

  // 4. TipTap Editor initialized with post content
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "What's on your mind?",
      }),
    ],
    immediatelyRender: false,
    onUpdate({ editor }) {
      setInput(
        editor.getText({
          blockSeparator: "\n",
        })
      );
    },
  });

  // Set editor content when dialog opens
  useEffect(() => {
    if (open && editor) {
      editor.commands.setContent(post.content);
      setInput(post.content);
      setExistingAttachments(
        post.attachments.map((a: Media) => ({
          id: a.id,
          url: a.url,
          type: a.type,
        }))
      );
      setDeletedMediaIds([]);
      resetNewUploads();
    }
  }, [open, editor, post, resetNewUploads]);

  // Total attachment count (existing + new)
  const totalAttachmentCount = existingAttachments.length + newAttachments.length;

  // 5. Submit handler
  function onSubmit() {
    if ((!input.trim() && totalAttachmentCount === 0) || isUploading) return;

    // Combine media IDs: existing (kept) + new (uploaded)
    const existingMediaIds = existingAttachments.map((a) => a.id);
    const newMediaIds = newAttachments
      .map((a) => a.mediaId)
      .filter(Boolean) as string[];
    const allMediaIds = [...existingMediaIds, ...newMediaIds];

    mutation.mutate(
      {
        postId: post.id,
        content: input,
        mediaIds: allMediaIds,
        deletedMediaIds,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) {
      onClose();
    }
  }

  // Remove an existing attachment
  function removeExistingAttachment(mediaId: string) {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== mediaId));
    setDeletedMediaIds((prev) => [...prev, mediaId]);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Editor area */}
          <div {...rootProps} className="w-full">
            <EditorContent
              editor={editor}
              className={cn(
                "max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3",
                isDragActive && "outline-dashed"
              )}
              onPaste={onPaste}
            />
            <input {...getInputProps()} />
          </div>

          {/* Existing attachments preview */}
          {existingAttachments.length > 0 && (
            <div
              className={cn(
                "flex flex-col gap-3",
                existingAttachments.length > 1 && "sm:grid sm:grid-cols-2"
              )}
            >
              {existingAttachments.map((attachment) => (
                <ExistingAttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemoveClick={() => removeExistingAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          {/* New attachments preview */}
          {newAttachments.length > 0 && (
            <div
              className={cn(
                "flex flex-col gap-3",
                newAttachments.length > 1 && "sm:grid sm:grid-cols-2"
              )}
            >
              {newAttachments.map((attachment) => (
                <NewAttachmentPreview
                  key={attachment.file.name}
                  attachment={attachment}
                  onRemoveClick={() => removeNewAttachment(attachment.file.name)}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-3">
          {/* Upload progress indicator */}
          {isUploading && (
            <>
              <span className="text-sm font-medium">
                {uploadProgress ?? 0}%
              </span>
              <Loader2 className="size-5 animate-spin text-primary" />
            </>
          )}

          {/* Add attachment button */}
          <AddAttachmentsButton
            onFilesSelected={startUpload}
            disabled={isUploading || totalAttachmentCount >= 5}
          />

          {/* Emoji picker */}
          <EmojiPicker
            onEmojiSelect={(emoji) => editor?.commands.insertContent(emoji)}
          />

          {/* Save button */}
          <LoadingButton
            onClick={onSubmit}
            loading={mutation.isPending}
            disabled={
              (!input.trim() && totalAttachmentCount === 0) || isUploading
            }
            className="min-w-20"
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExistingAttachmentPreviewProps {
  attachment: ExistingAttachment;
  onRemoveClick: () => void;
}

function ExistingAttachmentPreview({
  attachment,
  onRemoveClick,
}: ExistingAttachmentPreviewProps) {
  if (attachment.type === "IMAGE") {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
        <Image
          src={attachment.url}
          alt="Attachment preview"
          fill
          className="object-cover"
        />
        <button
          onClick={onRemoveClick}
          className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  if (attachment.type === "VIDEO") {
    return (
      <div className="relative">
        <video
          src={attachment.url}
          controls
          className="mx-auto size-fit max-h-[30rem] rounded-2xl"
        />
        <button
          onClick={onRemoveClick}
          className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return <p className="text-destructive">Unsupported media type</p>;
}

interface NewAttachmentPreviewProps {
  attachment: Attachment;
  onRemoveClick: () => void;
}

function NewAttachmentPreview({
  attachment: { file, isUploading },
  onRemoveClick,
}: NewAttachmentPreviewProps) {
  const src = URL.createObjectURL(file);

  return (
    <div
      className={cn("relative mx-auto size-fit", isUploading && "opacity-50")}
    >
      {file.type.startsWith("image") ? (
        <Image
          src={src}
          alt="New attachment preview"
          width={500}
          height={500}
          className="size-fit max-h-[30rem] rounded-2xl object-cover"
        />
      ) : (
        <video controls className="size-fit max-h-[30rem] rounded-2xl">
          <source src={src} type={file.type} />
        </video>
      )}
      {!isUploading && (
        <button
          onClick={onRemoveClick}
          className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

interface AddAttachmentsButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

function AddAttachmentsButton({
  onFilesSelected,
  disabled,
}: AddAttachmentsButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary hover:text-primary"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon size={20} />
      </Button>
      <input
        type="file"
        accept="image/*, video/*"
        multiple
        ref={fileInputRef}
        className="sr-only hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) {
            onFilesSelected(files);
            e.target.value = "";
          }
        }}
      />
    </>
  );
}
