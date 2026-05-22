import { useState, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export interface Attachment {
  file: File;
  mediaId?: string;
  isUploading: boolean;
  progress?: number;
}

export default function useMediaUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();

  const { startUpload } = useUploadThing("attachment", {
    onClientUploadComplete: (res: any) => {
      if (res) {
        setAttachments((prev) =>
          prev.map((att) => {
            const uploaded = res.find((r: any) => r.name === att.file.name);
            return uploaded
              ? { ...att, mediaId: uploaded.mediaId, isUploading: false }
              : att;
          })
        );
      }
      setIsUploading(false);
      setUploadProgress(undefined);
    },
    onUploadProgress: (progress: number) => {
      setUploadProgress(progress);
    },
  });

  const handleUpload = useCallback(
    async (files: File[]) => {
      const newAttachments: Attachment[] = files.map((file) => ({
        file,
        isUploading: true,
        progress: 0,
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      setIsUploading(true);

      try {
        await startUpload(files);
      } catch (error) {
        console.error("Upload failed:", error);
        setAttachments((prev) =>
          prev.filter((att) => !files.includes(att.file))
        );
        setIsUploading(false);
      }
    },
    [startUpload]
  );

  const removeAttachment = useCallback((fileName: string) => {
    setAttachments((prev) => prev.filter((att) => att.file.name !== fileName));
  }, []);

  const reset = useCallback(() => {
    setAttachments([]);
    setIsUploading(false);
    setUploadProgress(undefined);
  }, []);

  return {
    attachments,
    isUploading,
    uploadProgress,
    startUpload: handleUpload,
    removeAttachment,
    reset,
  };
}
