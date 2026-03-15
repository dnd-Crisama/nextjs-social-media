import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
import FrameOverlay from "./FrameOverlay";

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

export default function UserAvatar({
  avatarUrl,
  size,
  className,
  frame,
}: UserAvatarProps) {
  return (
    <div className="relative inline-block">
      <Image
        src={avatarUrl || avatarPlaceholder}
        alt="User avatar"
        width={size ?? 48}
        height={size ?? 48}
        className={cn(
          "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
          className,
        )}
      />
      {frame && (
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <img
            src={frame.imageUrl}
            alt={frame.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}