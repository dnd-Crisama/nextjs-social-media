"use client";

import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import { useMotionMode } from "@/hooks/useMotionPreference";
import Image from "next/image";
import { useRef, useEffect, useCallback, useState } from "react";

interface FrameData {
  id: string;
  name: string;
  imageUrl: string;
}

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  size?: number;
  className?: string;
  frame?: FrameData | null;
}

// Class gốc của bạn — giữ nguyên để sizing đúng
const FRAME_CLASS =
  "absolute -inset-0.4 w-full h-full object-contain pointer-events-none z-10 scale-125 ring-0 border-0";

// Mode "always": code gốc của bạn, luôn animated
function FrameAlways({ frame }: { frame: FrameData }) {
  return (
    <img
      src={frame.imageUrl}
      alt={frame.name}
      className={FRAME_CLASS}
    />
  );
}

// Mode "hover-only": canvas tĩnh khi không hover, animated khi hover
function FrameHoverOnly({ frame, avatarSize }: { frame: FrameData; avatarSize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const captureFirstFrame = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = Math.round(avatarSize * 1.25);
    canvas.width = s;
    canvas.height = s;
    ctx.drawImage(img, 0, 0, s, s);
  }, [avatarSize]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      captureFirstFrame();
    } else {
      img.addEventListener("load", captureFirstFrame, { once: true });
      return () => img.removeEventListener("load", captureFirstFrame);
    }
  }, [frame.imageUrl, captureFirstFrame]);

  return (
    // Wrapper riêng để bắt hover — tách khỏi avatar chính
    <div
      className="absolute inset-0 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        className={FRAME_CLASS}
        style={{ display: isHovered ? "none" : "block" }}
      />
      <img
        ref={imgRef}
        src={frame.imageUrl}
        alt={frame.name}
        className={FRAME_CLASS}
        style={{ display: isHovered ? "block" : "none" }}
      />
    </div>
  );
}

export default function UserAvatar({
  avatarUrl,
  size,
  className,
  frame,
}: UserAvatarProps) {
  const avatarSize = size ?? 48;
  const motionMode = useMotionMode();

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border-0 ring-0",
        className,
      )}
      style={{ width: avatarSize, height: avatarSize }}
    >
      <Image
        src={avatarUrl || avatarPlaceholder}
        alt="User avatar"
        width={avatarSize}
        height={avatarSize}
        className="w-full h-full object-cover bg-transparent rounded-full ring-0 border-0"
      />

      {frame && (
        motionMode === "always"
          ? <FrameAlways frame={frame} />
          : <FrameHoverOnly frame={frame} avatarSize={avatarSize} />
      )}
    </div>
  );
}