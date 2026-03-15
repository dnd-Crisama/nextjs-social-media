"use client";

import { logout } from "@/app/(auth)/actions";
import { useSession } from "@/app/(main)/SessionProvider";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import {
  Check,
  LogOutIcon,
  Monitor,
  Moon,
  Sun,
  UserIcon,
  Shield,
  Trophy,
  Sparkles,
  SparklesIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import UserAvatar from "./UserAvatar";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => kyInstance.get("/api/users/me").json<{ user: any }>(),
    staleTime: 60_000,
  });

  const fullUser = meData?.user ?? user;

  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const userIsAdmin = isAdmin(user);

  const { mode: motionMode, setMode: setMotionMode } = useMotionPreference();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex-none rounded-full border-0 ring-0 bg-transparent focus-visible:outline-none",
            className,
          )}
        >
          <UserAvatar avatarUrl={fullUser.avatarUrl} size={48} frame={fullUser.avatarFrame} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Logged in as @{user.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <Link href={`/users/${user.username}`}>
          <DropdownMenuItem>
            <UserIcon className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>
        </Link>

        <Link href="/explore-frames">
          <DropdownMenuItem>
            <span className="mr-2">⭐</span>
            Explore Frames
          </DropdownMenuItem>
        </Link>

        <Link href="/quests">
          <DropdownMenuItem>
            <Trophy className="mr-2 size-4" />
            Daily Quests
          </DropdownMenuItem>
        </Link>

        {userIsAdmin && (
          <>
            <DropdownMenuSeparator />
            <Link href="/admin">
              <DropdownMenuItem>
                <Shield className="mr-2 size-4" />
                Admin Panel
              </DropdownMenuItem>
            </Link>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Frame Motion Preference */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sparkles className="mr-2 size-4" />
            Reduce Motion
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setMotionMode("always")}>
                <SparklesIcon className="mr-2 size-4" />
                Always Animated
                {motionMode === "always" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMotionMode("hover-only")}>
                <Sparkles className="mr-2 size-4 opacity-40" />
                Animate on Hover
                {motionMode === "hover-only" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Theme */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="mr-2 size-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                System default
                {theme === "system" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-4" />
                Light
                {theme === "light" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-4" />
                Dark
                {theme === "dark" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            queryClient.clear();
            logout();
          }}
        >
          <LogOutIcon className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}